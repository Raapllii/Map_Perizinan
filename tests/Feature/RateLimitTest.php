<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\RateLimiter;

class RateLimitTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Clear rate limit counters before each test
        RateLimiter::clear('nik-verify|127.0.0.1');
        RateLimiter::clear('throttle:nik-verify');
    }

    public function test_captcha_challenge_rate_limit_allows_10_requests_and_blocks_on_11th()
    {
        for ($i = 0; $i < 10; $i++) {
            $response = $this->getJson('/api/captcha-challenge');
            $response->assertStatus(200);
        }

        // 11th request: HTTP 429 Too Many Requests
        $response = $this->getJson('/api/captcha-challenge');
        $response->assertStatus(429);
    }

    public function test_verify_nik_endpoint_is_protected_by_rate_limiter()
    {
        // First 10 requests are allowed through to controller (failing on missing data 422, not 429)
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/verify-nik', []);
            $response->assertStatus(422);
        }

        // 11th request: HTTP 429 Too Many Requests
        $response = $this->postJson('/api/verify-nik', []);
        $response->assertStatus(429);
    }
}
