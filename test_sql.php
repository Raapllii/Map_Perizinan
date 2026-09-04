<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$validLat = "(latitude::text ~ '^-?[0-9]+(\.[0-9]+)?$' AND (CASE WHEN latitude::text ~ '^-?[0-9]+(\.[0-9]+)?$' THEN latitude::numeric ELSE 999 END) BETWEEN -90 AND 90)";
$count = \App\Models\Business::query()->whereNotNull('latitude')->whereNotNull('longitude')->whereRaw($validLat)->count();
echo "Count: " . $count . "\n";
