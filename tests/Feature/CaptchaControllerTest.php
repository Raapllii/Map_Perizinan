<?php

namespace Tests\Feature;

use Tests\TestCase;

class CaptchaControllerTest extends TestCase
{
    public function test_captcha_challenge_returns_question_and_token()
    {
        $response = $this->getJson('/api/captcha-challenge');

        $response->assertStatus(410)
                 ->assertJson(['status' => 'deprecated']);
    }
}
