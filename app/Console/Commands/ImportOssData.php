<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ImportOssData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'oss:import {file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import OSS Data from an Excel file without UI upload';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $file = $this->argument('file');
        
        if (!file_exists($file)) {
            $this->error("File tidak ditemukan: {$file}");
            return 1;
        }

        $this->info("Memulai proses import OSS dari {$file}...");
        
        try {
            $import = new \App\Imports\OssImport;
            \Maatwebsite\Excel\Facades\Excel::import($import, $file);
            
            $this->info("Import berhasil diselesaikan!");
            
            if ($import->failures()->isNotEmpty()) {
                $this->warn("Ada beberapa baris yang gagal di-import:");
                foreach ($import->failures() as $failure) {
                    $this->line("- Baris " . $failure->row() . ": " . implode(', ', $failure->errors()));
                }
            }
        } catch (\Exception $e) {
            $this->error("Terjadi kesalahan fatal saat import: " . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}
