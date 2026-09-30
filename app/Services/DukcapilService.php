<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DukcapilService
{
    /**
     * Verify NIK against Dukcapil API.
     * Returns citizen name on success, null if not found or on error.
     *
     * When DUKCAPIL_ENABLED=false (default), returns a stub name
     * so the flow works in dev/test without a real API key.
     */
    public function verifyNik(string $nik): ?string
    {
        if (!config('dukcapil.enabled', false)) {
            return 'Warga Verified (' . substr($nik, 0, 6) . '***)';
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('dukcapil.api_key'),
                'Accept'        => 'application/json',
            ])->timeout(10)->post(config('dukcapil.endpoint'), ['nik' => $nik]);

            if ($response->successful()) {
                return $response->json('data.nama') ?? $response->json('nama');
            }

            Log::warning('Dukcapil API non-success', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Dukcapil API error: ' . $e->getMessage());
            return null;
        }
    }
}
