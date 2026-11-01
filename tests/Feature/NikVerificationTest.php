<?php

namespace Tests\Feature;

use App\Models\PublicMapVerification;
use App\Services\RecaptchaService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NikVerificationTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        // Configure test reCAPTCHA keys
        config([
            'recaptcha.site_key'          => RecaptchaService::GOOGLE_TEST_SITE,
            'recaptcha.secret_key'        => RecaptchaService::GOOGLE_TEST_SECRET,
            'recaptcha.allowed_hostnames' => ['localhost', '127.0.0.1', 'testkey.google.com'],
            'recaptcha.verify_url'        => 'https://www.google.com/recaptcha/api/siteverify',
            'recaptcha.timeout'           => 5,
            'dukcapil.enabled'            => false,
            'dukcapil.simulation_enabled' => true,
        ]);

        Cache::flush();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function fakeGoogleRecaptchaSuccess(string $hostname = 'testkey.google.com')
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'      => true,
                'challenge_ts' => now()->toIso8601String(),
                'hostname'     => $hostname,
            ], 200),
        ]);
    }

    private function fakeGoogleRecaptchaFailure(array $errorCodes = ['invalid-input-response'])
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'      => false,
                'error-codes'  => $errorCodes,
            ], 200),
        ]);
    }

    // ── 1. NIK Validation ─────────────────────────────────────────────────────

    public function test_verify_nik_requires_16_digit_nik()
    {
        $this->fakeGoogleRecaptchaSuccess();

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '123',
            'recaptcha_token' => 'valid-mock-token',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['nik']);
    }

    public function test_verify_nik_rejects_non_digit_nik()
    {
        $this->fakeGoogleRecaptchaSuccess();

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '320123456789000X',
            'recaptcha_token' => 'valid-mock-token',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['nik']);
    }

    public function test_verify_nik_rejects_17_digit_nik()
    {
        $this->fakeGoogleRecaptchaSuccess();

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '32012345678900011',
            'recaptcha_token' => 'valid-mock-token',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['nik']);
    }

    // ── 2. CAPTCHA Validation & Anti-Replay ───────────────────────────────────

    public function test_verify_nik_rejects_missing_recaptcha_token()
    {
        $response = $this->postJson('/api/verify-nik', [
            'nik' => '3201234567890001',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token']);
    }

    public function test_verify_nik_rejects_empty_recaptcha_token()
    {
        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => '   ',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token']);
    }

    public function test_verify_nik_rejects_invalid_recaptcha_from_google()
    {
        $this->fakeGoogleRecaptchaFailure(['invalid-input-response']);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'fake-invalid-token',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token'])
                 ->assertJsonFragment(['message' => 'Verifikasi CAPTCHA tidak valid. Silakan coba lagi.']);
    }

    public function test_verify_nik_rejects_expired_or_duplicate_recaptcha_token()
    {
        $this->fakeGoogleRecaptchaFailure(['timeout-or-duplicate']);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'expired-mock-token',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token']);
    }

    public function test_verify_nik_rejects_replayed_recaptcha_token_via_atomic_cache()
    {
        $this->fakeGoogleRecaptchaSuccess();

        $token = 'test-single-use-token-abc123xyz';

        // First verification: SUCCESS
        $firstResponse = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => $token,
        ]);
        $firstResponse->assertStatus(200);

        // Second verification replaying the SAME token: REJECTED by atomic cache protection
        $secondResponse = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => $token,
        ]);
        $secondResponse->assertStatus(422)
                       ->assertJsonValidationErrors(['recaptcha_token'])
                       ->assertJsonFragment(['message' => 'Token CAPTCHA sudah pernah digunakan atau sedang diproses. Silakan centang ulang CAPTCHA.']);
    }

    public function test_verify_nik_fails_closed_when_allowed_hostnames_empty()
    {
        $this->fakeGoogleRecaptchaSuccess();
        config(['recaptcha.allowed_hostnames' => []]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'mock-token-empty-host',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token'])
                 ->assertJsonFragment(['message' => 'Layanan verifikasi CAPTCHA belum dikonfigurasi dengan benar di server (daftar domain belum diatur).']);
    }

    public function test_verify_nik_rejects_disallowed_hostname()
    {
        // Google returned a hostname not in allowed list
        $this->fakeGoogleRecaptchaSuccess('malicious-site.com');

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'mock-token-from-bad-host',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token'])
                 ->assertJsonFragment(['message' => 'Verifikasi CAPTCHA ditolak: domain tidak diizinkan.']);
    }

    public function test_verify_nik_handles_google_connection_timeout_or_error()
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('Connection timed out');
            },
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'mock-token-timeout',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token'])
                 ->assertJsonFragment(['message' => 'Gagal menghubungi server verifikasi CAPTCHA. Silakan periksa koneksi Anda dan coba lagi.']);
    }

    public function test_verify_nik_fails_safely_when_secret_key_not_configured()
    {
        config(['recaptcha.secret_key' => '']);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'mock-token-no-secret',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token'])
                 ->assertJsonFragment(['message' => 'Layanan verifikasi CAPTCHA belum dikonfigurasi dengan benar di server.']);
    }

    // ── 3. Production Environment Security Guards ────────────────────────────

    public function test_verify_nik_blocks_test_keys_in_production_environment()
    {
        $this->app['env'] = 'production';

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'mock-token-prod-testkey',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token'])
                 ->assertJsonFragment(['message' => 'Konfigurasi keamanan reCAPTCHA server tidak valid untuk environment production.']);
    }

    public function test_verify_nik_blocks_testkey_hostname_in_production_environment()
    {
        $this->app['env'] = 'production';
        config(['recaptcha.secret_key' => 'valid-prod-secret-key-xyz']);
        config(['recaptcha.site_key'   => 'valid-prod-site-key-xyz']);

        $this->fakeGoogleRecaptchaSuccess('testkey.google.com');

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'mock-token-prod-hostname',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token'])
                 ->assertJsonFragment(['message' => 'Verifikasi CAPTCHA ditolak: test key tidak diizinkan pada server produksi.']);
    }

    // ── 4. Success Flow & Dukcapil Stub ───────────────────────────────────────

    public function test_verify_nik_returns_token_and_biodata_when_captcha_and_nik_valid()
    {
        $this->fakeGoogleRecaptchaSuccess();

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'valid-fresh-token-12345',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'status',
                     'data' => [
                         'verification_token',
                         'nama',
                         'identity' => [
                             'nama',
                             'jenis_kelamin',
                             'tempat_lahir',
                             'tanggal_lahir',
                         ],
                     ],
                 ])
                 ->assertJson(['status' => 'success']);

        $identity = $response->json('data.identity');
        $this->assertEquals('Rahmat Hidayat', $identity['nama']);
        $this->assertEquals('Laki-laki', $identity['jenis_kelamin']);
        $this->assertEquals('Banjarmasin', $identity['tempat_lahir']);
        $this->assertEquals('1998-05-12', $identity['tanggal_lahir']);

        $token = $response->json('data.verification_token');
        $this->assertNotEmpty($token);
        $this->assertEquals(64, strlen($token));

        // Ensure database record created with hash
        $this->assertDatabaseHas('public_map_verifications', [
            'token_hash'    => hash('sha256', $token),
            'verified_nik'  => '3201234567890001',
            'verified_name' => 'Rahmat Hidayat',
            'used_at'       => null,
        ]);
    }

    public function test_verify_nik_response_never_exposes_nik()
    {
        $this->fakeGoogleRecaptchaSuccess();

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'valid-fresh-token-safe',
        ]);

        $response->assertStatus(200);
        $this->assertArrayNotHasKey('nik', $response->json('data'));
        $this->assertStringNotContainsString('3201234567890001', $response->content());
    }

    public function test_stub_mode_does_not_make_external_dukcapil_request()
    {
        $this->fakeGoogleRecaptchaSuccess();

        $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'token-stub-check',
        ])->assertStatus(200);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://www.google.com/recaptcha/api/siteverify';
        });
    }

    public function test_dukcapil_error_does_not_expose_raw_body()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'secret-key-12345',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'  => true,
                'hostname' => 'testkey.google.com',
            ], 200),
            'https://api.dukcapil.fake/verify' => Http::response([
                'raw_internal_error' => 'DATABASE_CONNECTION_TIMEOUT_SQL_10023',
                'secret_trace'       => 'Trace line 42 /var/www/internal',
            ], 500),
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'token-dukcapil-err',
        ]);

        $response->assertStatus(422);
        $this->assertStringNotContainsString('DATABASE_CONNECTION_TIMEOUT', $response->content());
        $this->assertStringNotContainsString('secret_trace', $response->content());
        $this->assertStringNotContainsString('secret-key-12345', $response->content());
    }

    // ── 5. End-to-End Multi-Step Access Flow & Anti-Replay ────────────────────

    public function test_successful_captcha_verification_enables_public_map_access_logging()
    {
        $this->fakeGoogleRecaptchaSuccess();

        // Step 1: Verify NIK + CAPTCHA
        $verifyRes = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'token-e2e-access',
        ]);
        $verifyRes->assertStatus(200);

        $verificationToken = $verifyRes->json('data.verification_token');
        $verifiedName      = $verifyRes->json('data.nama');

        // Step 2: Submit Instansi to get Public Map access
        $accessRes = $this->postJson('/api/public-map-access', [
            'verification_token' => $verificationToken,
            'nama'               => $verifiedName,
            'instansi'           => 'Dinas Penanaman Modal',
        ]);
        $accessRes->assertStatus(201)
                  ->assertJsonStructure([
                      'status',
                      'data' => ['id', 'access_log_id', 'nama', 'instansi', 'accessed_at'],
                  ]);

        // Verify log recorded in DB
        $this->assertDatabaseHas('public_map_access_logs', [
            'nik'      => '3201234567890001',
            'nama'     => $verifiedName,
            'instansi' => 'Dinas Penanaman Modal',
        ]);

        // Step 3: Replaying the SAME verification token must be rejected (single-use)
        $replayRes = $this->postJson('/api/public-map-access', [
            'verification_token' => $verificationToken,
            'nama'               => $verifiedName,
            'instansi'           => 'Dinas Penanaman Modal',
        ]);
        $replayRes->assertStatus(422)
                  ->assertJsonValidationErrors(['verification_token']);
    }

    // ── 6. Live Google Integration (No Mock) ──────────────────────────────────

    public function test_live_google_siteverify_integration_with_official_test_key()
    {
        // Notice: NO Http::fake() here! This sends a real HTTP request to Google
        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'live-google-test-token-' . uniqid(),
        ]);

        // Real Google siteverify returns success: true and hostname: testkey.google.com for official test keys
        $response->assertStatus(200)
                 ->assertJson(['status' => 'success']);

        $this->assertNotEmpty($response->json('data.verification_token'));
    }

    // ── 7. reCAPTCHA v3 Score & Action Tests ─────────────────────────────────

    public function test_verify_nik_rejects_recaptcha_v3_low_score()
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'      => true,
                'challenge_ts' => now()->toIso8601String(),
                'hostname'     => 'testkey.google.com',
                'score'        => 0.1, // Low score (bot)
                'action'       => 'verify_identity',
            ], 200),
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'mock-low-score-token',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token'])
                 ->assertJsonFragment(['recaptcha_token' => ['Verifikasi keamanan mendeteksi aktivitas tidak wajar. Silakan coba lagi.']]);
    }

    public function test_verify_nik_rejects_recaptcha_v3_action_mismatch()
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'      => true,
                'challenge_ts' => now()->toIso8601String(),
                'hostname'     => 'testkey.google.com',
                'score'        => 0.9,
                'action'       => 'wrong_action', // Mismatched action
            ], 200),
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'mock-action-mismatch-token',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recaptcha_token'])
                 ->assertJsonFragment(['recaptcha_token' => ['Aksi verifikasi keamanan tidak valid.']]);
    }

    public function test_verify_nik_accepts_recaptcha_v3_valid_score_and_action()
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'      => true,
                'challenge_ts' => now()->toIso8601String(),
                'hostname'     => 'testkey.google.com',
                'score'        => 0.9, // High score (human)
                'action'       => 'verify_identity',
            ], 200),
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'mock-v3-success-token',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['status' => 'success']);

        $this->assertNotEmpty($response->json('data.verification_token'));
    }

    // ── 8. Dukcapil Official API Contract, Simulation Guards & Failure Modes ──

    public function test_verify_nik_fails_closed_when_api_not_configured_and_simulation_disabled()
    {
        $this->fakeGoogleRecaptchaSuccess();
        config([
            'dukcapil.enabled'            => false,
            'dukcapil.simulation_enabled' => false,
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'token-unconfigured-api',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'not_configured',
                 ]);

        // Must NOT create any verification token
        $this->assertDatabaseMissing('public_map_verifications', [
            'verified_nik' => '3201234567890001',
        ]);
    }

    public function test_verify_nik_fails_closed_when_enabled_but_endpoint_or_key_missing()
    {
        $this->fakeGoogleRecaptchaSuccess();
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => '',
            'dukcapil.api_key'  => '',
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890002',
            'recaptcha_token' => 'token-missing-creds',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'not_configured',
                 ]);
    }

    public function test_simulation_mode_is_strictly_blocked_in_production_environment()
    {
        $this->app['env'] = 'production';
        config([
            'recaptcha.secret_key'        => 'prod-secret-key-xyz',
            'recaptcha.site_key'          => 'prod-site-key-xyz',
            'recaptcha.allowed_hostnames' => ['peta.dpmptsp.go.id'],
            'dukcapil.enabled'            => false,
            'dukcapil.simulation_enabled' => true, // Even if someone sets true in prod!
        ]);

        $this->fakeGoogleRecaptchaSuccess('peta.dpmptsp.go.id');

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890003',
            'recaptcha_token' => 'token-prod-sim-blocked',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'not_configured',
                 ]);
    }

    public function test_simulation_mode_marks_response_as_simulated_never_official()
    {
        $this->fakeGoogleRecaptchaSuccess();
        config([
            'dukcapil.enabled'            => false,
            'dukcapil.simulation_enabled' => true,
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890004',
            'recaptcha_token' => 'token-sim-flag-check',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.is_simulated', true)
                 ->assertJsonPath('data.verification_mode', 'simulation')
                 ->assertJsonPath('data.identity.is_simulated', true);
    }

    public function test_official_api_handles_connection_failure_gracefully()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'official-key-xyz',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'  => true,
                'hostname' => 'testkey.google.com',
            ], 200),
            'https://api.dukcapil.fake/verify' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('Could not resolve host');
            },
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890005',
            'recaptcha_token' => 'token-conn-fail',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'connection_error',
                 ]);
        $this->assertStringNotContainsString('official-key-xyz', $response->content());
    }

    public function test_official_api_rejects_http_200_when_payload_indicates_rejection()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'official-key-xyz',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'  => true,
                'hostname' => 'testkey.google.com',
            ], 200),
            'https://api.dukcapil.fake/verify' => Http::response([
                'status'  => 'not_found',
                'success' => false,
                'message' => 'Data NIK tidak ditemukan',
            ], 200),
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890006',
            'recaptcha_token' => 'token-200-rejected',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'rejected',
                 ]);
    }

    public function test_official_api_rejects_http_200_with_invalid_or_incomplete_payload()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'official-key-xyz',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'  => true,
                'hostname' => 'testkey.google.com',
            ], 200),
            // HTTP 200 but missing nama attribute
            'https://api.dukcapil.fake/verify' => Http::response([
                'status' => 'ok',
                'data'   => [
                    'tempat_lahir' => 'Banjarbaru',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890007',
            'recaptcha_token' => 'token-200-invalid-schema',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'invalid_response',
                 ]);
    }

    public function test_official_api_accepts_valid_contract_and_marks_as_official()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'official-key-xyz',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'  => true,
                'hostname' => 'testkey.google.com',
            ], 200),
            'https://api.dukcapil.fake/verify' => Http::response([
                'status'  => 'success',
                'success' => true,
                'data'    => [
                    'nik'           => '3201234567890008',
                    'nama'          => 'Siti Aminah',
                    'jenis_kelamin' => 'Perempuan',
                    'tempat_lahir'  => 'Banjarbaru',
                    'tanggal_lahir' => '1995-08-17',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890008',
            'recaptcha_token' => 'token-official-success',
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'data'   => [
                         'nama'              => 'Siti Aminah',
                         'verification_mode' => 'official',
                         'is_simulated'      => false,
                         'identity'          => [
                             'nama'          => 'Siti Aminah',
                             'jenis_kelamin' => 'Perempuan',
                             'tempat_lahir'  => 'Banjarbaru',
                             'tanggal_lahir' => '1995-08-17',
                             'is_simulated'  => false,
                         ],
                     ],
                 ]);

        // Ensure NIK is never exposed in response
        $this->assertStringNotContainsString('3201234567890008', $response->content());
    }
}
