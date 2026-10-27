<?php

use App\Http\Controllers\InstallerController;
use Illuminate\Support\Facades\Route;

Route::get('/install/{token}', InstallerController::class)->withoutMiddleware([
    // Installation must work before the database-backed sessions table exists.
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
])->name('lms.install');
Route::fallback(function () {
    abort_if(request()->is('api', 'api/*', 'sanctum', 'sanctum/*', 'install', 'install/*'), 404);
    abort_unless(is_file(public_path('index.html')), 503);
    return response()->file(public_path('index.html'), ['Cache-Control' => 'no-cache, no-store, must-revalidate']);
});
