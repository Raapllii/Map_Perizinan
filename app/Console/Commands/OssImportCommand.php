<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\BusinessesImport;

class OssImportCommand extends Command
{
    protected $signature = 'oss:import {file=DP.Proyek.xlsx : Nama file excel atau csv yang akan diimport}';
    protected $description = 'Import Data dari file ke tabel businesses';

    public function handle()
    {
        $this->info('Starting import process...');
        
        $startTime = microtime(true);
        $import = new BusinessesImport();
        
        try {
            $file = $this->argument('file');
            $this->info("Mengimport file: {$file} ...");
            Excel::import($import, $file);
            $endTime = microtime(true);
            $timeTaken = round($endTime - $startTime, 2);
            
            // Clear API map caches to ensure the frontend loads the new data
            \Illuminate\Support\Facades\Cache::forget('dashboard_data');
            \Illuminate\Support\Facades\Cache::forget('map_markers_all');
            
            $this->info('Import completed successfully!');
            $this->table(
                ['Keterangan', 'Jumlah'],
                [
                    ['Jumlah data berhasil diimport', $import->importedCount],
                    ['Jumlah data diupdate', $import->updatedCount],
                    ['Jumlah data gagal', $import->failedCount],
                    ['Waktu proses import', $timeTaken . ' detik'],
                ]
            );
        } catch (\Exception $e) {
            $this->error('An error occurred during import: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
