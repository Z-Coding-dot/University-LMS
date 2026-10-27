# Task: Build the Laravel + MySQL backend for the University LMS

The frontend (React + TS, in `frontend/`) is finished and runs on a mock adapter. Build the REAL API in `backend/` (same repo) so the frontend works by setting `VITE_USE_MOCK=false`. Deployment target: SHARED HOSTING (cPanel-style, Apache, MySQL; SSH may not exist; no queue workers, no Redis, no Node on the server).

## 0. Sources of truth (read before coding)
1. `frontend/docs/API_CONTRACT.md` — the contract. Implement EXACTLY the listed endpoints, shapes, validation, status codes, and business rules. Do not invent endpoints from fixtures. No registration, no email recovery.
2. `frontend/src/api/mock/` and `frontend/src/api/types/` and `frontend/src/lib/grading.ts` — executable reference. Where the contract is ambiguous, mirror the mock's behavior. Record every ambiguity/deviation in `backend/docs/DECISIONS.md` (one line each).
3. Check the environment first (php, composer, mysql). If something is missing, tell me immediately; if MySQL is unavailable, use SQLite for tests only — migrations and queries must stay MySQL-compatible (no raw MySQL-only SQL).

## 1. Stack & constraints
- Laravel (newest version that runs on PHP ≥ 8.2), PHP 8.2 features OK. Packages: `laravel/sanctum` only (no Redis, Horizon, Octane, spatie permission, queues). Tests: PHPUnit (default).
- MySQL, utf8mb4, InnoDB, real foreign keys, indexes on every FK and every sortable/searchable column, unique constraints in DB (not just validation).
- No queues anywhere. Background work = Laravel scheduler driven by one cron (`* * * * * php artisan schedule:run`).
- Bcrypt hashing (Argon may be missing on shared hosts).
- Timezone: store timestamps in UTC; config `lms.timezone = Asia/Kabul` for all "today", due-date (23:59:59), semester week and session-date logic. Serialize timestamps as ISO 8601 with explicit offset (Carbon::serializeUsing), dates as `Y-m-d`.

## 2. Architecture (follow; keep controllers thin)
```
backend/
├── app/
│   ├── Enums/            # Role, UserStatus, Permission, AttendanceStatus, GradeStatus, Audience, UploadPurpose
│   ├── Models/
│   ├── Http/
│   │   ├── Controllers/Api/V1/{Auth,Profile,Settings,Catalog,Dashboard,Course,Attendance,Grade,Result,Timetable,Lecture,Assignment,Submission,Upload,File,Announcement}/ + Admin/{Student,Teacher,Structure,Offering,Enrollment,Schedule,Settings,TeacherActivity,LockedGrades}
│   │   ├── Requests/     # one FormRequest per mutation, strict payloads
│   │   ├── Resources/    # API Resources matching contract DTOs exactly
│   │   └── Middleware/   # SetLocale, EnsureActive, EnforcePasswordChange(admin only), RequireRole
│   ├── Services/
│   │   ├── Academic/     # GradingService, AttendanceService, SemesterService (current semester, week number), ScheduleConflictService, EnrollmentService, OfferingAccess (single place for "who can touch this offering")
│   │   ├── Dashboard/    # DashboardService (summary, tasks, files, work, submissions, grades)
│   │   ├── Accounts/     # AccountService (create/reset/deactivate, password generation, session/token invalidation, institutional ID)
│   │   └── Files/        # UploadService (content verification, storage, download authorization)
│   ├── Support/          # ApiResponse, ListQuery (page/per_page/sort whitelist/search), StrictPayload
│   └── Console/Commands/ # lms:install, lms:cleanup-uploads
├── config/lms.php        # timezone, weeks=16, upload limits, allowed types, auth_mode (cookie|token)
├── database/{migrations,seeders}/   # ProductionSeeder (settings + admin), DemoSeeder (port frontend mock fixtures; refuse to run when APP_ENV=production)
├── lang/{fa,en}/         # validation + all API messages, both languages
├── routes/api.php        # /api/v1 prefix; routes/web.php: SPA fallback only
├── tests/
└── docs/{DECISIONS.md,DEPLOY.md}
```
All dashboard/results/course-detail numbers (totals, averages, attendance %, letters) MUST come from the shared Academic services — never recomputed ad hoc in controllers — so figures cannot diverge.

