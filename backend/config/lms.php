<?php

return [
    'timezone' => 'Asia/Kabul', 'weeks' => 16,
    'auth_mode' => env('LMS_AUTH_MODE', 'cookie'),
    'initial_admin' => ['name' => env('LMS_ADMIN_NAME', 'University administrator'), 'email' => env('LMS_ADMIN_EMAIL'), 'password' => env('LMS_ADMIN_PASSWORD')],
    'installer_token' => env('LMS_INSTALLER_TOKEN'),
    'installed_lock' => storage_path('installed.lock'),
    'uploads' => ['max_files' => 5, 'max_bytes' => 5 * 1024 * 1024, 'extensions' => ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'zip']],
];
