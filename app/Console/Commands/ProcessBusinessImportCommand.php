<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\BusinessesImport;
use App\Models\User;
use App\Models\ActivityLog;

class ProcessBusinessImportCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'businesses:import {importId} {filePath} {userId?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process business data import in the background';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        @set_time_limit(0);
        @ini_set('memory_limit', '1024M');

        $importId = $this->argument('importId');
        $filePath = $this->argument('filePath');
        $userId = $this->argument('userId');

        if (!File::exists($filePath)) {
            $msg = "File import temporer tidak ditemukan: {$filePath}";
            Log::error($msg);
            $this->error($msg);
            $progress = Cache::get('import_progress_' . $importId) ?: [];
            $progress['status'] = 'failed';
            $progress['message'] = $msg;
            Cache::put('import_progress_' . $importId, $progress, 3600);
            return 1;
        }

        // Auto-detect delimiter for CSV
        $delimiter = ';';
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        if (in_array($ext, ['csv', 'txt'])) {
            $handle = fopen($filePath, 'r');
            if ($handle !== false) {
                $firstLine = fgets($handle);
                fclose($handle);
                if ($firstLine !== false) {
                    $semiCount = substr_count($firstLine, ';');
                    $commaCount = substr_count($firstLine, ',');
                    if ($commaCount > $semiCount) {
                        $delimiter = ',';
                    }
                }
            }
        }

        try {
            $import = new BusinessesImport($importId, $delimiter);
            Excel::import($import, $filePath);

            $progress = Cache::get('import_progress_' . $importId) ?: [];
            $total = $progress['total_rows'] ?? ($import->importedCount + $import->updatedCount);
            $startedAt = $progress['started_at'] ?? microtime(true);
            $elapsed = max(0.1, microtime(true) - $startedAt);

            $progress['status'] = 'completed';
            $progress['percentage'] = 100;
            $progress['processed_rows'] = $total;
            $progress['elapsed_seconds'] = round($elapsed);
            $progress['imported'] = $import->importedCount;
            $progress['updated'] = $import->updatedCount;
            $progress['failed'] = $import->failedCount;
            $progress['message'] = "Berhasil memproses file. {$import->importedCount} data baru, {$import->updatedCount} diupdate.";

            Cache::put('import_progress_' . $importId, $progress, 3600);

            // Invalidate cached statistics & markers
            Cache::forget('dashboard_data');
            Cache::forget('map_markers_all');

            // Log activity
            if ($userId) {
                try {
                    $user = User::find($userId);
                    ActivityLog::create([
                        'user_id' => $userId,
                        'user_name' => $user ? $user->name : 'Administrator',
                        'action' => 'Import Data',
                        'description' => "Import data selesai: {$import->importedCount} data baru, {$import->updatedCount} diupdate.",
                        'ip_address' => '127.0.0.1',
                        'user_agent' => 'CLI'
                    ]);
                } catch (\Exception $e) {
                    // Ignore activity log error
                }
            }

            $this->info("Import {$importId} completed successfully.");
            return 0;

        } catch (\Throwable $e) {
            Log::error("Import process failed for [{$importId}]: " . $e->getMessage());

            $progress = Cache::get('import_progress_' . $importId) ?: [];
            $progress['status'] = 'failed';
            $progress['message'] = $e->getMessage();
            Cache::put('import_progress_' . $importId, $progress, 3600);

            $this->error("Import {$importId} failed: " . $e->getMessage());
            return 1;

        } finally {
            // Cleanup temp file
            if (File::exists($filePath)) {
                try {
                    File::delete($filePath);
                } catch (\Exception $e) {
                    Log::warning("Could not delete temporary import file: {$filePath}");
                }
            }
        }
    }
}
