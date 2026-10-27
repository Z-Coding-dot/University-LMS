<?php

use App\Http\Middleware\{ForceJson, SetLocale, EnsureActive, EnforcePasswordChange, RequireRole, SecurityHeaders, StatefulApi};
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\{Exceptions, Middleware};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php', api: __DIR__.'/../routes/api.php', commands: __DIR__.'/../routes/console.php', apiPrefix: 'api/v1')
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->prepend([ForceJson::class, SetLocale::class, SecurityHeaders::class]);
        $middleware->api(prepend: [StatefulApi::class]);
        $middleware->trimStrings(except: ['password', 'password_confirmation', 'current_password']);
        $middleware->alias(['active' => EnsureActive::class, 'password.changed' => EnforcePasswordChange::class, 'role' => RequireRole::class]);
        foreach ([EnsureActive::class, EnforcePasswordChange::class, RequireRole::class] as $class) {
            $middleware->prependToPriorityList(\Illuminate\Routing\Middleware\SubstituteBindings::class, $class);
        }
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontFlash(['password', 'password_confirmation', 'current_password', 'initial_password']);
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api', 'api/*', 'sanctum', 'sanctum/*', 'install/*') || $request->expectsJson());
        $exceptions->report(function (\Illuminate\Database\QueryException $e) {
            Log::error('Database operation failed', ['sqlstate' => $e->errorInfo[0] ?? 'unknown']);
            return false; // Do not log SQL, bindings, credential hashes, or exception arguments.
        });
        $exceptions->render(function (Throwable $e, Request $request) {
            if (!$request->is('api', 'api/*', 'sanctum', 'sanctum/*', 'install/*') && !$request->expectsJson()) return null;
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) return $e->getResponse();
            if ($e instanceof \Illuminate\Validation\ValidationException) return response()->json(['message' => __('messages.validation'), 'errors' => $e->errors()], 422);
            if ($e instanceof \Illuminate\Http\Exceptions\PostTooLargeException) return response()->json(['message' => __('messages.upload_too_large'), 'errors' => ['files' => [__('messages.upload_too_large')]]], 422);
            $status = match (true) {
                $e instanceof \Illuminate\Auth\AuthenticationException => 401,
                $e instanceof \Illuminate\Auth\Access\AuthorizationException => 403,
                $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 404,
                $e instanceof HttpExceptionInterface => $e->getStatusCode(),
                default => 500,
            };
            if ($e instanceof \Illuminate\Database\QueryException && in_array($e->errorInfo[0] ?? '', ['23000', '23505'], true)) {
                $email = str_contains($e->getMessage(), 'users.email') || str_contains($e->getMessage(), 'users_email_unique');
                return response()->json(['message' => __('messages.validation'), 'errors' => $email ? ['email' => [__('validation.unique', ['attribute' => 'email'])]] : ['record' => [__('messages.record_in_use')]]], 422);
            }
            $key = match ($status) { 401 => 'unauthenticated', 403 => 'forbidden', 404 => 'not_found', 405 => 'method_not_allowed', 419 => 'csrf', 429 => 'throttled', default => 'error' };
            $message = $e instanceof HttpExceptionInterface && $status === 403 && $e->getMessage() !== '' ? $e->getMessage() : __('messages.'.$key);
            return response()->json(['message' => $message], $status, $e instanceof HttpExceptionInterface ? $e->getHeaders() : []);
        });
        $exceptions->respond(function ($response) {
            $response->headers->set('X-Content-Type-Options', 'nosniff');
            $response->headers->set('X-Frame-Options', 'DENY');
            $response->headers->set('Content-Security-Policy', "frame-ancestors 'none'");
            $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
            $response->headers->set('Cache-Control', 'no-store, private');
            return $response;
        });
    })->create();
