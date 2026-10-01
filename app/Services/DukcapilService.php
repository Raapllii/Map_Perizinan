<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DukcapilService
{
    /**
     * Verify NIK against authorized Dukcapil/API integration.
     * Returns structured identity data on success, or null on failure.
     *
     * Desired identity information:
     * - nama (string)
     * - jenis_kelamin (string|null)
     * - tempat_lahir (string|null)
     * - tanggal_lahir (string|null)
     *
     * When DUKCAPIL_ENABLED=false (default), returns a stub simulated record
     * so development and testing can proceed without requiring live credentials.
     */
    public function verifyNik(string $nik): ?array
    {
        if (!config('dukcapil.enabled', false)) {
            return [
                'nama'          => 'Rahmat Hidayat',
                'jenis_kelamin' => 'Laki-laki',
                'tempat_lahir'  => 'Banjarmasin',
                'tanggal_lahir' => '1998-05-12',
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('dukcapil.api_key'),
                'Accept'        => 'application/json',
            ])->timeout(10)->post(config('dukcapil.endpoint'), ['nik' => $nik]);

            if ($response->successful()) {
                $payload = $response->json('data') ?? $response->json();
                $nama = $payload['nama'] ?? null;

                if (!$nama) {
                    return null;
                }

                return [
                    'nama'          => (string) $nama,
                    'jenis_kelamin' => isset($payload['jenis_kelamin']) ? (string) $payload['jenis_kelamin'] : null,
                    'tempat_lahir'  => isset($payload['tempat_lahir']) ? (string) $payload['tempat_lahir'] : null,
                    'tanggal_lahir' => isset($payload['tanggal_lahir']) ? (string) $payload['tanggal_lahir'] : null,
                ];
            }

            Log::warning('Dukcapil API non-success', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Throwable) {
            Log::error('Dukcapil API connection error');
            return null;
        }
    }
}
