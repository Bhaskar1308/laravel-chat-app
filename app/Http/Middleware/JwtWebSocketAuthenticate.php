<?php
namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class JwtWebSocketAuthenticate
{
    public function handle(Request $request, \Closure $next)
    {
        try {
            if (!$user = JWTAuth::parseToken()->authenticate()) {
                throw new UnauthorizedHttpException('jwt-auth', 'User not found');
            }
            // Store user for channel authorization step
            $request->setUserResolver(fn () => $user);
        } catch (JWTException) {
            throw new UnauthorizedHttpException('jwt-auth', 'Token invalid');
        }
        return $next($request);
    }
}