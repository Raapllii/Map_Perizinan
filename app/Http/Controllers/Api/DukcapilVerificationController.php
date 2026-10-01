<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicMapVerification;
use App\Services\DukcapilService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DukcapilVerificationController extends Controller
{
    public function __construct(private DukcapilService $dukcapil)
    {
    }

    /**
     * Validate CAPTCHA, verify NIK via Dukcapil, create short-lived verification token.
     * Response returns only verification_token, verified name, and verified identity biodata.
     * NIK is NEVER returned to the client.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'nik'            => ['required', 'digits:16'],
            'captcha_token'  => ['required', 'string'],
            'captcha_answer' => ['required', 'string'],
        ], [
            'nik.required' => 'NIK wajib diisi.',
            'nik.digits'   => 'NIK harus terdiri dari 16 digit angka.',
        ]);

        if (!$this->verifyCaptcha($request->captcha_token, $request->captcha_answer)) {
            return response()->json([
                'message' => 'CAPTCHA tidak valid.',
                'errors'  => ['captcha_answer' => ['Jawaban CAPTCHA salah, sudah digunakan, atau kedaluwarsa.']],
            ], 422);
        }

        $identity = $this->dukcapil->verifyNik($request->nik);

        if (!$identity || empty($identity['nama'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Verifikasi NIK gagal. Silakan periksa data atau coba lagi.',
                'errors'  => ['nik' => ['Verifikasi NIK gagal. Silakan periksa data atau coba lagi.']],
            ], 422);
        }

        $nama = $identity['nama'];

        // Generate cryptographically secure random verification token (64 chars)
        $plainToken = Str::random(64);
        $tokenHash  = hash('sha256', $plainToken);

        // Store server-side verification record with 5-minute TTL bound to verified identity
        PublicMapVerification::create([
            'token_hash'    => $tokenHash,
            'verified_nik'  => $request->nik,
            'verified_name' => $nama,
            'expires_at'    => now()->addMinutes(5),
            'used_at'       => null,
        ]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'data'    => [
                'verification_token' => $plainToken,
                'nama'               => $nama,
                'identity'           => [
                    'nama'          => $nama,
                    'jenis_kelamin' => $identity['jenis_kelamin'] ?? null,
                    'tempat_lahir'  => $identity['tempat_lahir'] ?? null,
                    'tanggal_lahir' => $identity['tanggal_lahir'] ?? null,
                ],
            ],
        ]);
    }

    /**
     * Validate CAPTCHA signed token and enforce single-use replay protection.
     * Token format (base64-decoded): "{answer}::{timestamp}::{hmac}"
     * Valid for 10 minutes.
     */
    private function verifyCaptcha(string $token, string $userAnswer): bool
    {
        try {
            $decoded = base64_decode($token, true);
            if ($decoded === false) return false;

            $parts = explode('::', $decoded, 3);
            if (count($parts) !== 3) return false;

            [$answer, $timestamp, $hmac] = $parts;

            // Check expiry (10 minutes = 600s)
            $age = time() - (int) $timestamp;
            if ($age > 600 || $age < 0) return false;

            // Verify HMAC integrity
            $expectedHmac = hash_hmac('sha256', $answer . '::' . $timestamp, config('app.key'));
            if (!hash_equals($expectedHmac, $hmac)) return false;

            // Replay protection: check if this CAPTCHA signature was already consumed
            $cacheKey = 'captcha_used:' . $hmac;
            if (Cache::has($cacheKey)) {
                return false;
            }

            // Verify answer
            if ((int) $userAnswer !== (int) $answer) {
                return false;
            }

            // Mark CAPTCHA challenge as consumed for the remaining TTL (up to 600s)
            $remainingTtl = max(1, 600 - $age);
            Cache::put($cacheKey, true, $remainingTtl);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
