<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$columns = Illuminate\Support\Facades\Schema::getColumnListing('businesses');
echo "Columns in businesses table:\n";
print_r($columns);

use PhpOffice\PhpSpreadsheet\IOFactory;
$spreadsheet = IOFactory::load('DP.Proyek.xlsx');
$worksheet = $spreadsheet->getActiveSheet();
$header = [];
foreach ($worksheet->getRowIterator(1, 1) as $row) {
    $cellIterator = $row->getCellIterator();
    $cellIterator->setIterateOnlyExistingCells(false); 
    foreach ($cellIterator as $cell) {
        $header[] = $cell->getValue();
    }
}
echo "\nHeaders in DP.Proyek.xlsx:\n";
print_r($header);
