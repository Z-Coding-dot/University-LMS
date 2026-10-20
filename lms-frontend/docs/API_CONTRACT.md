# University LMS API contract

Implemented frontend calls are listed below. Role-specific dashboards and
administrator-managed student provisioning are implemented. Academic CRUD endpoints
will be specified when their full feature screens are built.
Do not infer implemented endpoints from the fixture inventory.

## Transport and authentication

- API origin: `VITE_API_URL` (default `http://localhost:8000`); REST prefix `/api/v1`.
- JSON requests; `Accept: application/json`; `Accept-Language: fa-AF | en`.
- Success: `{ "data": T }`; logout/CSRF return 204 with no body.
- Lists: `{ data: T[], meta: { current_page, per_page, total, last_page } }`.
  Query: `page` (1-based), `per_page`, `sort` (comma-separated field names;
  prefix `-` for descending), `search`, and resource-specific filters.
  Mobile requests 10 rows per page and appends pages; desktop requests 20.
- All IDs are numeric. Dates are Gregorian `YYYY-MM-DD`; timestamps are Gregorian
  ISO 8601 with an explicit timezone. Solar Hijri is a display concern only.
- 401: unauthenticated/expired session (frontend clears session and query cache).
  403: forbidden/inactive account/password change required. 404: missing resource.
- 422: `{ message: string, errors: { [field: string]: string[] } }`.
  Backend messages must use the requested language. Mock messages use translation
  keys, resolved by the same client; the envelope and field paths are identical.
- `VITE_AUTH_MODE=cookie` (default): Sanctum stateful SPA cookies, Axios
  `withCredentials` and `withXSRFToken`. Before login the client requests
  `GET {origin}/sanctum/csrf-cookie` (outside `/api/v1`). Configure Sanctum stateful
  domains, credentialed CORS, session cookie domains and CSRF on the backend.
- `VITE_AUTH_MODE=token`: login returns `token`; later requests send
  `Authorization: Bearer <token>`. The frontend stores it in sessionStorage.
- The server must enforce role/permission checks and, for teachers/admins,
  `must_change_password` on every protected endpoint. Students use university-issued
  passwords directly; their flag must be false. Frontend guards are presentation only.

## Implemented endpoints

| Method | Path (under `/api/v1`) | Access | Request | Response `data` |
|---|---|---|---|---|
| POST | `/auth/login` | Public | `{ identifier, password }` | `{ user: User, token?: string }` (token mode only) |
| GET | `/auth/me` | Any authenticated account, including forced password change | — | `User` |
| POST | `/auth/logout` | Any authenticated account, including forced password change | — | 204 |
| PATCH | `/profile` | Students: locale only. Teachers/admins: optional name and locale, after required password change | `{ locale, name?: string }` | Updated `User` |
| PUT | `/profile/password` | Teachers/admins only, including forced password change; students receive 403 | `{ current_password, password, password_confirmation }` | Updated `User` with `must_change_password: false` |
| GET | `/profile/context` | Any authenticated account after password change | — | `{ department: Department \| null, semester: Semester \| null }` for current user |
| GET | `/settings` | Any authenticated account after password change | — | `AcademicSettings` (read-only foundational client; no screen yet) |
| GET | `/admin/students` | Admin only | Query: page, per_page, search, sort | Paginated `User[]`, student role only |
| POST | `/admin/students` | Admin only | `{ name, email, locale }` | `{ user: User, initial_password: string }` (201) |
| PATCH | `/admin/students/{id}` | Admin only, target must be a student | `{ name, email }` | Updated `User` |
| POST | `/admin/students/{id}/reset-password` | Admin only, target must be a student | — | `{ user: User, initial_password: string }` |
| GET | `/dashboard` | Any authenticated account, scoped by role and ownership | Query: offering_id?, search? | `DashboardSummary` (below) |
| GET | `/dashboard/tasks` | Same scope as dashboard | Query: offering_id?, search?, page, per_page, sort | Paginated `DashboardTask[]` |
| GET | `/dashboard/files` | Same scope as dashboard | Query: offering_id?, search?, page, per_page, sort | Paginated `DashboardFile[]` |

Student and dashboard lists accept pagination/search/sort. Their `page` is an integer >=1,
`per_page` an integer 1–100. For `/admin/students`, `sort` uses `name`, `email`, or
`id`, comma-separated with optional `-` descending prefixes, and search matches
name/email/institutional ID. Dashboard sort/search fields are specified below.
No password, password hash, or reset secret appears in a User response. Password change
must verify the old password, hash the new one, and invalidate other sessions.
There is no registration or email recovery endpoint; an admin resets passwords.

### Validation

- Identifier: required valid email, trimmed and matched without case sensitivity.
  Normalize Persian/Arabic identifier digits to Latin. Return a
  generic credentials error on `identifier` for unknown users/wrong passwords.
