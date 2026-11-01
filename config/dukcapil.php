<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Status Integrasi API Dukcapil Resmi
    |--------------------------------------------------------------------------
    |
    | Aktifkan `DUKCAPIL_ENABLED=true` HANYA setelah DPMPTSP memperoleh
    | endpoint, kredensial, dan dokumentasi resmi dari Dukcapil.
    |
    */
    'enabled' => filter_var(env('DUKCAPIL_ENABLED', false), FILTER_VALIDATE_BOOLEAN),

    /*
    |--------------------------------------------------------------------------
    | Mode Simulasi (Khusus Local / Testing)
    |--------------------------------------------------------------------------
    |
    | Mode simulasi TIDAK AKAN PERNAH aktif di environment `production`.
    | Pada environment pengembangan/pengujian, mode simulasi hanya aktif
    | jika diaktifkan secara eksplisit melalui `DUKCAPIL_SIMULATION_ENABLED=true`.
    |
    */
    'simulation_enabled' => filter_var(env('DUKCAPIL_SIMULATION_ENABLED', false), FILTER_VALIDATE_BOOLEAN),

    /*
    |--------------------------------------------------------------------------
    | Konfigurasi Koneksi & Kredensial API Dukcapil
    |--------------------------------------------------------------------------
    |
    | Nilai di bawah ini diisi sesuai petunjuk teknis / dokumentasi resmi
    | Web Service Dukcapil yang diterima oleh DPMPTSP.
    |
    */
    'endpoint'    => env('DUKCAPIL_ENDPOINT', ''),
    'api_key'     => env('DUKCAPIL_API_KEY', ''),
    'user_id'     => env('DUKCAPIL_USER_ID', ''),
    'timeout'     => (int) env('DUKCAPIL_TIMEOUT', 10),
    'auth_scheme' => env('DUKCAPIL_AUTH_SCHEME', 'bearer'),
    'auth_header' => env('DUKCAPIL_AUTH_HEADER', 'Authorization'),
];
