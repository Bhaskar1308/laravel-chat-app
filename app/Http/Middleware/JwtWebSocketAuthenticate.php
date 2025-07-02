<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class JwtWebSocketAuthenticate
{
    public function handle(Request $request, Closure $next)
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            Log::info('❌ Missing or malformed Authorization header');
            throw new UnauthorizedHttpException('jwt-auth', 'Missing or invalid Authorization header');
        }

        try {
            // ✅ Correct way to parse and authenticate token using tymon/jwt-auth
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                Log::info('❌ No user found for token');
                throw new UnauthorizedHttpException('jwt-auth', 'User not found');
            }

            // ✅ Set the user manually so Broadcast::channel() has access
            auth()->setUser($user);

            Log::info('✅ Authenticated user from token:', [$user->toArray()]);
        } catch (\Exception $e) {
            Log::info('❌ JWT Exception:', [$e->getMessage()]);
            throw new UnauthorizedHttpException('jwt-auth', 'Token invalid', $e);
        }

        return $next($request);
    }
}
