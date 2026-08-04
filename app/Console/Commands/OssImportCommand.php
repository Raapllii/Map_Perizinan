<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\BusinessesImport;

class OssImportCommand extends Command
{
    protected $signature = 'oss:import';
    protected $description = 'Import Data DP.Proyek.xlsx to businesses table';

    public function handle()
    {
        $this->info('Starting import process...');
        
        $startTime = microtime(true);
        $import = new BusinessesImport();
        
        try {
            Excel::import($import, 'DP.Proyek.xlsx');
            $endTime = microtime(true);
            $timeTaken = round($endTime - $startTime, 2);
            
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
