<?php
// Read-only route and middleware audit; no database connection is needed.
require dirname(__DIR__).'/vendor/autoload.php';
$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$contract = file_get_contents(dirname(__DIR__, 2).'/frontend/docs/API_CONTRACT.md');
preg_match_all('/^\| (GET|POST|PUT|PATCH|DELETE) \| `([^`]+)`/m', $contract, $matches, PREG_SET_ORDER);
$failures = []; $count = 0;
foreach ($matches as $entry) {
    [$all, $method, $path] = $entry;
    $path = str_replace(['{resource}', '{id}', '{lectureId}'], ['faculties', '1', '1'], $path);
    try {
        $route = $app['router']->getRoutes()->match(\Illuminate\Http\Request::create('/api/v1'.$path, $method));
        $middleware = $route->gatherMiddleware();
        if ($path !== '/auth/login') foreach (['auth:sanctum', 'active', 'password.changed'] as $required) if (!in_array($required, $middleware, true)) $failures[] = $method.' '.$path.' missing '.$required;
        if (str_starts_with($path, '/admin/') && !in_array('role:admin', $middleware, true)) $failures[] = $method.' '.$path.' missing admin role';
        $count++;
    } catch (\Throwable $e) { $failures[] = $method.' '.$path.' not routed'; }
}
if (!$count) $failures[] = 'No contract endpoints were found';
foreach ($failures as $failure) fwrite(STDERR, $failure.PHP_EOL);
echo $count.' contract method/path pairs checked; '.count($failures).' failures.'.PHP_EOL;
exit($failures ? 1 : 0);
