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

    public function test_verify_nik_rate_limit_allows_10_requests_per_minute()
    {
        // Make 10 valid-format requests (they will fail NIK validation, but
        // the rate limiter runs before business logic, so we just need 11 hits).
        for ($i = 0; $i < 10; $i++) {
            $response = $this->getJson('/api/captcha-challenge');
            // Should NOT be rate-limited for the first 10 requests
            $response->assertStatus(200);
        }
    }

    public function test_verify_nik_rate_limit_blocks_on_11th_request()
    {
        // Exhaust the 10/min nik-verify limit by hitting captcha-challenge
        // (it shares the same throttle group)
        for ($i = 0; $i < 10; $i++) {
            $this->getJson('/api/captcha-challenge');
        }

        // The 11th request should be rate-limited (HTTP 429)
        $response = $this->getJson('/api/captcha-challenge');
        $response->assertStatus(429);
    }
}
