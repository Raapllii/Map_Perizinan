<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecaptchaService
{
    /**
     * Official Google reCAPTCHA v2 test keys (publicly known).
     * These must NEVER be permitted in production environment.
     */
    public const GOOGLE_TEST_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
    public const GOOGLE_TEST_SITE   = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

    /**
     * Verify Google reCAPTCHA v2 token against Google's siteverify endpoint.
     *
     * @param string|null $token
     * @param string|null $clientIp
     * @return array{success: bool, message: string, hostname?: string|null}
     */
    public function verify(?string $token, ?string $clientIp = null): array
    {
        $token = trim((string) $token);

        if (empty($token)) {
            return [
                'success' => false,
                'message' => 'Token verifikasi CAPTCHA wajib diisi.',
            ];
        }

        $secretKey = config('recaptcha.secret_key');

        if (empty($secretKey)) {
            Log::error('reCAPTCHA configuration error: RECAPTCHA_SECRET_KEY is not configured in environment.');
            return [
                'success' => false,
                'message' => 'Layanan verifikasi CAPTCHA belum dikonfigurasi dengan benar di server.',
            ];
        }

        // Production guard: ensure official test keys are NEVER used in production
        if (app()->environment('production')) {
            if ($secretKey === self::GOOGLE_TEST_SECRET || config('recaptcha.site_key') === self::GOOGLE_TEST_SITE) {
                Log::critical('SECURITY ERROR: Google reCAPTCHA test keys are strictly prohibited in production environment.');
                return [
                    'success' => false,
                    'message' => 'Konfigurasi keamanan reCAPTCHA server tidak valid untuk environment production.',
                ];
            }
        }

        // Hostname configuration check (fail-closed)
        $allowedHostnames = (array) config('recaptcha.allowed_hostnames', []);
        if (empty($allowedHostnames)) {
            Log::error('reCAPTCHA configuration error: RECAPTCHA_ALLOWED_HOSTNAMES is empty.');
            return [
                'success' => false,
                'message' => 'Layanan verifikasi CAPTCHA belum dikonfigurasi dengan benar di server (daftar domain belum diatur).',
            ];
        }

        // Atomic replay & concurrency protection
        // Cache::add returns true ONLY if the key was not already present (atomic test-and-set)
        $tokenHash = hash('sha256', $token);
        $cacheKey  = 'recaptcha_used:' . $tokenHash;

        if (!Cache::add($cacheKey, true, 600)) {
            return [
                'success' => false,
                'message' => 'Token CAPTCHA sudah pernah digunakan atau sedang diproses. Silakan centang ulang CAPTCHA.',
            ];
        }

        $verifyUrl = config('recaptcha.verify_url', 'https://www.google.com/recaptcha/api/siteverify');
        $timeout   = (int) config('recaptcha.timeout', 10);

        try {
            $payload = [
                'secret'   => $secretKey,
                'response' => $token,
            ];

            if (!empty($clientIp)) {
                $payload['remoteip'] = $clientIp;
            }

            $response = Http::asForm()
                ->timeout($timeout)
                ->post($verifyUrl, $payload);
        } catch (\Throwable $e) {
            // Mask token preview for logging (first 6 chars only)
            $maskedToken = substr($token, 0, 6) . '...';
            Log::error('Gagal menghubungi endpoint verifikasi Google reCAPTCHA: ' . $e->getMessage(), [
                'token_prefix' => $maskedToken,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menghubungi server verifikasi CAPTCHA. Silakan periksa koneksi Anda dan coba lagi.',
            ];
        }

        if ($response->failed()) {
            return [
                'success' => false,
                'message' => 'Verifikasi CAPTCHA gagal. Silakan coba lagi.',
            ];
        }

        $body = $response->json();

        if (!is_array($body) || empty($body['success']) || $body['success'] !== true) {
            $errorCodes = $body['error-codes'] ?? [];

            if (in_array('timeout-or-duplicate', $errorCodes, true)) {
                return [
                    'success' => false,
                    'message' => 'Token CAPTCHA telah kedaluwarsa atau sudah digunakan. Silakan centang ulang CAPTCHA.',
                ];
            }

            return [
                'success' => false,
                'message' => 'Verifikasi CAPTCHA tidak valid. Silakan coba lagi.',
            ];
        }

        // reCAPTCHA v3 score verification (if score is present)
        if (isset($body['score'])) {
            $score    = (float) $body['score'];
            $minScore = (float) config('recaptcha.min_score', 0.5);

            if ($score < $minScore) {
                Log::warning('reCAPTCHA v3 low score rejected', [
                    'score'     => $score,
                    'min_score' => $minScore,
                    'action'    => $body['action'] ?? null,
                ]);

                return [
                    'success' => false,
                    'message' => 'Verifikasi keamanan mendeteksi aktivitas tidak wajar. Silakan coba lagi.',
                ];
            }
        }

        // reCAPTCHA v3 action verification (if action is present)
        $expectedAction = config('recaptcha.expected_action');
        if (!empty($expectedAction) && isset($body['action'])) {
            if ($body['action'] !== $expectedAction) {
                Log::warning('reCAPTCHA v3 action mismatch', [
                    'action'   => $body['action'],
                    'expected' => $expectedAction,
                ]);

                return [
                    'success' => false,
                    'message' => 'Aksi verifikasi keamanan tidak valid.',
                ];
            }
        }

        // Hostname verification
        $returnedHostname = $body['hostname'] ?? null;

        // Disallow testkey.google.com in production environment
        if (app()->environment('production') && strtolower((string) $returnedHostname) === 'testkey.google.com') {
            Log::warning('reCAPTCHA testkey hostname rejected in production environment.');
            return [
                'success' => false,
                'message' => 'Verifikasi CAPTCHA ditolak: test key tidak diizinkan pada server produksi.',
            ];
        }

        if (empty($returnedHostname) || !in_array(strtolower($returnedHostname), array_map('strtolower', $allowedHostnames), true)) {
            Log::warning('reCAPTCHA hostname rejected', [
                'hostname' => $returnedHostname,
            ]);

            return [
                'success' => false,
                'message' => 'Verifikasi CAPTCHA ditolak: domain tidak diizinkan.',
            ];
        }

        return [
            'success'  => true,
            'message'  => 'Verifikasi CAPTCHA berhasil.',
            'hostname' => $returnedHostname,
            'score'    => $body['score'] ?? null,
            'action'   => $body['action'] ?? null,
        ];
    }
}
