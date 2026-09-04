<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use App\Models\ActivityLog;
use App\Models\Business;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Cache;
use App\Repositories\BusinessRepository;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\BusinessesImport;
use App\Exports\BusinessesExport;
use Illuminate\Support\Facades\Log;

class DatabaseController extends Controller
{
    /**
     * Get database status and backup information
     */
    public function status()
    {
        // Require Super Admin
        if (Auth::user()->role !== 'Super Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            // Get database size
            $sizeResult = DB::select("SELECT pg_size_pretty(pg_database_size(current_database())) as size");
            $dbSize = $sizeResult[0]->size ?? 'Unknown';

            // Get total records from all tables
            $recordsResult = DB::select("SELECT sum(n_live_tup) as total FROM pg_stat_user_tables");
            $totalRecords = $recordsResult[0]->total ?? 0;

            // Get backup information
            $backupPath = storage_path('app/backups');
            if (!File::exists($backupPath)) {
                File::makeDirectory($backupPath, 0755, true);
            }

            $files = File::files($backupPath);
            $backups = [];
            
            foreach ($files as $file) {
                if ($file->getExtension() === 'sql' || $file->getExtension() === 'dump') {
                    $backups[] = [
                        'name' => $file->getFilename(),
                        'size' => $this->formatBytes($file->getSize()),
                        'size_bytes' => $file->getSize(),
                        'date' => date('d M Y H:i', $file->getMTime()),
                        'timestamp' => $file->getMTime()
                    ];
                }
            }

            // Sort backups by timestamp descending
            usort($backups, function($a, $b) {
                return $b['timestamp'] <=> $a['timestamp'];
            });

            $lastBackup = count($backups) > 0 ? $backups[0]['date'] : 'Belum ada backup';

            return response()->json([
                'status' => 'success',
                'data' => [
                    'database_size' => $dbSize,
                    'total_records' => number_format($totalRecords, 0, ',', '.'),
                    'last_backup' => $lastBackup,
                    'available_backups' => count($backups),
                    'backups' => $backups
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get database status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Run database backup
     */
    public function backup(Request $request)
    {
        if (Auth::user()->role !== 'Super Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $backupPath = storage_path('app/backups');
        if (!File::exists($backupPath)) {
            File::makeDirectory($backupPath, 0755, true);
        }

        $filename = 'backup_map_perizinan_' . date('Y_m_d_H_i_s') . '.sql';
        $fullPath = $backupPath . '/' . $filename;

        // Get DB credentials from config
        $dbHost = config('database.connections.pgsql.host');
        $dbPort = config('database.connections.pgsql.port');
        $dbName = config('database.connections.pgsql.database');
        $dbUser = config('database.connections.pgsql.username');
        $dbPass = config('database.connections.pgsql.password');

        // Set PGPASSWORD environment variable
        $env = ['PGPASSWORD' => $dbPass];
        
        // Ensure path to pg_dump is available or use default
        // In Laragon, PostgreSQL bin should be in PATH, or specify full path if needed
        $pgDump = 'pg_dump'; 
        
        $command = [
            $pgDump,
            '-h', $dbHost,
            '-p', $dbPort,
            '-U', $dbUser,
            '-F', 'c', // Custom format for smaller size and easier restore
            '-f', $fullPath,
            $dbName
        ];

        try {
            // Alternatively use plain SQL format for simpler backups:
            $command = [
                $pgDump,
                '-h', $dbHost,
                '-p', $dbPort,
                '-U', $dbUser,
                '--clean', // Add DROP statements
                '--if-exists',
                '-f', $fullPath,
                $dbName
            ];

            $process = new Process($command, null, $env);
            $process->setTimeout(300); // 5 minutes timeout
            $process->run();

            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }
            
            $this->logActivity('Backup Database', "Membuat backup database: $filename", $request);

            return response()->json([
                'status' => 'success',
                'message' => 'Backup berhasil dibuat',
                'filename' => $filename
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Backup gagal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore database from backup
     */
    public function restore(Request $request)
    {
        if (Auth::user()->role !== 'Super Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'filename' => 'required|string'
        ]);

        $filename = $request->filename;
        $fullPath = storage_path('app/backups/' . $filename);

        if (!File::exists($fullPath)) {
            return response()->json(['status' => 'error', 'message' => 'File backup tidak ditemukan'], 404);
        }

        // Get DB credentials
        $dbHost = config('database.connections.pgsql.host');
        $dbPort = config('database.connections.pgsql.port');
        $dbName = config('database.connections.pgsql.database');
        $dbUser = config('database.connections.pgsql.username');
        $dbPass = config('database.connections.pgsql.password');

        $env = ['PGPASSWORD' => $dbPass];
        
        try {
            $command = [
                'psql',
                '-h', $dbHost,
                '-p', $dbPort,
                '-U', $dbUser,
                '-d', $dbName,
                '-f', $fullPath
            ];

            $process = new Process($command, null, $env);
            $process->setTimeout(600); // 10 minutes timeout
            $process->run();

            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }
            
            $this->logActivity('Restore Database', "Melakukan restore database dari: $filename", $request);

            return response()->json([
                'status' => 'success',
                'message' => 'Database berhasil direstore'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Restore gagal: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete backup file
     */
    public function deleteBackup(Request $request)
    {
        if (Auth::user()->role !== 'Super Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $request->validate(['filename' => 'required|string']);
        $fullPath = storage_path('app/backups/' . $request->filename);
        
        if (File::exists($fullPath)) {
            File::delete($fullPath);
            $this->logActivity('Delete Backup', "Menghapus file backup: {$request->filename}", $request);
            return response()->json(['status' => 'success', 'message' => 'Backup berhasil dihapus']);
        }
        
        return response()->json(['status' => 'error', 'message' => 'File tidak ditemukan'], 404);
    }

    /**
     * Download backup file
     */
    public function downloadBackup($filename)
    {
        if (Auth::user()->role !== 'Super Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $fullPath = storage_path('app/backups/' . $filename);
        
        if (File::exists($fullPath)) {
            $this->logActivity('Download Backup', "Mengunduh file backup: $filename", request());
            return response()->download($fullPath);
        }
        
        return response()->json(['status' => 'error', 'message' => 'File tidak ditemukan'], 404);
    }

    /**
     * Helper to format bytes
     */
    private function formatBytes($bytes, $precision = 2) { 
        $units = array('B', 'KB', 'MB', 'GB', 'TB'); 

        $bytes = max($bytes, 0); 
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024)); 
        $pow = min($pow, count($units) - 1); 

        $bytes /= (1 << (10 * $pow)); 

        return round($bytes, $precision) . ' ' . $units[$pow]; 
    }

    /**
     * Export Business Data
     */
    public function export(Request $request, BusinessRepository $repository)
    {
        if (Auth::user()->role !== 'Super Admin' && Auth::user()->role !== 'Administrator') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $filename = "data-usaha-" . date('Y-m-d') . ".xlsx";
        
        $query = $repository->getFilteredQuery($request);
        
        $this->logActivity('Export Data', "Melakukan export data usaha ke Excel", $request);
        
        return Excel::download(new BusinessesExport($query), $filename);
    }

    /**
     * Import Data (CSV & Excel)
     */
    public function import(Request $request)
    {
        if (Auth::user()->role !== 'Super Admin' && Auth::user()->role !== 'Administrator') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:51200', // 50MB
                function ($attribute, $value, $fail) {
                    $ext = strtolower($value->getClientOriginalExtension());
                    if (!in_array($ext, ['csv', 'txt', 'xlsx', 'xls'])) {
                        $fail('Format file harus berupa CSV atau Excel (.xlsx / .xls).');
                    }
                }
            ],
            'import_id' => 'nullable|string'
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $importId = $request->input('import_id') ?: ('import_' . uniqid() . '_' . time());
            $ext = strtolower($file->getClientOriginalExtension());

            $importsDir = storage_path('app/imports');
            if (!File::exists($importsDir)) {
                File::makeDirectory($importsDir, 0755, true);
            }

            $tempFilename = 'import_' . $importId . '_' . time() . '.' . $ext;
            $targetPath = $importsDir . DIRECTORY_SEPARATOR . $tempFilename;
            $file->move($importsDir, $tempFilename);

            // Calculate total rows accurately
            $totalRows = 0;
            if (in_array($ext, ['xlsx', 'xls'])) {
                try {
                    $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($targetPath);
                    if (method_exists($reader, 'listWorksheetInfo')) {
                        $info = $reader->listWorksheetInfo($targetPath);
                        $totalRows = max(0, ($info[0]['totalRows'] ?? 1) - 1);
                    }
                } catch (\Throwable $e) {
                    $totalRows = 0;
                }
            } else {
                $handle = fopen($targetPath, 'r');
                if ($handle !== false) {
                    while (!feof($handle)) {
                        $line = fgets($handle);
                        if ($line !== false && trim($line) !== '') {
                            $totalRows++;
                        }
                    }
                    fclose($handle);
                    $totalRows = max(0, $totalRows - 1); // Subtract header
                }
            }

            // Initialize Progress Cache
            Cache::put('import_progress_' . $importId, [
                'import_id' => $importId,
                'status' => 'processing',
                'total_rows' => $totalRows,
                'processed_rows' => 0,
                'percentage' => 0,
                'started_at' => microtime(true),
                'elapsed_seconds' => 0,
                'rows_per_second' => 0,
                'estimated_remaining_seconds' => 0,
                'message' => 'Memulai proses import...',
                'imported' => 0,
                'updated' => 0,
                'failed' => 0,
            ], 3600);

            // Dispatch background process
            $userId = Auth::id();
            $artisanPath = base_path('artisan');
            $phpBinary = $this->getPhpCliBinary();

            $logDir = storage_path('logs/imports');
            if (!File::exists($logDir)) {
                File::makeDirectory($logDir, 0755, true);
            }
            $logPath = $logDir . DIRECTORY_SEPARATOR . 'import_' . $importId . '.log';
            Log::info("Import background launcher [{$importId}]: PHP [{$phpBinary}], Artisan [{$artisanPath}]");

            // Verify prerequisites before launching
            if (!file_exists($phpBinary)) {
                Log::error("Import {$importId} failed: PHP CLI binary not found at {$phpBinary}");
                Cache::put('import_progress_' . $importId, [
                    'import_id' => $importId,
                    'status' => 'failed',
                    'total_rows' => $totalRows,
                    'processed_rows' => 0,
                    'percentage' => 0,
                    'message' => 'Gagal memulai import: PHP CLI binary tidak ditemukan pada server.',
                ], 3600);
            } elseif (!file_exists($artisanPath)) {
                Log::error("Import {$importId} failed: Artisan file not found at {$artisanPath}");
                Cache::put('import_progress_' . $importId, [
                    'import_id' => $importId,
                    'status' => 'failed',
                    'total_rows' => $totalRows,
                    'processed_rows' => 0,
                    'percentage' => 0,
                    'message' => 'Gagal memulai import: File artisan tidak ditemukan.',
                ], 3600);
            } else {
                if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                    $cmd = sprintf(
                        'start /B "" "%s" "%s" businesses:import "%s" "%s" %s > "%s" 2>&1',
                        $phpBinary,
                        $artisanPath,
                        $importId,
                        $targetPath,
                        $userId ?: 0,
                        $logPath
                    );
                    pclose(popen($cmd, 'r'));
                } else {
                    $cmd = sprintf(
                        '"%s" "%s" businesses:import "%s" "%s" %s > "%s" 2>&1 &',
                        $phpBinary,
                        $artisanPath,
                        $importId,
                        $targetPath,
                        $userId ?: 0,
                        $logPath
                    );
                    exec($cmd);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'File berhasil diunggah dan sedang diproses di latar belakang.',
                'import_id' => $importId,
                'total_rows' => $totalRows
            ]);
        }

        return response()->json(['status' => 'error', 'message' => 'Gagal mengunggah file'], 400);
    }

    /**
     * Resolve the CLI PHP executable safely across environments (especially Windows/Laragon).
     */
    protected function getPhpCliBinary(): string
    {
        $binary = PHP_BINARY;
        $filename = strtolower(basename($binary));

        // 1. If current process is already CLI php.exe or php
        if ($filename === 'php.exe' || $filename === 'php') {
            return $binary;
        }

        $candidates = [];

        // 2. Under Apache mod_php / CGI / FPM, find php.exe via php_ini_loaded_file()
        $iniFile = php_ini_loaded_file();
        if ($iniFile) {
            $candidates[] = dirname($iniFile) . DIRECTORY_SEPARATOR . (PHP_OS_FAMILY === 'Windows' ? 'php.exe' : 'php');
        }

        // 3. Check cfg_file_path
        $cfgFile = get_cfg_var('cfg_file_path');
        if ($cfgFile) {
            $candidates[] = dirname($cfgFile) . DIRECTORY_SEPARATOR . (PHP_OS_FAMILY === 'Windows' ? 'php.exe' : 'php');
        }

        // 4. In Laragon / CGI / FPM, look in the same directory as PHP_BINARY
        $candidates[] = dirname($binary) . DIRECTORY_SEPARATOR . (PHP_OS_FAMILY === 'Windows' ? 'php.exe' : 'php');

        // 5. In Windows, check Laragon's active PATH via 'where php.exe'
        if (PHP_OS_FAMILY === 'Windows') {
            $whereOutput = @shell_exec('where php.exe 2>NUL');
            if ($whereOutput) {
                $lines = explode("\n", trim($whereOutput));
                foreach ($lines as $line) {
                    $trimmed = trim($line);
                    if ($trimmed) {
                        $candidates[] = $trimmed;
                    }
                }
            }
        } else {
            $whichOutput = @shell_exec('which php 2>/dev/null');
            if ($whichOutput) {
                $candidates[] = trim($whichOutput);
            }
        }

        // 6. Check PHP_BINDIR as a later fallback
        if (defined('PHP_BINDIR') && PHP_BINDIR) {
            $candidates[] = PHP_BINDIR . DIRECTORY_SEPARATOR . (PHP_OS_FAMILY === 'Windows' ? 'php.exe' : 'php');
        }

        // Filter candidates: verify existence, executable status, and PHP >= 8.3.0
        foreach ($candidates as $candidate) {
            if ($candidate && file_exists($candidate) && is_executable($candidate)) {
                $verOutput = @shell_exec(sprintf('"%s" -r "echo PHP_VERSION_ID;" 2>NUL', $candidate));
                $versionId = (int) trim($verOutput ?? '0');
                if ($versionId >= 80300) {
                    return $candidate;
                }
            }
        }

        // Fallback to first existing executable candidate
        foreach ($candidates as $candidate) {
            if ($candidate && file_exists($candidate) && is_executable($candidate)) {
                return $candidate;
            }
        }

        return $binary;
    }

    /**
     * Get Import Progress
     */
    public function importProgress($id)
    {
        if (Auth::user()->role !== 'Super Admin' && Auth::user()->role !== 'Administrator') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $progress = Cache::get('import_progress_' . $id);
        if (!$progress) {
            return response()->json(['status' => 'not_found', 'message' => 'Proses import tidak ditemukan'], 404);
        }

        // Diagnostic check: if still marked processing and 0 rows processed, check log for startup crash
        if ($progress['status'] === 'processing' && ($progress['processed_rows'] ?? 0) === 0) {
            $logPath = storage_path('logs/imports/import_' . $id . '.log');
            if (File::exists($logPath)) {
                $logContent = trim(File::get($logPath));
                if (!empty($logContent)) {
                    if (preg_match('/(Fatal error|Parse error|ErrorException|Uncaught Exception|Command .* not defined)/i', $logContent)) {
                        Log::error("Import process startup crash [{$id}]: " . $logContent);
                        $progress['status'] = 'failed';
                        $progress['message'] = 'Proses import gagal dimulai di latar belakang. Silakan periksa log server.';
                        Cache::put('import_progress_' . $id, $progress, 3600);
                        return response()->json($progress);
                    }
                }
            }
        }

        if ($progress['status'] === 'processing') {
            $startedAt = $progress['started_at'] ?? microtime(true);
            $elapsed = max(0.1, microtime(true) - $startedAt);
            $processed = $progress['processed_rows'] ?? 0;
            $total = $progress['total_rows'] ?? 0;

            $speed = $processed / $elapsed;
            $remainingRows = max(0, $total - $processed);
            $eta = $speed > 0 ? $remainingRows / $speed : 0;

            $progress['elapsed_seconds'] = round($elapsed);
            $progress['rows_per_second'] = round($speed);
            $progress['estimated_remaining_seconds'] = round($eta);

            if ($total > 0) {
                $progress['percentage'] = min(99, (int) round(($processed / $total) * 100));
            }
        }

        return response()->json($progress);
    }
    
    /**
     * Helper to log activity
     */
    private function logActivity($action, $description, $request) {
        try {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'description' => $description,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
        } catch (\Exception $e) {
            // Ignore
        }
    }
}
