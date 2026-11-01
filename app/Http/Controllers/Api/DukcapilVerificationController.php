<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicMapVerification;
use App\Services\DukcapilService;
use App\Services\RecaptchaService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DukcapilVerificationController extends Controller
{
    public function __construct(
        private DukcapilService $dukcapil,
        private RecaptchaService $recaptcha
    ) {
    }

    /**
     * Validate Google reCAPTCHA v2, verify NIK via Dukcapil, create short-lived verification token.
     * Response returns only verification_token, verified name, and verified identity biodata.
     * NIK is NEVER returned to the client.
     */
    public function verify(Request $request)
    {
        $recaptchaToken = $request->input('recaptcha_token') ?? $request->input('g-recaptcha-response');

        $request->validate([
            'nik' => ['required', 'digits:16'],
        ], [
            'nik.required' => 'NIK wajib diisi.',
            'nik.digits'   => 'NIK harus terdiri dari 16 digit angka.',
        ]);

        if (empty($recaptchaToken) || !is_string($recaptchaToken) || trim($recaptchaToken) === '') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Verifikasi CAPTCHA wajib diselesaikan.',
                'errors'  => ['recaptcha_token' => ['Verifikasi CAPTCHA wajib diselesaikan.']],
            ], 422);
        }

        $captchaResult = $this->recaptcha->verify($recaptchaToken, $request->ip());

        if (!$captchaResult['success']) {
            return response()->json([
                'status'  => 'error',
                'message' => $captchaResult['message'] ?? 'Verifikasi CAPTCHA gagal. Silakan coba lagi.',
                'errors'  => ['recaptcha_token' => [$captchaResult['message'] ?? 'Verifikasi CAPTCHA gagal. Silakan coba lagi.']],
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
}
