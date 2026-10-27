<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        $language = strtolower(explode(',', (string) $request->header('Accept-Language', 'fa'))[0]);
        app()->setLocale(str_starts_with($language, 'en') ? 'en' : 'fa');
        return $next($request);
    }
}
