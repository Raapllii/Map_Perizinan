<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Http;

class NikVerificationTest extends TestCase
{
    // ── Helper ────────────────────────────────────────────────────────────────

    private function getValidCaptchaToken(): array
    {
        $challenge = $this->getJson('/api/captcha-challenge')->json();
        preg_match('/^(\d+) ([+\-]) (\d+)/', $challenge['question'], $m);
        $answer = $m[2] === '+' ? (int)$m[1] + (int)$m[3] : (int)$m[1] - (int)$m[3];
        return ['token' => $challenge['token'], 'answer' => (string) $answer];
    }

    // ── C: NIK Validation ────────────────────────────────────────────────────

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

    // ── B: CAPTCHA ───────────────────────────────────────────────────────────

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
        // Valid structure but wrong HMAC
        $timestamp   = time();
        $fakeHmac    = str_repeat('a', 64);
        $badToken    = base64_encode("10::{$timestamp}::{$fakeHmac}");

        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $badToken,
            'captcha_answer' => '10',
        ]);

        $response->assertStatus(422)
                 ->assertJson(['message' => 'CAPTCHA tidak valid.']);
    }

    // ── E: Dukcapil stub ─────────────────────────────────────────────────────

    public function test_verify_nik_returns_name_on_success_with_stub()
    {
        config(['dukcapil.enabled' => false]);

        $captcha = $this->getValidCaptchaToken();
        $response = $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ]);
        $response->assertStatus(200)
                 ->assertJsonStructure(['status', 'data' => ['nama']])
                 ->assertJson(['status' => 'success']);
    }

    public function test_stub_mode_does_not_make_external_http_request()
    {
        config(['dukcapil.enabled' => false]);
        Http::fake(); // any real HTTP call would be recorded

        $captcha = $this->getValidCaptchaToken();
        $this->postJson('/api/verify-nik', [
            'nik'            => '3201234567890001',
            'captcha_token'  => $captcha['token'],
            'captcha_answer' => $captcha['answer'],
        ])->assertStatus(200);

        Http::assertNothingSent();
    }

    // ── F: Public API response does not expose sensitive fields ──────────────

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
    }
}
