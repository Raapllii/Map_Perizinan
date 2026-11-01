<?php

namespace App\Services;

use App\Support\GenderNormalizer;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DukcapilService
{
    /**
     * Verify NIK and return only the normalized identity array on success, or null on failure.
     * Kept for backward compatibility with callers expecting ?array.
     */
    public function verifyNik(string $nik): ?array
    {
        $result = $this->verifyNikDetailed($nik);

        return $result['verified'] ? $result['data'] : null;
    }

    /**
     * Verify NIK against authorized Dukcapil API integration (or explicit non-production simulation).
     *
     * Returns structured verification result:
     * - verified (bool)
     * - is_simulated (bool)
     * - verification_mode ('official'|'simulation'|'unconfigured')
     * - error_code (string|null): 'not_configured'|'connection_error'|'rejected'|'invalid_response'|null
     * - message (string)
     * - data (array{nama: string, jenis_kelamin: string|null, tempat_lahir: string|null, tanggal_lahir: string|null}|null)
     */
    public function verifyNikDetailed(string $nik): array
    {
        // 1. Official API Mode (when DUKCAPIL_ENABLED=true)
        if ((bool) config('dukcapil.enabled', false)) {
            if (!$this->isOfficialApiConfigured()) {
                Log::warning('Dukcapil verification aborted: DUKCAPIL_ENABLED is true but endpoint or api_key is missing.');

                return [
                    'verified'          => false,
                    'is_simulated'      => false,
                    'verification_mode' => 'unconfigured',
                    'error_code'        => 'not_configured',
                    'message'           => 'Layanan verifikasi NIK Dukcapil belum dikonfigurasi secara lengkap pada server.',
                    'data'              => null,
                ];
            }

            return $this->verifyViaOfficialApi($nik);
        }

        // 2. Explicit Simulation Mode (ONLY permitted in local/testing/development when DUKCAPIL_SIMULATION_ENABLED=true)
        if ($this->isSimulationAllowed()) {
            return [
                'verified'          => true,
                'is_simulated'      => true,
                'verification_mode' => 'simulation',
                'error_code'        => null,
                'message'           => 'Verifikasi simulasi pengembangan berhasil (bukan verifikasi resmi Dukcapil).',
                'data'              => $this->getSimulatedIdentity(),
            ];
        }

        // 3. Default Fail-Closed when API is not configured and simulation is disabled (or in production)
        Log::notice('Dukcapil verification rejected: official API is not enabled and simulation mode is disabled.');

        return [
            'verified'          => false,
            'is_simulated'      => false,
            'verification_mode' => 'unconfigured',
            'error_code'        => 'not_configured',
            'message'           => 'Layanan verifikasi NIK resmi belum terhubung. Silakan hubungi administrator DPMPTSP.',
            'data'              => null,
        ];
    }

    /**
     * Check whether official API credentials and endpoint are present.
     */
    public function isOfficialApiConfigured(): bool
    {
        if (!(bool) config('dukcapil.enabled', false)) {
            return false;
        }

        $endpoint = trim((string) config('dukcapil.endpoint', ''));
        $apiKey   = trim((string) config('dukcapil.api_key', ''));

        return $endpoint !== '' && $apiKey !== '' && filter_var($endpoint, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Check whether simulation mode is explicitly enabled and allowed in the current environment.
     * Simulation mode is NEVER allowed in production.
     */
    public function isSimulationAllowed(): bool
    {
        if (app()->environment('production')) {
            if ((bool) config('dukcapil.simulation_enabled', false)) {
                Log::critical('SECURITY GUARD: DUKCAPIL_SIMULATION_ENABLED cannot be used in production environment.');
            }
            return false;
        }

        if (!app()->environment(['local', 'testing', 'development'])) {
            return false;
        }

        return (bool) config('dukcapil.simulation_enabled', false);
    }

    /**
     * Execute HTTP request to official Dukcapil endpoint and validate response contract.
     */
    protected function verifyViaOfficialApi(string $nik): array
    {
        try {
            $response = $this->sendHttpRequest($nik);
        } catch (\Throwable $e) {
            // Never log full NIK, credentials, or sensitive payload
            Log::error('Dukcapil API connection error', [
                'exception' => get_class($e),
            ]);

            return [
                'verified'          => false,
                'is_simulated'      => false,
                'verification_mode' => 'official',
                'error_code'        => 'connection_error',
                'message'           => 'Gagal menghubungi layanan verifikasi Dukcapil. Silakan coba beberapa saat lagi.',
                'data'              => null,
            ];
        }

        return $this->parseAndValidateResponse($response, $nik);
    }

    /**
     * Perform the outbound HTTP request to the configured Dukcapil endpoint.
     * Separated so HTTP transport and authentication headers can be adjusted easily once official docs arrive.
     */
    protected function sendHttpRequest(string $nik): Response
    {
        $endpoint   = trim((string) config('dukcapil.endpoint'));
        $apiKey     = trim((string) config('dukcapil.api_key'));
        $userId     = trim((string) config('dukcapil.user_id', ''));
        $timeout    = max(1, (int) config('dukcapil.timeout', 10));
        $authScheme = strtolower(trim((string) config('dukcapil.auth_scheme', 'bearer')));
        $authHeader = trim((string) config('dukcapil.auth_header', 'Authorization')) ?: 'Authorization';

        $headers = [
            'Accept' => 'application/json',
        ];

        if ($authScheme === 'bearer') {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        } elseif ($authScheme === 'header') {
            $headers[$authHeader] = $apiKey;
        }

        $payload = [
            'nik' => $nik,
        ];

        if ($userId !== '') {
            $payload['user_id'] = $userId;
        }

        if ($authScheme === 'body') {
            $payload['api_key'] = $apiKey;
        }

        return Http::withHeaders($headers)
            ->timeout($timeout)
            ->post($endpoint, $payload);
    }

    /**
     * Validate HTTP response and map official payload into internal identity structure.
     * Never treats HTTP 200 alone as proof of valid NIK.
     */
    protected function parseAndValidateResponse(Response $response, string $nik): array
    {
        if (!$response->successful()) {
            Log::warning('Dukcapil API non-success HTTP status', [
                'status' => $response->status(),
            ]);

            return [
                'verified'          => false,
                'is_simulated'      => false,
                'verification_mode' => 'official',
                'error_code'        => 'rejected',
                'message'           => 'Verifikasi NIK gagal atau ditolak oleh layanan kependudukan. Silakan periksa kembali NIK Anda.',
                'data'              => null,
            ];
        }

        $json = $response->json();

        if (!is_array($json) || empty($json)) {
            Log::warning('Dukcapil API returned non-JSON or empty body on HTTP 200');

            return [
                'verified'          => false,
                'is_simulated'      => false,
                'verification_mode' => 'official',
                'error_code'        => 'invalid_response',
                'message'           => 'Format respons layanan verifikasi kependudukan tidak valid.',
                'data'              => null,
            ];
        }

        // Check explicit rejection indicators even when HTTP status is 200
        if ($this->isExplicitlyRejectedPayload($json)) {
            return [
                'verified'          => false,
                'is_simulated'      => false,
                'verification_mode' => 'official',
                'error_code'        => 'rejected',
                'message'           => 'Data NIK tidak ditemukan atau tidak sesuai pada layanan kependudukan.',
                'data'              => null,
            ];
        }

        $record = $this->extractRecordFromPayload($json);

        if (!is_array($record) || empty($record) || $this->isExplicitlyRejectedPayload($record)) {
            return [
                'verified'          => false,
                'is_simulated'      => false,
                'verification_mode' => 'official',
                'error_code'        => 'invalid_response',
                'message'           => 'Data identitas dari layanan verifikasi tidak lengkap atau tidak ditemukan.',
                'data'              => null,
            ];
        }

        // If response includes NIK field, verify it matches the requested NIK
        $returnedNik = $record['nik'] ?? $record['NIK'] ?? null;
        if ($returnedNik !== null && trim((string) $returnedNik) !== '' && trim((string) $returnedNik) !== $nik) {
            Log::warning('Dukcapil API response NIK mismatch');

            return [
                'verified'          => false,
                'is_simulated'      => false,
                'verification_mode' => 'official',
                'error_code'        => 'invalid_response',
                'message'           => 'Data identitas yang diterima tidak sesuai dengan permintaan verifikasi.',
                'data'              => null,
            ];
        }

        $mapped = $this->mapIdentityRecord($record);

        if ($mapped === null) {
            return [
                'verified'          => false,
                'is_simulated'      => false,
                'verification_mode' => 'official',
                'error_code'        => 'invalid_response',
                'message'           => 'Verifikasi NIK gagal: atribut nama lengkap tidak ditemukan pada respons layanan.',
                'data'              => null,
            ];
        }

        return [
            'verified'          => true,
            'is_simulated'      => false,
            'verification_mode' => 'official',
            'error_code'        => null,
            'message'           => 'Verifikasi NIK berhasil.',
            'data'              => $mapped,
        ];
    }

    /**
     * Detect explicit rejection flags inside a HTTP 200 JSON payload.
     */
    protected function isExplicitlyRejectedPayload(array $payload): bool
    {
        if (array_key_exists('success', $payload) && $payload['success'] !== true) {
            return true;
        }

        if (array_key_exists('valid', $payload) && $payload['valid'] !== true) {
            return true;
        }

        if (isset($payload['status']) && (is_string($payload['status']) || is_numeric($payload['status']))) {
            $statusNorm = strtolower(trim((string) $payload['status']));
            if (in_array($statusNorm, ['error', 'failed', 'fail', 'false', '0', 'rejected', 'not_found', 'invalid', 'gagal', 'tidak ditemukan', 'ditolak'], true)) {
                return true;
            }
        }

        if (isset($payload['code']) && is_numeric($payload['code']) && (int) $payload['code'] >= 400) {
            return true;
        }

        if (isset($payload['RESPON']) && is_string($payload['RESPON'])) {
            $responNorm = strtolower(trim($payload['RESPON']));
            if (str_contains($responNorm, 'tidak ditemukan') || str_contains($responNorm, 'gagal') || str_contains($responNorm, 'error')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extract the candidate identity associative array from common envelope structures.
     */
    protected function extractRecordFromPayload(array $json): ?array
    {
        if (isset($json['data']) && is_array($json['data'])) {
            // Handle both single object in `data` or list of records `data[0]`
            if (isset($json['data'][0]) && is_array($json['data'][0])) {
                return $json['data'][0];
            }
            return $json['data'];
        }

        if (isset($json['content']) && is_array($json['content'])) {
            if (isset($json['content'][0]) && is_array($json['content'][0])) {
                return $json['content'][0];
            }
            return $json['content'];
        }

        if (isset($json['result']) && is_array($json['result'])) {
            return $json['result'];
        }

        return $json;
    }

    /**
     * Map raw provider fields into internal identity schema.
     * Supports standard snake_case keys and common Dukcapil uppercase keys.
     */
    protected function mapIdentityRecord(array $record): ?array
    {
        $rawNama = $record['nama'] ?? $record['NAMA_LGKP'] ?? $record['nama_lengkap'] ?? null;
        if (!is_string($rawNama) && !is_numeric($rawNama)) {
            return null;
        }

        $nama = trim((string) $rawNama);
        if (strlen($nama) < 2 || in_array(strtolower($nama), ['null', 'undefined', '-', 'n/a'], true)) {
            return null;
        }

        $rawGender = $record['jenis_kelamin']
            ?? $record['JENIS_KLMIN']
            ?? $record['JENIS_KELAMIN']
            ?? $record['gender']
            ?? $record['sex']
            ?? $record['jk']
            ?? $record['JK']
            ?? null;
        $normalizedGender = $rawGender !== null ? GenderNormalizer::normalize((string) $rawGender) : GenderNormalizer::UNKNOWN;

        $tempatLahir  = $record['tempat_lahir'] ?? $record['TMPT_LHR'] ?? null;
        $tanggalLahir = $record['tanggal_lahir'] ?? $record['TGL_LHR'] ?? null;

        return [
            'nama'          => $nama,
            'jenis_kelamin' => $normalizedGender !== GenderNormalizer::UNKNOWN ? $normalizedGender : null,
            'tempat_lahir'  => ($tempatLahir !== null && trim((string) $tempatLahir) !== '') ? trim((string) $tempatLahir) : null,
            'tanggal_lahir' => ($tanggalLahir !== null && trim((string) $tanggalLahir) !== '') ? trim((string) $tanggalLahir) : null,
            'is_simulated'  => false,
        ];
    }

    /**
     * Stub identity used ONLY when DUKCAPIL_SIMULATION_ENABLED=true in non-production environments.
     */
    protected function getSimulatedIdentity(): array
    {
        return [
            'nama'          => 'Rahmat Hidayat',
            'jenis_kelamin' => 'Laki-laki',
            'tempat_lahir'  => 'Banjarmasin',
            'tanggal_lahir' => '1998-05-12',
            'is_simulated'  => true,
        ];
    }
}
