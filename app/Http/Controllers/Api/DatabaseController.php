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
     * Import Data
     */
    public function import(Request $request)
    {
        if (Auth::user()->role !== 'Super Admin' && Auth::user()->role !== 'Administrator') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:51200' // 50MB
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $importId = $request->input('import_id');
            
            if ($importId) {
                $totalRows = 0;
                $handle = fopen($file->getPathname(), "r");
                if ($handle !== false) {
                    while (!feof($handle)) {
                        fgets($handle);
                        $totalRows++;
                    }
                    fclose($handle);
                    $totalRows = max(0, $totalRows - 1); // Subtract header
                }

                Cache::put('import_progress_' . $importId, [
                    'total_rows' => $totalRows,
                    'processed_rows' => 0,
                    'percentage' => 0,
                    'status' => 'processing',
                    'started_at' => microtime(true),
                    'elapsed_seconds' => 0,
                    'rows_per_second' => 0,
                    'estimated_remaining_seconds' => 0,
                ], 3600);
            }
            
            try {
                $import = new BusinessesImport($importId);
                Excel::import($import, $file);
                
                $msg = "Berhasil memproses file. {$import->importedCount} data baru, {$import->updatedCount} diupdate.";
                $this->logActivity('Import Data', $msg, $request);
                
                if ($importId) {
                    $progress = Cache::get('import_progress_' . $importId);
                    if ($progress) {
                        $progress['status'] = 'completed';
                        $progress['percentage'] = 100;
                        $progress['processed_rows'] = $progress['total_rows'] > 0 ? $progress['total_rows'] : $progress['processed_rows'];
                        Cache::put('import_progress_' . $importId, $progress, 3600);
                    }
                }

                return response()->json([
                    'status' => 'success',
                    'message' => $msg,
                    'imported' => $import->importedCount,
                    'updated' => $import->updatedCount
                ]);
            } catch (\Exception $e) {
                if ($importId) {
                    $progress = Cache::get('import_progress_' . $importId);
                    if ($progress) {
                        $progress['status'] = 'failed';
                        $progress['message'] = $e->getMessage();
                        Cache::put('import_progress_' . $importId, $progress, 3600);
                    }
                }
                return response()->json(['status' => 'error', 'message' => 'Gagal import: ' . $e->getMessage()], 422);
            }
        }

        return response()->json(['status' => 'error', 'message' => 'Gagal mengupload file'], 400);
    }
    
    public function importProgress($id)
    {
        if (Auth::user()->role !== 'Super Admin' && Auth::user()->role !== 'Administrator') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $progress = Cache::get('import_progress_' . $id);
        if (!$progress) {
            return response()->json(['status' => 'not_found'], 404);
        }

        if ($progress['status'] === 'processing') {
            $elapsed = max(0.1, microtime(true) - $progress['started_at']);
            $speed = $progress['processed_rows'] / $elapsed;
            $remainingRows = max(0, $progress['total_rows'] - $progress['processed_rows']);
            $eta = $speed > 0 ? $remainingRows / $speed : 0;
            
            $progress['elapsed_seconds'] = round($elapsed);
            $progress['rows_per_second'] = round($speed);
            $progress['estimated_remaining_seconds'] = round($eta);
            
            if ($progress['total_rows'] > 0) {
                $progress['percentage'] = min(99, (int) round(($progress['processed_rows'] / $progress['total_rows']) * 100));
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
