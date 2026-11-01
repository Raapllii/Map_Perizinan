<?php

namespace Tests\Unit;

use App\Services\RecaptchaService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DukcapilServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Use in-memory SQLite so tests run deterministically in isolated sandboxes
        Config::set('database.default', 'sqlite');
        Config::set('database.connections.sqlite', [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ]);
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('public_map_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('token_hash', 64)->unique();
            $table->string('verified_nik', 16);
            $table->string('verified_name');
            $table->string('verified_gender', 32)->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });

        Schema::create('public_map_access_logs', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('instansi');
            $table->string('nik', 16)->nullable();
            $table->string('jenis_kelamin', 32)->nullable();
            $table->timestamp('accessed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();
        });

        config([
            'recaptcha.site_key'          => RecaptchaService::GOOGLE_TEST_SITE,
            'recaptcha.secret_key'        => RecaptchaService::GOOGLE_TEST_SECRET,
            'recaptcha.allowed_hostnames' => ['localhost', '127.0.0.1', 'testkey.google.com'],
            'recaptcha.verify_url'        => 'https://www.google.com/recaptcha/api/siteverify',
            'recaptcha.timeout'           => 5,
            'dukcapil.enabled'            => false,
            'dukcapil.simulation_enabled' => false,
            'dukcapil.endpoint'           => '',
            'dukcapil.api_key'            => '',
        ]);

        Cache::flush();
    }

    private function fakeRecaptchaSuccess(string $hostname = 'testkey.google.com'): void
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'      => true,
                'challenge_ts' => now()->toIso8601String(),
                'hostname'     => $hostname,
            ], 200),
        ]);
    }

    public function test_fails_closed_when_api_is_not_configured_by_default()
    {
        $this->fakeRecaptchaSuccess();

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890001',
            'recaptcha_token' => 'token-default-unconfigured',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'not_configured',
                 ]);

        $this->assertDatabaseCount('public_map_verifications', 0);
    }

    public function test_fails_closed_when_enabled_without_endpoint_or_api_key()
    {
        $this->fakeRecaptchaSuccess();
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => '',
            'dukcapil.api_key'  => '',
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890002',
            'recaptcha_token' => 'token-enabled-empty-creds',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'not_configured',
                 ]);
    }

    public function test_simulation_mode_is_blocked_in_production_even_when_explicitly_enabled()
    {
        $this->app['env'] = 'production';
        config([
            'recaptcha.secret_key'        => 'prod-secret-key',
            'recaptcha.site_key'          => 'prod-site-key',
            'recaptcha.allowed_hostnames' => ['peta.dpmptsp.go.id'],
            'dukcapil.enabled'            => false,
            'dukcapil.simulation_enabled' => true,
        ]);

        $this->fakeRecaptchaSuccess('peta.dpmptsp.go.id');

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890003',
            'recaptcha_token' => 'token-prod-simulation-blocked',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'not_configured',
                 ]);
    }

    public function test_explicit_simulation_in_non_production_marks_result_as_simulated()
    {
        $this->fakeRecaptchaSuccess();
        config([
            'dukcapil.enabled'            => false,
            'dukcapil.simulation_enabled' => true,
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890004',
            'recaptcha_token' => 'token-explicit-sim',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.is_simulated', true)
                 ->assertJsonPath('data.verification_mode', 'simulation')
                 ->assertJsonPath('data.identity.is_simulated', true);
    }

    public function test_official_api_connection_failure_is_handled_safely()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'super-secret-api-key',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'  => true,
                'hostname' => 'testkey.google.com',
            ], 200),
            'https://api.dukcapil.fake/verify' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('Connection timed out');
            },
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890005',
            'recaptcha_token' => 'token-conn-timeout',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'connection_error',
                 ]);
        $this->assertStringNotContainsString('super-secret-api-key', $response->content());
        $this->assertStringNotContainsString('3201234567890005', $response->content());
    }

    public function test_official_api_rejects_http_200_with_rejection_status_flag()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'super-secret-api-key',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'  => true,
                'hostname' => 'testkey.google.com',
            ], 200),
            'https://api.dukcapil.fake/verify' => Http::response([
                'status'  => 'rejected',
                'success' => false,
                'message' => 'NIK tidak terdaftar',
            ], 200),
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890006',
            'recaptcha_token' => 'token-http-200-rejected',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'rejected',
                 ]);
    }

    public function test_official_api_rejects_http_200_with_missing_nama_or_mismatched_nik()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'super-secret-api-key',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'  => true,
                'hostname' => 'testkey.google.com',
            ], 200),
            'https://api.dukcapil.fake/verify' => Http::response([
                'status' => 'success',
                'data'   => [
                    'nik'  => '9999999999999999', // Mismatched NIK
                    'nama' => 'Orang Lain',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890007',
            'recaptcha_token' => 'token-nik-mismatch',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik'])
                 ->assertJson([
                     'status'     => 'error',
                     'error_code' => 'invalid_response',
                 ]);
    }

    public function test_official_api_success_contract_and_single_use_token_consumption()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'super-secret-api-key',
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
                    'NIK'         => '3201234567890008',
                    'NAMA_LGKP'   => 'Budi Santoso',
                    'JENIS_KLMIN' => 'Laki-laki',
                    'TMPT_LHR'    => 'Banjarbaru',
                    'TGL_LHR'     => '1990-01-20',
                ],
            ], 200),
        ]);

        $verifyRes = $this->postJson('/api/verify-nik', [
            'nik'             => '3201234567890008',
            'recaptcha_token' => 'token-official-valid-e2e',
        ]);

        $verifyRes->assertStatus(200)
                  ->assertJson([
                      'status' => 'success',
                      'data'   => [
                          'nama'              => 'Budi Santoso',
                          'verification_mode' => 'official',
                          'is_simulated'      => false,
                          'identity'          => [
                              'nama'          => 'Budi Santoso',
                              'jenis_kelamin' => 'Laki-laki',
                              'tempat_lahir'  => 'Banjarbaru',
                              'tanggal_lahir' => '1990-01-20',
                              'is_simulated'  => false,
                          ],
                      ],
                  ]);

        $token = $verifyRes->json('data.verification_token');
        $this->assertNotEmpty($token);

        // Consume single-use token on /api/public-map-access
        $accessRes = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => 'Budi Santoso',
            'instansi'           => 'DPMPTSP Kota Banjarbaru',
        ]);
        $accessRes->assertStatus(201);

        // Replaying the token must fail
        $replayRes = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => 'Budi Santoso',
            'instansi'           => 'DPMPTSP Kota Banjarbaru',
        ]);
        $replayRes->assertStatus(422)
                  ->assertJsonValidationErrors(['verification_token']);
    }
}

