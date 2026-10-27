# Shared-hosting deployment

The API includes the complete academic workspace, private uploads and role-scoped dashboards. Build assets locally and deploy the finished PHP application and frontend together.

1. Check PHP 8.2+ with PDO MySQL, mbstring, fileinfo, OpenSSL, XML/DOM, ctype and curl; enable Apache mod_rewrite. Create a MySQL database/user with schema and data permissions, utf8mb4 and InnoDB. No server Node, Redis, workers or SSH are required.
2. Build locally: `composer install --no-dev --optimize-autoloader` in `backend/`; `npm.cmd run build:deploy` in `frontend/` copies its built `dist` into `backend/public`. Keep the frontend's production `VITE_USE_MOCK=false`, `VITE_AUTH_MODE=cookie`, and empty `VITE_API_URL` for same-origin hosting. For local development afterward restore dev packages with `composer install`.
3. Upload the application and `vendor/`, excluding `.env`, tests, local databases/logs, local `storage/installed.lock*` files, development scripts and all locally generated `bootstrap/cache/*.php` files. Keep `bootstrap/cache/.gitignore` and writable directories. Never upload a Windows-generated config/route cache or overwrite a production installation lock. Create the server `.env` from `.env.example`, set production HTTPS origin and DB credentials, and keep `APP_DEBUG=false`.
4. Generate the encryption key locally with `php artisan key:generate --show` and put it into the server `APP_KEY`; never publish it. Set a unique `LMS_ADMIN_EMAIL` and mixed `LMS_ADMIN_PASSWORD` of 12–128 characters. Use `SESSION_DRIVER=database`, `SESSION_ENCRYPT=true`, `SESSION_SECURE_COOKIE=true`, host-only `SESSION_DOMAIN=null`, the real hostname in `SANCTUM_STATEFUL_DOMAINS` (no scheme), and exact HTTPS origin in `CORS_ALLOWED_ORIGINS`.
5. Choose one layout below, give the PHP user write access to `storage/` and `bootstrap/cache/` (usually 755/775 directories depending on host; never blanket 777), then install once.
6. With terminal access, run `php artisan lms:install`. Without SSH, put a cryptographically random token of at least 32 characters in `LMS_INSTALLER_TOKEN` and visit `https://your-host/install/TOKEN` once over HTTPS. Both paths migrate, seed settings/admin and create `storage/installed.lock`. Subsequent web calls return 404. Remove `LMS_INSTALLER_TOKEN` immediately and remove `LMS_ADMIN_PASSWORD` after installation; never delete the installation lock to reset credentials. Set local env values before building any server-side config cache.
7. Log in using the configured admin email, change the initial password, then configure academic structure, teachers, grants, offerings, schedules, students and enrollment. Never share that first password. ProductionSeeder is idempotent and will not overwrite a pre-existing admin. Never run DemoSeeder on a production database; it is disabled in production.
8. Configure the host's cron once per minute (replace the PHP binary and absolute application directory): `* * * * * /usr/local/bin/php /home/ACCOUNT/lms/artisan schedule:run >> /dev/null 2>&1`. This runs hourly cleanup of unattached uploads older than 24 hours. No worker process is used.

For updates, preserve the production `.env`, private `storage/` contents and installed lock; upload new application/vendor/frontend files, and run `php artisan migrate --force` through a terminal or the host's one-time cron facility. The one-time installer intentionally stays disabled after installation. Back up the database and private storage together. Verify locally with `php vendor/phpunit/phpunit/phpunit` and `php scripts/audit-contract.php` before deployment.

## A. Document root can point to public/

Store the Laravel application at `/home/ACCOUNT/lms`, and set the domain's document root to `/home/ACCOUNT/lms/public`. Deploy the checked-in `public/index.php`, `public/.htaccess` and `public/.user.ini` together with the built frontend. `DirectoryIndex index.php` makes the root go through Laravel; its SPA fallback sends `index.html` without caching. Apache serves hashed assets with long caching.

## B. Document root must remain public_html/

Store the Laravel application **outside** the public directory at `/home/ACCOUNT/lms`. Copy the **contents** of its `public/`, including hidden files, into `/home/ACCOUNT/public_html`. Use this `public_html/index.php` (only the absolute application path should change):

```php
<?php
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
define('LARAVEL_START', microtime(true));
$appRoot = '/home/ACCOUNT/lms';
if (file_exists($maintenance = $appRoot.'/storage/framework/maintenance.php')) require $maintenance;
require $appRoot.'/vendor/autoload.php';
$app = require_once $appRoot.'/bootstrap/app.php';
$app->usePublicPath(__DIR__);
$app->handleRequest(Request::capture());
```

Never copy the entire Laravel project into `public_html`. `usePublicPath` ensures the SPA fallback reads the deployed `public_html/index.html`. Keep `.env` and private uploads exclusively under the application outside `public_html`.

## Exact Apache rules (both layouts)

The checked-in `public/.htaccess` supplies these rules:

```apache
DirectoryIndex index.php
<IfModule mod_negotiation.c>
    Options -MultiViews -Indexes
</IfModule>
<FilesMatch "^\.">
    Require all denied
</FilesMatch>
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set Content-Security-Policy "frame-ancestors 'none'"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    <FilesMatch "\.html$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>
    <FilesMatch "-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|png|jpe?g|svg|webp)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</IfModule>
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    RewriteCond %{HTTP:X-XSRF-TOKEN} .
    RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-TOKEN}]
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

## Upload limits

Many shared hosts default to 2 MB. The checked-in `public/.user.ini` requests:

```ini
upload_max_filesize=30M
post_max_size=32M
max_file_uploads=5
```

Set the same values in cPanel's PHP settings if `.user.ini` is ignored (changes may take several minutes). With mod_php, and only if supported by the host, equivalent `.htaccess` directives are `php_value upload_max_filesize 30M` and `php_value post_max_size 32M`; do not use these under PHP-FPM, where they can cause a 500. The API maps PHP's oversized-POST exception to localized JSON 422. Apache/proxy request limits may reject requests before PHP; adjust those through the host if necessary. Individual application files are capped at 5 MiB and each request at five files. All uploads stay in `storage/app/private/`; do not expose that directory through a symlink.
