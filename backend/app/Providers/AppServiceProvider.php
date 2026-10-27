<?php

namespace App\Providers;

use App\Support\{Digits, PasswordHasher};
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\{Carbon, ServiceProvider};
use Illuminate\Support\Facades\{Hash, RateLimiter};

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Hash::extend('bcrypt', fn ($app) => new PasswordHasher($app['config']['hashing.bcrypt']));
        Carbon::serializeUsing(fn ($date) => $date->utc()->toIso8601String());
        \Carbon\CarbonImmutable::serializeUsing(fn ($date) => $date->utc()->toIso8601String());
        RateLimiter::for('lms-login', function (Request $request) {
            $raw = $request->input('identifier');
            $identifier = is_string($raw) ? mb_strtolower(trim(Digits::normalize($raw))) : '';
            return Limit::perMinute(5)->by(hash('sha256', $identifier.'|'.$request->ip()))
                ->response(fn ($request, $headers) => response()->json(['message' => __('messages.throttled')], 429, $headers));
        });
    }
}
