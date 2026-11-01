<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google reCAPTCHA v2 Configuration
    |--------------------------------------------------------------------------
    |
    | Site key is used on frontend widgets.
    | Secret key is strictly used on backend server verification.
    | Allowed hostnames ensure the verification response originated from allowed domains.
    | In production, default allowed hostnames are empty to enforce explicit domain declaration.
    |
    */

    'site_key' => env('RECAPTCHA_SITE_KEY', env('VITE_RECAPTCHA_SITE_KEY')),

    'secret_key' => env('RECAPTCHA_SECRET_KEY'),

    'allowed_hostnames' => array_values(array_filter(array_map('trim', explode(',', env(
        'RECAPTCHA_ALLOWED_HOSTNAMES',
        env('APP_ENV') === 'production' ? '' : 'localhost,127.0.0.1,testkey.google.com'
    ))))),

    'verify_url' => env('RECAPTCHA_VERIFY_URL', 'https://www.google.com/recaptcha/api/siteverify'),

    'timeout' => (int) env('RECAPTCHA_TIMEOUT', 10),

    // Minimum score threshold for reCAPTCHA v3 (0.0 - 1.0, default 0.5)
    'min_score' => (float) env('RECAPTCHA_MIN_SCORE', 0.5),

    // Expected action for reCAPTCHA v3 verification
    'expected_action' => env('RECAPTCHA_ACTION', 'verify_identity'),
];
