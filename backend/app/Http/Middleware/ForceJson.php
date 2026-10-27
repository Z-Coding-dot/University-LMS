<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForceJson
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->is('api', 'api/*', 'sanctum', 'sanctum/*', 'install/*')) $request->headers->set('Accept', 'application/json');
        return $next($request);
    }
}