- Passwords are opaque strings: **never normalize their digits or whitespace**.
- Login password: required, at most 128 characters. Inactive accounts return 403.
- Profile name: optional, trimmed, 2–100 characters for teachers/admins;
  locale: `fa | en` is required for all roles. Reject student requests containing
  name/email with 403, even when values are unchanged. Reject student password
  mutations with 403 before validating their current password. Email, role,
  permissions and university profile fields cannot change through `/profile`.
- Admin student identity: name 2–100 characters, email valid and <=254 characters,
  trimmed/lowercased and unique across all users (422 `email` on conflict).
  Creation requires locale; role is fixed to student, status active, permissions
  empty, `must_change_password` false. Server assigns a unique institutional ID;
  department/current semester start null for subsequent academic enrollment.
- Generate a unique cryptographically random password on creation/reset; store only
  a hash on the real server. Return the plaintext once in that response, never in
  user/list responses, logs, or storage. Administrator copies it for direct handover
  to the student. No email is sent by this frontend. Reset invalidates old passwords
  and existing student sessions on the real server. Names/email/passwords are under
  administrator control; students may only update their own language preference.
- New password: 8–128 characters, must differ from current password; confirmation
  must match. Wrong current password returns a 422 `current_password` error.
- Teacher/admin first login: only me, logout and password change are allowed until
  the flag is cleared. Students never enter this self-service flow; the university
  gives each student their email and unique password, ready to use for login.

## Entity inventory

Canonical TypeScript definitions: `src/api/types/index.ts`. `LocalizedName` is
`{ fa: string, en: string }`. `Role` is `admin | teacher | student`.

| Entity | Fields |
|---|---|
| User | id, name, email, role, permissions: string[], locale: fa/en, must_change_password: boolean, status: active/inactive, profile: { institutional_id: string, department_id: number/null, current_semester_id: number/null } |
| Faculty | id, name: LocalizedName |
| Department | id, faculty_id, name: LocalizedName |
| AcademicYear | id, name: string, starts_at: date, ends_at: date |
| Semester | id, academic_year_id, name: LocalizedName, starts_at: date, ends_at: date |
| Course | id, code, name: LocalizedName, credits: number, department_id |
| CourseOffering | id, course_id, semester_id, teacher_id, capacity, schedule: TimetableSlot[] |
| TimetableSlot | id, offering_id, weekday: ISO 1–7 (Monday–Sunday), start: HH:mm, end: HH:mm, room |
| Enrollment | id, student_id, offering_id |
| GradeComponent | id, offering_id, name: LocalizedName, max_score, weight |
| GradeEntry | id, student_id, component_id, score, feedback: string/null, status: draft/published/locked, updated_at: timestamp |
| AttendanceSession | id, offering_id, date |
| AttendanceRecord | id, session_id, student_id, status: present/absent/late/excused |
| Assignment | id, offering_id, title, description, due_at: timestamp, attachments: Attachment[] |
| Attachment | id, name, url, size: bytes, mime_type, created_at: timestamp |
| Submission | id, assignment_id, student_id, files: Attachment[], submitted_at: timestamp, score: number/null, feedback: string/null |
| Announcement | id, title, body, audience: all/role/offering, role: Role/null, offering_id: number/null, author_id, created_at: timestamp |
| AcademicSettings | pass_mark, letter_scale: { min, max, letter }[], attendance_counted_statuses: AttendanceStatus[], attendance_warning_threshold, weekend_days: ISO weekday[] |

## Dashboard response and visibility

Canonical DTOs: `src/api/types/dashboard.ts`. Dashboard dates use the configured
university timezone (Asia/Kabul); timetable HH:mm values are university local time.

`DashboardSummary` fields:

- `role`, `as_of` (Gregorian date), `semester: Semester | null`.
- `metrics: { key: average/attendance/courses/students/teachers/reviews,
  value: number | null, percent?: boolean }[]`.
- `courses: { id: offering ID, code, name: LocalizedName, credits, teacher: name,
  attendance_percent: number | null, sessions, students }[]`.
- `today: { id: slot ID, offering_id, course: LocalizedName, start, end, room,
  teacher: name }[]`, ordered by start time for `as_of`.
- `latest_grades: { id, offering_id, student_name, course: LocalizedName,
  component: LocalizedName, score, max_score, feedback, status, updated_at }[]`,
  newest first, at most 5. Only published/locked scores are included for every role.
- `announcements: (Announcement & { author_name })[]`, newest first, at most 10.
- `attendance_series: { label: localized date, attendance: percentage }[]`, up to
  6 recorded class days. Dates must be formatted consistently with the display locale.

`DashboardTask`: id, offering_id, localized title/description, course: LocalizedName,
due_at, submission_rate (0–100), status, score: number/null, feedback: string/null.
Student status: pending/submitted/graded/overdue, determined from the student's own
submission and deadline. Staff status: pending/review/complete, based on received
submissions. Student score/feedback describe their own submission only; staff
dashboard task responses leave these null. Submission rate is the received count
divided by enrolled students. Task sort fields: title, due_at, course, status,
submission_rate; default due_at ascending.

