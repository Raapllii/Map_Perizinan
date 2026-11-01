<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicMapVerification;
use App\Services\DukcapilService;
use App\Services\RecaptchaService;
use App\Support\GenderNormalizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DukcapilVerificationController extends Controller
{
    public function __construct(
        private DukcapilService $dukcapil,
        private RecaptchaService $recaptcha
    ) {
    }

    /**
     * Validate Google reCAPTCHA, verify NIK via DukcapilService, and create a short-lived single-use verification token.
     * Response returns only verification_token, verified name, verification_mode, and verified identity biodata.
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

        $dukcapilResult = $this->dukcapil->verifyNikDetailed($request->nik);
        $identity       = $dukcapilResult['data'] ?? null;

        if (!$dukcapilResult['verified'] || !$identity || empty($identity['nama'])) {
            $errMsg  = $dukcapilResult['message'] ?? 'Verifikasi NIK gagal. Silakan periksa data atau coba lagi.';
            $errCode = $dukcapilResult['error_code'] ?? 'verification_failed';

            return response()->json([
                'status'     => 'error',
                'error_code' => $errCode,
                'message'    => $errMsg,
                'errors'     => ['nik' => [$errMsg]],
            ], 422);
        }

        $nama           = (string) $identity['nama'];
        $verifiedGender = GenderNormalizer::normalize(
            isset($identity['jenis_kelamin']) ? (string) $identity['jenis_kelamin'] : null
        );
        $isSimulated    = (bool) ($dukcapilResult['is_simulated'] ?? false);
        $mode           = (string) ($dukcapilResult['verification_mode'] ?? ($isSimulated ? 'simulation' : 'official'));

        // Prune stale expired verification records so temporary NIKs are not retained longer than needed
        PublicMapVerification::where('expires_at', '<', now()->subMinutes(30))->delete();

        // Generate cryptographically secure random verification token (64 chars)
        $plainToken = Str::random(64);
        $tokenHash  = hash('sha256', $plainToken);

        $verificationPayload = [
            'token_hash'    => $tokenHash,
            'verified_nik'  => $request->nik,
            'verified_name' => $nama,
            'expires_at'    => now()->addMinutes(5),
            'used_at'       => null,
        ];

        try {
            if (Schema::hasColumn('public_map_verifications', 'verified_gender')) {
                $verificationPayload['verified_gender'] = $verifiedGender;
            }
        } catch (\Throwable $e) {
            // Ignore schema check errors in isolated environments
        }

        // Store server-side verification record with 5-minute TTL bound to verified identity
        PublicMapVerification::create($verificationPayload);
        Cache::put("public_map_verified_gender:{$tokenHash}", $verifiedGender, now()->addMinutes(5));

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'data'    => [
                'verification_token' => $plainToken,
                'nama'               => $nama,
                'verification_mode'  => $mode,
                'is_simulated'       => $isSimulated,
                'identity'           => [
                    'nama'          => $nama,
                    'jenis_kelamin' => $verifiedGender !== GenderNormalizer::UNKNOWN ? $verifiedGender : null,
                    'tempat_lahir'  => $identity['tempat_lahir'] ?? null,
                    'tanggal_lahir' => $identity['tanggal_lahir'] ?? null,
                    'is_simulated'  => $isSimulated,
                ],
            ],
        ]);
    }
}
