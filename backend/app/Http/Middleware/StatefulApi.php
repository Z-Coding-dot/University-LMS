<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

class StatefulApi
{
    public function handle(Request $request, Closure $next)
    {
        // Resolve the mode after configuration is loaded, including config caches.
        return config('lms.auth_mode') === 'cookie'
            ? app(EnsureFrontendRequestsAreStateful::class)->handle($request, $next)
            : $next($request);
    }
}
