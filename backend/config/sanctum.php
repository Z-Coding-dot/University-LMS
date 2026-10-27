<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:5173,localhost:8000,127.0.0.1,127.0.0.1:5173,127.0.0.1:8000')),
    'guard' => env('LMS_AUTH_MODE', 'cookie') === 'cookie' ? ['web'] : [],
    'expiration' => 120, 'token_prefix' => '',
    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
