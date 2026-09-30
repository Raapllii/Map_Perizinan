<?php

namespace Tests\Feature;

use Tests\TestCase;

class NikVerificationTest extends TestCase
{
    private function getValidCaptchaToken(): array
    {
        $challenge = $this->getJson('/api/captcha-challenge')->json();
        preg_match('/^(\d+) ([+\-]) (\d+)/', $challenge['question'], $m);
        $answer = $m[2] === '+' ? (int)$m[1] + (int)$m[3] : (int)$m[1] - (int)$m[3];
        return ['token' => $challenge['token'], 'answer' => (string) $answer];
    }

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

    public function test_verify_nik_returns_name_on_success()
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
}
