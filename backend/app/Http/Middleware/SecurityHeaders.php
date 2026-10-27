<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Content-Security-Policy', "frame-ancestors 'none'");
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        if ($request->is('api/*', 'sanctum/*', 'install/*')) $response->headers->set('Cache-Control', 'no-store, private');
        return $response;
    }
}
