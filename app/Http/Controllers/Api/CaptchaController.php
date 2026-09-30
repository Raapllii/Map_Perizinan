<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class CaptchaController extends Controller
{
    /**
     * Generate a math CAPTCHA challenge.
     * Token = base64(answer::timestamp::hmac) where hmac = HMAC-SHA256(answer::timestamp, APP_KEY).
     * Valid for 10 minutes (validated in DukcapilVerificationController).
     */
    public function challenge()
    {
        $a      = rand(1, 20);
        $b      = rand(1, 20);
        $op     = rand(0, 1) ? '+' : '-';
        $answer = $op === '+' ? $a + $b : $a - $b;

        $timestamp   = time();
        $payload     = $answer . '::' . $timestamp;
        $hmac        = hash_hmac('sha256', $payload, config('app.key'));
        $signedToken = base64_encode($payload . '::' . $hmac);

        return response()->json([
            'question' => "{$a} {$op} {$b} = ?",
            'token'    => $signedToken,
        ]);
    }
}
