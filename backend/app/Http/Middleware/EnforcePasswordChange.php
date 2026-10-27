<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;

class EnforcePasswordChange
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()->role === Role::Admin && $request->user()->must_change_password && !$request->routeIs('auth.me', 'auth.logout', 'profile.password')) abort(403, __('messages.password_change_required'));
        return $next($request);
    }
}
