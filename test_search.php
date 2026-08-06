<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$keyword = "pt maju"; // Let's try searching 'pt maju'

$keyword = "pt"; 

try {
    $query = App\Models\Business::select('id', 'nama_perusahaan', 'judul_kbli');
    $words = explode(' ', $keyword);
    foreach ($words as $word) {
        if (!empty($word)) {
            $query->where(function($q) use ($word) {
                $q->where('nama_perusahaan', 'LIKE', "%{$word}%")
                  ->orWhere('judul_kbli', 'LIKE', "%{$word}%")
                  ->orWhere('kbli', 'LIKE', "%{$word}%")
                  ->orWhere('nib', 'LIKE', "%{$word}%")
                  ->orWhere('id_proyek', 'LIKE', "%{$word}%")
                  ->orWhere('kecamatan', 'LIKE', "%{$word}%")
                  ->orWhere('kelurahan', 'LIKE', "%{$word}%")
                  ->orWhere('alamat_proyek', 'LIKE', "%{$word}%");
            });
        }
    }
    
    $query->orderByRaw("
        CASE 
            WHEN nama_perusahaan LIKE ? THEN 1
            WHEN nama_perusahaan LIKE ? THEN 2
            ELSE 3
        END
    ", [$keyword, "{$keyword}%"]);

    $results = $query->limit(5)->get();
    echo "Count: " . count($results) . "\n";
    foreach($results as $r) {
        echo "- " . $r->nama_perusahaan . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