## 3. Cross-cutting rules
- Responses: `{ data }`; lists `{ data, meta: { current_page, per_page, total, last_page } }` (build a custom helper, not Laravel's default paginator JSON); 204 for logout/csrf. `page` ≥1, `per_page` 1–100, `search` ≤200 chars, `sort` comma-separated with `-` prefix against a per-endpoint whitelist; unknown sort field → 422 on `sort`. Implement once in `ListQuery`.
- Errors always JSON: 401/403/404 `{ message }`, 422 `{ message, errors: { field: string[] } }`. Force JSON for every `/api` and `/sanctum` request regardless of Accept header. Never leak stack traces.
- Locale: `Accept-Language` `fa-AF|fa` → `fa`, `en` → `en`; all validation/error messages in lang files for both. LocalizedName columns are `name_fa`/`name_en`, output as `{fa,en}`; list search/sort by localized name uses the request locale. User-authored text (announcements, titles, feedback) is returned as entered, never translated.
- Payloads are STRICT: reject unknown keys with 422 (base `StrictFormRequest`). Exceptions required by the contract: student/teacher `PATCH /profile` containing name/email/password fields → 403 (decide in `authorize()`); student/teacher `PUT /profile/password` → 403 before any validation.
- Authorization order for admin routes: role check BEFORE record lookup and validation (use plain `{id}` + manual lookup, or middleware priority above SubstituteBindings) so non-admins get 403, never 404/422 leaks.
- EnsureActive middleware on every protected route: inactive → 403 and session/tokens invalidated. EnforcePasswordChange applies to ADMINS only (students/teachers are never forced); while the flag is set, only `GET /auth/me`, `POST /auth/logout`, `PUT /profile/password` work, everything else 403.
- Login: email only, trimmed, case-insensitive; normalize Persian/Arabic digits in the identifier only — NEVER touch the password. Generic credentials error on `identifier` for unknown user/wrong password; inactive → 403. Throttle 5/min per identifier+IP. Password max 128.
- Auth modes via `LMS_AUTH_MODE`: `cookie` (default; Sanctum stateful SPA, DB sessions, `/sanctum/csrf-cookie`, credentialed CORS, `SESSION_SECURE_COOKIE`, same-origin in production) and `token` (login returns `token`, bearer auth). Same endpoints either way.
- Session invalidation: password change → delete the user's other sessions (and tokens); admin password reset and deactivation → delete all sessions and tokens of the target.
- Passwords: generate unique cryptographically random passwords (`random_int`/`Str::random` w/ CSPRNG, ≥12 chars, mixed classes); return plaintext ONLY in the create/reset response; never log it, never store plaintext, never include in User resources. Hash/password/remember_token are `$hidden`.
- Permissions: 7 teacher grants (`attendance.take, grades.enter, grades.publish, assignments.manage, materials.manage, announcements.post, timetable.view`) in table `user_permissions`; reject `grades.unlock`, unknown, duplicates; PUT replaces the full set. Admin has all implicitly EXCEPT `attendance.take` (admin attendance mutation → 403). Ownership is separate from grants: teachers only touch their assigned offerings; students only their own enrollments/submissions. Centralize in `OfferingAccess`; every offering/assignment/lecture/submission/file route goes through it. 404 for missing, 403 for unauthorized.
- Draft grades must NEVER reach a student through any path (direct, nested, aggregate, dashboard, results, grade-breakdown). Add a dedicated test.
- Multi-row writes (enrollment, schedule, grade batches, attendance upsert, component replacement) run in DB transactions; enrollment/capacity checks use `lockForUpdate` on the offering.
- Deletions: enforce the "record in use" 422 rules from the contract transactionally.
- Grade status lives on the offering; entries expose that status. Allowed transitions: draft→published, published→locked (need `grades.publish` or admin), locked→published (admin only). Others → 422. Publishing requires a score for every enrolled student × component and weights = 100. Component changes only in draft; follow the contract's component-ID rules (no ID reuse, unique IDs, reduced max below retained score → 422).
- Institutional IDs: `ST-`, `TC-` (and `AD-` for admins) with unique increasing numbers, allocated inside a transaction.
- Semester week: week 1 starts on semester `starts_at` (Asia/Kabul), +1 per 7 days, capped at 16, null outside semester. "Current semester" for staff: the semester containing today (Kabul), else the latest started, else null — and document it.
- Settings: single validated record (pass mark, letter scale covering 0–100 with no gaps/overlaps, counted statuses, threshold, weekend days). Seed defaults from the frontend mock fixtures (pass mark 55, threshold 75, counted present/late/excused, weekend [5]).

## 4. Files & uploads (shared-hosting safe)
- `POST /uploads`: ≤5 files, each non-empty ≤5 MiB; allowed: pdf, doc/docx, ppt/pptx, xls/xlsx, jpg/jpeg, png, zip. Verify by CONTENT (finfo) and extension allowlist; store with random names in `storage/app/private/uploads/` (never web-accessible); record uploader, offering, purpose, original name, size, mime. Purpose rules per the contract (student→submission only, staff→assignment needs `assignments.manage`, lecture needs `materials.manage`, plus offering access). Never extract archives.
- Download route (missing from the contract, add it): `GET /api/v1/files/{id}` — `Attachment.url` points here. Authorize: uploader; enrolled student / assigned teacher / admin for lecture and assignment-instruction files of that offering; for submission files only the submitting student, the offering's teacher with `assignments.manage`, or admin. Unattached uploads: uploader only. Send `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.
- Attachment reuse rules (uploader/offering/purpose match, ≤5 per item) per the contract. Scheduled `lms:cleanup-uploads` deletes unattached uploads older than 24 h.
- Note in DEPLOY.md that shared hosts often cap `upload_max_filesize`/`post_max_size` at 2 MB; provide a `.user.ini`/`.htaccess` snippet raising them to ≥ 30 MB and a clear 422 message when exceeded.

## 5. Shared-hosting deployment
Deliver `docs/DEPLOY.md` (short, step-by-step) and the code to support:
- Layout: frontend `dist` is copied into `backend/public` (the frontend already has `build:deploy`). `routes/web.php`: `Route::fallback` returns `public/index.html` for non-`/api`, non-`/sanctum` GET requests (SPA routing); `index.html` sent with no-cache; hashed assets long-cache via `.htaccess`.
- Two documented layouts: (A) document root can point to `public/`; (B) cannot → Laravel app outside `public_html`, contents of `public/` inside it with adjusted `index.php` paths. Include the exact `.htaccess` rules.
- Build locally, upload finished artifacts: `composer install --no-dev --optimize-autoloader` locally and upload `vendor/`; don't commit/upload locally-cached config/route files (absolute paths break).
- `.env.example` fully documented: APP_KEY (generate locally with `key:generate --show`), APP_URL, DB, SESSION_DRIVER=database, SESSION_DOMAIN, SESSION_SECURE_COOKIE=true, SANCTUM_STATEFUL_DOMAINS, LMS_AUTH_MODE, initial admin email/password, installer token. APP_DEBUG=false in production.
- Install without SSH: `php artisan lms:install` (migrate --force, ProductionSeeder, creates the first admin with `must_change_password=true`) AND, as a fallback, a one-time web installer at `/install/{token}` enabled only when `LMS_INSTALLER_TOKEN` is set and `storage/installed.lock` doesn't exist; it runs the same steps, writes the lock, and returns 404 afterwards. DEPLOY.md tells me to remove the token after use.
- Cron line for the scheduler; permissions for `storage/` and `bootstrap/cache`.

## 6. Security checklist (implement, don't just mention)
Mass-assignment protection (explicit `$fillable`), no password material in any response/log, login throttling, strict payloads, authorization centralized and tested, upload content verification, private file storage, session/token invalidation rules above, security headers on SPA responses (X-Content-Type-Options, X-Frame-Options/frame-ancestors, Referrer-Policy), `APP_DEBUG=false`, query builder bindings only (no raw interpolation), ORDER BY only from whitelists.

## 7. Tests (focused, not exhaustive)
Write compact PHPUnit tests ONLY for: (a) auth + forced admin password change + inactive accounts; (b) an authorization matrix across roles on one representative endpoint per resource (including teacher-vs-other-teacher offering and student-vs-other-student IDOR); (c) draft-grade invisibility to students; (d) pure calculation tests for grading/attendance/semester-week/letter-scale per the contract formulas; (e) list helper (pagination meta, sort whitelist → 422); (f) upload authorization. Use SQLite in-memory + factories. Run the suite once per phase, not repeatedly.

## 8. TOKEN & TIME BUDGET (strict)
No browser, no screenshots, no load testing. Don't re-read large files you just wrote; don't rewrite files for small edits; don't hand-write huge seed data (port frontend mock fixtures compactly). Use `php -l`, `php artisan route:list` (once per phase, filtered) and the focused tests as verification. Phase reports ≤ 5 lines.

## 9. Phases
0. Foundation: scaffold `backend/`, config, enums, ALL migrations + models + factories, support classes (ApiResponse, ListQuery, StrictFormRequest), locale/error handling, auth (cookie + token), middleware, `/auth/*`, `/profile*`, `/settings`, `/catalog`, `/admin/students`, `/admin/teachers` (+ reset/status/academic-profile/permissions), `lms:install` + installer, ProductionSeeder. STOP and give me exact run steps to log in from the frontend with `VITE_USE_MOCK=false`.
1. Admin academic: `/admin/catalog`, `/admin/structure/{resource}`, `/admin/offerings` (+candidates, enrollments, schedule), `PUT /admin/settings`, `/admin/teacher-activity`, `/admin/locked-grades`.
2. Course core: `/courses`, `/courses/{id}`, weeks, roster, attendance (+history), grades, grade-components, grade-status, grade-breakdown, `/results`, `/results/courses`, `/timetable`.
3. Content: lectures, assignments, submissions (+grading), uploads, file download, announcements.
4. Dashboard: all `/dashboard*` endpoints exactly per the contract.
5. Hardening: tests from §7, DemoSeeder, `DEPLOY.md`, `DECISIONS.md`, `.env.example`, final `route:list` check that every contract endpoint exists with the right method/middleware.
Proceed through phases 1–5 without waiting unless blocked. Ask me only if blocked; otherwise decide and log it in DECISIONS.md.