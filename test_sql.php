<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$validLat = "(lat::text ~ '^-?[0-9]+(\.[0-9]+)?$' AND (CASE WHEN lat::text ~ '^-?[0-9]+(\.[0-9]+)?$' THEN lat::numeric ELSE 999 END) BETWEEN -90 AND 90)";
$count = \App\Models\Business::query()->whereNotNull('lat')->whereNotNull('lng')->whereRaw($validLat)->count();
echo "Count: " . $count . "\n";