`DashboardFile`: Attachment plus offering_id, course: LocalizedName, uploaded_at
(equal to attachment created_at). Sort fields: name, course, uploaded_at; default
uploaded_at descending. Authenticated file downloads must repeat ownership checks
on the real backend. Public `/files/*.zip` URLs are demo study packs only.

Both list endpoints accept 1-based page, per_page (1–100), comma-separated sort
fields with `-` descending prefixes, search (max 200 characters), and optional
positive integer offering_id. Search matches localized task title/description or
file name and course. Other list filters are unsupported.

- Students receive only offerings enrolled in their assigned current semester;
  no semester/enrollment yields empty panels, null averages and zero course counts.
  Teachers receive only assigned offerings in the current academic semester.
  Admins receive all offerings in that semester. An offering_id outside that scope
  returns 403 on every dashboard endpoint.
- Course rings represent recorded attendance, not estimated syllabus completion.
  Counted statuses come from settings; no recorded attendance yields null.
- Student course averages require every grade component to be published/locked.
  An incomplete/draft component yields no course total, never a partial or zero
  failing score. Dashboard average weights only completed published course totals
  by credits. Draft scores and feedback must never reach students.
- Teacher grade panels require grades.enter or grades.publish; otherwise the
  server returns no grade rows and the UI hides the panel/navigation entry.
  Pending-review metrics require assignments.manage. No dashboard actions grant
  permissions to edit grades, submissions, enrollment, or student credentials.
- Announcements must match all, the user's role, or a scoped offering. Admins may
  inspect all audiences. Announcement responses localize text to Accept-Language.
- Search and offering filters affect task/file lists, today's classes, grades and
  announcements. Course selectors and summary metrics retain the full authorized
  semester scope. Metrics are university counts for admins, assigned student/course
  counts for teachers, and personal attendance/results for students.
- Mock summary calculations use shared pure helpers. The Laravel server must
  calculate and return these values authoritatively using the same business rules.

## Academic rules for subsequent phases

- Single institution; no payments. Admin creates/deactivates users, resets
  passwords, manages academic structure/offerings/enrollment and teacher grants.
- Permission strings: `attendance.take`, `grades.enter`, `grades.publish`,
  `assignments.manage`, `announcements.post`, `timetable.view`. Teacher grants are
  explicit; admins have all implicitly. `grades.unlock` is admin-only even if
  another role's permissions array mistakenly includes it. Student access uses
  enrollment ownership, never teacher permission grants.
- Grade component maximum > 0; score in [0, maximum]; weights in [0, 100], per
  offering sum to 100 (floating point tolerance 0.000001 in frontend previews).
- Course total = sum(score / maximum × weight), unrounded until display.
  Pass mark is configurable (seed 55). Letter ranges use inclusive `min`, exclusive
  `max`, except the range ending at 100 also includes 100. Scales must cover 0–100
  without overlaps/gaps. The server must validate settings before accepting them.
- Semester average = sum(total × credits) / sum(credits), credits > 0.
  Cumulative average weights every course across semesters by credits, not by
  semester averages. No 4.0 GPA. No results -> null; no published scores must not
  be represented as a failing grade.
- Attendance = counted records / all sessions × 100; seed counted statuses are
  present, late, excused; configurable threshold (seed 75). No sessions -> null.
  ISO weekday 5 (Friday) is the default weekend. Dari weeks begin Saturday.
- Lifecycle: draft -> published -> locked. Publishing/locking requires admin or
  `grades.publish`; unlocking locked -> published is admin-only. Editing locked
  entries is forbidden until unlocked. Students never receive draft grades;
  filter them on the server, including aggregates and nested relations.
- Enrollment must be unique per student/offering and respect capacity. Teachers
  act only on their assigned offerings; students act only on their own enrollment
  and submissions. Server validates all relationships and schedule dates/times.
- The server is authoritative for calculations, visibility, permissions, score
  validation, attachment validation and lifecycle changes. Client calculations
  in `src/lib/grading.ts` are display previews, not trusted academic results.

## Mock behavior

`VITE_USE_MOCK=true` replaces only the Axios adapter, preserving endpoint calls and
response shapes. Default is mock when unset. All mutations validate and use current
session identity; unsupported routes return 404. Student-account management exists;
dashboard read endpoints exist; academic CRUD routes do not exist yet.
Fixtures contain 1 admin, 3 teachers, 25 students, 1 faculty/department/year,
2 semesters, 6 courses/offerings, enrollment, mixed draft/published/locked grades,
attendance, assignments, one submission, three announcements and six downloadable
study-pack ZIP archives. Admin/teacher demo
password is `Campus123!`. Students have distinct demo passwords (`Student001!Campus`
for `student1@campus.test`, `Student024!Campus` for `student24@campus.test`, etc.).
Login uses email; institutional IDs are read-only record identifiers.
`teacher3@campus.test` requires password change; student accounts do not.
`student25@campus.test` is inactive. Session identity survives refresh in
sessionStorage; profile/password mutations and academic fixtures reset on reload.
This is deliberate demo behavior, not a persistence guarantee for the real API.
