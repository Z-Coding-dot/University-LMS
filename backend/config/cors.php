<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'], 'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Accept-Language', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With', 'X-XSRF-TOKEN'],
    'exposed_headers' => ['Retry-After'], 'max_age' => 600, 'supports_credentials' => true,
];
