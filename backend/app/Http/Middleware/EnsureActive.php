<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use App\Services\Accounts\AccountService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureActive
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()->status !== UserStatus::Active) {
            app(AccountService::class)->invalidate($request->user());
            if ($request->hasSession()) { Auth::guard('web')->logout(); $request->session()->invalidate(); $request->session()->regenerateToken(); }
            abort(403, __('messages.inactive'));
        }
        return $next($request);
    }
}
