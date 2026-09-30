<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DukcapilService;
use Illuminate\Http\Request;

class DukcapilVerificationController extends Controller
{
    public function __construct(private DukcapilService $dukcapil)
    {
    }

    /**
     * Validate CAPTCHA, then verify NIK via Dukcapil, return citizen name.
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
                'errors'  => ['captcha_answer' => ['Jawaban CAPTCHA salah atau sudah kedaluwarsa.']],
            ], 422);
        }

        $nama = $this->dukcapil->verifyNik($request->nik);

        if (!$nama) {
            return response()->json([
                'message' => 'NIK tidak ditemukan atau tidak valid dalam data Dukcapil.',
                'errors'  => ['nik' => ['NIK tidak ditemukan.']],
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'data'   => ['nama' => $nama],
        ]);
    }

    /**
     * Validate CAPTCHA signed token.
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

            // Check expiry (10 minutes)
            if (time() - (int) $timestamp > 600) return false;

            // Verify HMAC integrity
            $expectedHmac = hash_hmac('sha256', $answer . '::' . $timestamp, config('app.key'));
            if (!hash_equals($expectedHmac, $hmac)) return false;

            return (int) $userAnswer === (int) $answer;
        } catch (\Throwable) {
            return false;
        }
    }
}
