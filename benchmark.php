<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

function runExplain($name, $sql, $bindings = []) {
    echo "====================================\n";
    echo "BENCHMARK: $name\n";
    echo "====================================\n";
    $result = DB::select("EXPLAIN (ANALYZE, BUFFERS) " . $sql, $bindings);
    foreach ($result as $row) {
        echo $row->{"QUERY PLAN"} . "\n";
    }
    echo "\n";
}

$provinceBounds = [116.0, -1.5, 118.0, 0.5]; // Kaltim approx

// 1. Zoom 8-9 (Limit 100, Priority)
$sql1 = "
    SELECT id, latitude, longitude, nama_perusahaan, nib, judul_kbli, status
    FROM businesses
    WHERE location && ST_MakeEnvelope(?, ?, ?, ?, 4326)
      AND uraian_skala_usaha IN ('Usaha Besar', 'Usaha Menengah')
    LIMIT 100
";
runExplain("Zoom 8 (Limit 100, Priority)", $sql1, $provinceBounds);

// 2. Zoom 11-12 (Limit 1000, Expanded)
$sql2 = "
    SELECT id, latitude, longitude, nama_perusahaan, nib, judul_kbli, status
    FROM businesses
    WHERE location && ST_MakeEnvelope(?, ?, ?, ?, 4326)
      AND uraian_skala_usaha IN ('Usaha Besar', 'Usaha Menengah', 'Usaha Kecil')
    LIMIT 1000
";
runExplain("Zoom 11 (Limit 1000, Expanded)", $sql2, $provinceBounds);

// 3. Zoom 15+ (Limit 7500, All)
$sql3 = "
    SELECT id, latitude, longitude, nama_perusahaan, nib, judul_kbli, status
    FROM businesses
    WHERE location && ST_MakeEnvelope(?, ?, ?, ?, 4326)
    LIMIT 7500
";
runExplain("Zoom 15+ (Limit 7500, All)", $sql3, $provinceBounds);

