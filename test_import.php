<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Imports\BusinessesImport;
use Maatwebsite\Excel\Facades\Excel;

echo "Starting import...\n";
$import = new BusinessesImport();
Excel::import($import, 'DP.Proyek.xlsx');

echo "Imported: " . $import->importedCount . "\n";
echo "Updated: " . $import->updatedCount . "\n";
echo "Failed: " . $import->failedCount . "\n";
echo "Import completed successfully!\n";
