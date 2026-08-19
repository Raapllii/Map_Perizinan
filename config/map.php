<?php

return [
    'min_zoom' => 8,
    'progressive_visibility' => [
        0 => ['max_markers' => 0, 'categories' => 'all'],
        8 => ['max_markers' => 100, 'categories' => 'all'],
        9 => ['max_markers' => 250, 'categories' => 'all'],
        10 => ['max_markers' => 500, 'categories' => 'all'],
        11 => ['max_markers' => 1000, 'categories' => 'all'],
        12 => ['max_markers' => 2000, 'categories' => 'all'],
        13 => ['max_markers' => 3000, 'categories' => 'all'],
        14 => ['max_markers' => 5000, 'categories' => 'all'],
        15 => ['max_markers' => 7500, 'categories' => 'all'],
        16 => ['max_markers' => 10000, 'categories' => 'all'],
    ],
    'category_mappings' => [
        'none' => [],
        'priority' => ['Usaha Besar', 'Usaha Menengah'],
        'expanded' => ['Usaha Besar', 'Usaha Menengah', 'Usaha Kecil'],
        'all' => []
    ],
    'cache_ttl' => 30, // seconds
];
