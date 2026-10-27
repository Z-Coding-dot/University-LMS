# University LMS backend

Laravel 12 / PHP 8.2+, Sanctum, MySQL and PHPUnit. No queues, Redis, backend Node build, registration or email recovery.

The API implements authentication, accounts, academic administration, courses, attendance, grading, results, timetables, weekly content, private files, announcements and role-scoped dashboards. Both cookie and bearer-token modes use the same endpoints. The shared academic services supply authoritative calculations; students never receive draft component scores or feedback.

## Local setup on this Windows machine

1. Start **MySQL** in XAMPP. Create the database in phpMyAdmin or PowerShell (add `-p` if root has a password):

   ```powershell
   & C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE university_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. From the repository root:

   ```powershell
   cd backend
   composer install
   Copy-Item .env.example .env
   php artisan key:generate
   ```

3. Edit `backend/.env`, retaining the generated `APP_KEY`. Set these local values, substituting your own email/password and actual database credentials:

   ```dotenv
   APP_ENV=local
   APP_URL=http://localhost:8000
   APP_DEBUG=false
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=university_lms
   DB_USERNAME=root
   DB_PASSWORD=
   SESSION_DRIVER=database
   SESSION_SECURE_COOKIE=false
   SESSION_DOMAIN=null
   LMS_AUTH_MODE=cookie
   SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   LMS_ADMIN_EMAIL="<your administrator email>"
   LMS_ADMIN_PASSWORD="<your unique password, 12–128 characters, with upper/lowercase, digits and symbols>"
   LMS_INSTALLER_TOKEN=
   ```

   The values in angle brackets are placeholders. Do not commit `.env`. Keep `SESSION_SECURE_COOKIE=true` on production HTTPS.

4. Install and start the API:

   ```powershell
   php artisan lms:install
   php artisan serve --host=localhost --port=8000
   ```

   Installation creates all tables, default grading settings and the first administrator (`AD-001`) with a mandatory first password change. Re-running the installer does not change existing credentials. Keep this terminal running.

5. In another terminal, from the repository root, create `frontend/.env` from `frontend/.env.example` if needed, then set:

   ```dotenv
   VITE_USE_MOCK=false
   VITE_AUTH_MODE=cookie
   VITE_API_URL=
   ```

   Start Vite:

   ```powershell
   cd frontend
   npm.cmd run dev -- --host localhost --port 5173 --strictPort
   ```

6. Open `http://localhost:5173`. Sign in with your configured administrator email/password and complete the required password change. Create the academic structure, teacher accounts, offerings and student accounts; assign teacher permissions, schedules and enrollment. Newly created accounts have no academic records until you assign them. Use the same hostname (`localhost`) throughout; do not mix it with `127.0.0.1` for cookies.

If a previous demo login is still active, sign out or use a new browser session before testing the real API. Restart Vite after changing its environment file. Backend env changes take effect on fresh requests unless config was cached; locally use `php artisan config:clear` when necessary.

## Token mode

Set backend `LMS_AUTH_MODE=token` and frontend `VITE_AUTH_MODE=token`, then restart both servers. Login returns `data.token`; subsequent requests use `Authorization: Bearer <token>`. Token mode requires no CSRF cookie. The same account/authorization rules apply in either mode.

## Checks

```powershell
cd backend
php vendor/phpunit/phpunit/phpunit
php scripts/audit-contract.php
php artisan route:list --path=api/v1 -vv
```

PHPUnit uses SQLite in-memory with real foreign keys and a test-only app key; it never changes the MySQL database. MySQL must be running to install/use the real API. Deployment and decisions: [DEPLOY.md](docs/DEPLOY.md), [DECISIONS.md](docs/DECISIONS.md).

## Optional development demo

Use a **separate, empty MySQL development database**, set `APP_ENV=local` and its connection in `.env`, then run `php artisan migrate` and `php artisan db:seed --class=DemoSeeder`. Do this instead of `lms:install` for that database. DemoSeeder refuses production and databases containing accounts or academic structure; it does not overwrite an installed administrator.

The demo ports the frontend fixtures: 1 admin, 3 teachers, 25 students, two semesters, six offerings, attendance, draft/published/locked grades, weekly content and private study packs. Admin: `admin@campus.test` / `Campus123!`; teacher: `teacher1@campus.test` / `Campus123!`; student: `student1@campus.test` / `Student001!Campus`. Other student passwords use their three-digit institutional suffix. The last student is inactive. These credentials are development-only. Fixture dates are fixed in 2026; current-semester selection follows the documented Kabul-date rule.

Regenerate the checked-in fixture snapshot after intentional frontend fixture changes with `node scripts/export-backend-demo.mjs` from `frontend/` (requires its local dev dependencies). No Node is needed on the server. Seed translations are stored separately; editing content clears them so user-authored text is always returned verbatim.

Run `php artisan migrate --force` after uploading an update to an existing installation. Keep its environment, storage files and installation lock. Private upload cleanup runs hourly through the one-minute scheduler cron; it can also be invoked with `php artisan lms:cleanup-uploads`.
