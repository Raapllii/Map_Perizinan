<?php

namespace Tests\Feature;

use App\Models\PublicMapVerification;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NikVerificationTest extends TestCase
{
    use DatabaseTransactions;

    // ── Helper ────────────────────────────────────────────────────────────────

    private function getValidCaptchaToken(): array
    {
        $challenge = $this->getJson('/api/captcha-challenge')->json();
        preg_match('/^(\d+) ([+\-]) (\d+)/', $challenge['question'], $m);
        $answer = $m[2] === '+' ? (int)$m[1] + (int)$m[3] : (int)$m[1] - (int)$m[3];
        return ['token' => $challenge['token'], 'answer' => (string) $answer];
    }

    // ── NIK Validation ────────────────────────────────────────────────────────

    public function test_verify_nik_requires_16_digit_nik()
    {
        $captcha = $this->getValidCaptchaToken();
        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '123',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['nik']);
    }

    public function test_verify_nik_rejects_non_digit_nik()
    {
        $captcha = $this->getValidCaptchaToken();
        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '320123456789000X',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['nik']);
    }

    public function test_verify_nik_rejects_17_digit_nik()
    {
        $captcha = $this->getValidCaptchaToken();
        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '32012345678900011',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['nik']);
    }

    // ── CAPTCHA Validation & Anti-Replay ──────────────────────────────────────

    public function test_verify_nik_rejects_wrong_captcha()
    {
        $captcha = $this->getValidCaptchaToken();
        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => '999999',
        ]);
        $response->assertStatus(422)
                 ->assertJson(['message' => 'CAPTCHA tidak valid.']);
    }

    public function test_verify_nik_rejects_expired_captcha()
    {
        // Forge a token where timestamp is 11 minutes in the past (> 600s expiry)
        $answer    = 5;
        $timestamp = time() - 661;
        $payload   = $answer . '::' . $timestamp;
        $hmac      = hash_hmac('sha256', $payload, config('app.key'));
        $expiredToken = base64_encode($payload . '::' . $hmac);

        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $expiredToken,
            'captcha_answer' => (string) $answer,
        ]);

        $response->assertStatus(422)
                 ->assertJson(['message' => 'CAPTCHA tidak valid.']);
    }

    public function test_verify_nik_rejects_tampered_token()
    {
        $timestamp = time();
        $fakeHmac  = str_repeat('a', 64);
        $badToken  = base64_encode("10::{$timestamp}::{$fakeHmac}");

        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $badToken,
            'captcha_answer' => '10',
        ]);

        $response->assertStatus(422)
                 ->assertJson(['message' => 'CAPTCHA tidak valid.']);
    }

    public function test_verify_nik_rejects_replayed_captcha()
    {
        config(['dukcapil.enabled' => false]);

        $captcha = $this->getValidCaptchaToken();

        // First verification with this CAPTCHA: SUCCESS
        $firstResponse = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ]);
        $firstResponse->assertStatus(200);

        // Second verification replaying the SAME CAPTCHA token: REJECTED
        $secondResponse = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ]);
        $secondResponse->assertStatus(422)
                       ->assertJson(['message' => 'CAPTCHA tidak valid.']);
    }

    // ── Dukcapil Stub & External Isolation ───────────────────────────────────

    public function test_verify_nik_returns_token_and_name_on_success_with_stub()
    {
        config(['dukcapil.enabled' => false]);

        $captcha = $this->getValidCaptchaToken();
        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['status', 'data' => ['verification_token', 'nama']])
                 ->assertJson(['status' => 'success']);

        $token = $response->json('data.verification_token');
        $this->assertNotEmpty($token);
        $this->assertEquals(64, strlen($token));

        // Ensure verification record exists in database
        $this->assertDatabaseHas('public_map_verifications', [
            'token_hash'   => hash('sha256', $token),
            'verified_nik' => '3201234567890001',
            'used_at'      => null,
        ]);
    }

    public function test_stub_mode_does_not_make_external_http_request()
    {
        config(['dukcapil.enabled' => false]);
        Http::fake();

        $captcha = $this->getValidCaptchaToken();
        $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ])->assertStatus(200);

        Http::assertNothingSent();
    }

    public function test_verify_nik_response_does_not_expose_nik()
    {
        config(['dukcapil.enabled' => false]);

        $captcha = $this->getValidCaptchaToken();
        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ]);
        $response->assertStatus(200);

        $this->assertArrayNotHasKey('nik', $response->json('data'));
        $this->assertStringNotContainsString('3201234567890001', $response->content());
    }

    public function test_dukcapil_error_does_not_expose_raw_body()
    {
        config([
            'dukcapil.enabled'  => true,
            'dukcapil.endpoint' => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'  => 'secret-key-12345',
        ]);

        Http::fake([
            'https://api.dukcapil.fake/verify' => Http::response([
                'raw_internal_error' => 'DATABASE_CONNECTION_TIMEOUT_SQL_10023',
                'secret_trace'       => 'Trace line 42 /var/www/internal',
            ], 500),
        ]);

        $captcha = $this->getValidCaptchaToken();
        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ]);

        $response->assertStatus(422);
        $this->assertStringNotContainsString('DATABASE_CONNECTION_TIMEOUT', $response->content());
        $this->assertStringNotContainsString('secret_trace', $response->content());
        $this->assertStringNotContainsString('secret-key-12345', $response->content());
    }
}
