<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$user->isActive()) {
            return response()->json([
                'message' => 'Akun Anda berstatus nonaktif. Silakan hubungi Administrator.'
            ], 403);
        }

        if (!empty($roles) && !$user->hasRole(...$roles)) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses (role) untuk melakukan tindakan ini.'
            ], 403);
        }

        return $next($request);
    }
}

