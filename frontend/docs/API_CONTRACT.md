# University LMS API contract

Implemented frontend calls are listed below. Role-specific dashboards,
administrator-managed student/teacher accounts and the connected student/teacher
academic screens use this contract. Remaining admin academic CRUD is not implemented.
Do not infer implemented endpoints from the fixture inventory.

## Transport and authentication

- API origin: `VITE_API_URL` (empty by default, meaning same-origin); REST prefix
  `/api/v1`. Vite proxies `/api` and `/sanctum` to `http://localhost:8000` in dev.
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
- The server must enforce role/permission checks and, for administrators only,
  `must_change_password` on every protected endpoint. Students and teachers use
  university-issued passwords directly; their flag must be false. Legacy flags on
  managed accounts do not activate self-service. Frontend guards are presentation only.

## Implemented endpoints

| Method | Path (under `/api/v1`) | Access | Request | Response `data` |
|---|---|---|---|---|
| POST | `/auth/login` | Public | `{ identifier, password }` | `{ user: User, token?: string }` (token mode only) |
| GET | `/auth/me` | Any authenticated account, including forced password change | — | `User` |
| POST | `/auth/logout` | Any authenticated account, including forced password change | — | 204 |
| PATCH | `/profile` | Students/teachers: locale only. Admins: optional name and locale, after required password change | `{ locale, name?: string }` | Updated `User` |
| PUT | `/profile/password` | Admins only, including forced password change; students/teachers receive 403 | `{ current_password, password, password_confirmation }` | Updated `User` with `must_change_password: false` |
| GET | `/profile/context` | Any authenticated account after password change | — | `{ department: Department \| null, semester: Semester \| null }` for current user |
| GET | `/settings` | Any authenticated account after password change | — | `AcademicSettings` (read-only foundational client; no screen yet) |
| GET | `/admin/students` | Admin only | Query: page, per_page, search, sort | Paginated `User[]`, student role only |
| POST | `/admin/students` | Admin only | `{ name, email, locale }` | `{ user: User, initial_password: string }` (201) |
| PATCH | `/admin/students/{id}` | Admin only, target must be a student | `{ name, email }` | Updated `User` |
| POST | `/admin/students/{id}/reset-password` | Admin only, target must be a student | — | `{ user: User, initial_password: string }` |
| PATCH | `/admin/students/{id}/status` | Admin only, target must be a student | `{ status: active/inactive }` | Updated `User` |
| GET | `/admin/teachers` | Admin only | Query: page, per_page, search, sort | Paginated `User[]`, teacher role only |
| POST | `/admin/teachers` | Admin only | `{ name, email, locale }` | `{ user: User, initial_password: string }` (201) |
| PATCH | `/admin/teachers/{id}` | Admin only, target must be a teacher | `{ name, email }` | Updated `User` |
| POST | `/admin/teachers/{id}/reset-password` | Admin only, target must be a teacher | — | `{ user: User, initial_password: string }` |
| PATCH | `/admin/teachers/{id}/status` | Admin only, target must be a teacher | `{ status: active/inactive }` | Updated `User` |
| PUT | `/admin/teachers/{id}/permissions` | Admin only, target must be a teacher | `{ permissions: TeacherPermission[] }` replaces all grants | Updated `User` |
| GET | `/dashboard` | Any authenticated account, scoped by role and ownership | Query: offering_id?, search? | `DashboardSummary` (below) |
| GET | `/dashboard/tasks` | Same scope as dashboard | Query: offering_id?, search?, attention_only?, page, per_page, sort | Paginated `DashboardTask[]` |
| GET | `/dashboard/files` | Same scope as dashboard | Query: offering_id?, search?, page, per_page, sort | Paginated `DashboardFile[]` |

## Connected academic endpoints

These use the same authentication, envelopes, pagination and validation errors.
`{id}` under `/courses` is a CourseOffering ID, not a Course catalog ID.
Every offering lookup enforces student enrollment, assigned teacher ownership or
admin access. A missing offering returns 404; an unauthorized offering returns 403.
Teacher permissions never grant access to another teacher's offerings.

| Method | Path (under `/api/v1`) | Access | Request/query | Response `data` |
|---|---|---|---|---|
| GET | `/catalog` | Authenticated | None | `{ semesters, departments, faculties, academic_years, courses }` |
| GET | `/courses` | Authenticated, scoped | List params; `semester_id?` defaults to student's assigned semester or staff current semester | Paginated `CourseView[]` |
| GET | `/courses/{id}` | Scoped | None | `CourseDetail` |
| GET | `/courses/{id}/roster` | Assigned teacher/admin | List params | Paginated `User[]` for enrolled students |
| GET | `/courses/{id}/attendance-history` | Enrolled student, own records | List params | Paginated `(AttendanceRecord & { date })[]` |
| GET | `/courses/{id}/grade-breakdown` | Enrolled student, own published scores | List params | Paginated `(GradeComponent & { score: number/null, feedback: string/null })[]` |
| GET | `/courses/{id}/attendance` | Assigned teacher/admin | None | `{ students: User[], sessions: AttendanceSession[], records: AttendanceRecord[] }` |
| POST | `/courses/{id}/attendance` | Admin or assigned teacher with `attendance.take` | `{ date, records: { student_id, status }[] }` | `AttendanceSession` |
| GET | `/courses/{id}/grades` | Admin or assigned teacher with `grades.enter` or `grades.publish` | None | `{ components: GradeComponent[], entries: GradeEntry[], status }` |
| PUT | `/courses/{id}/grades` | Admin or assigned teacher with `grades.enter`; unlocked | `{ entries: { student_id, component_id, score, feedback? }[] }` | `{ status }` |
| PUT | `/courses/{id}/grade-components` | Admin or assigned teacher with `grades.enter`; draft only | `{ components: { id?, name: LocalizedName, max_score, weight }[] }` | `GradeComponent[]` |
| PUT | `/courses/{id}/grade-status` | Admin or assigned teacher with `grades.publish`; unlock admin only | `{ status: draft/published/locked }` | `{ status }` |
| GET | `/results` | Student, own enrollment across semesters | None | `{ semesters: { semester, courses: ResultCourse[], average: number/null }[], cumulative_average: number/null }` |
| GET | `/results/courses` | Student, own results | List params; `semester_id` | Paginated `ResultCourse[]` |
| GET | `/timetable` | Student/admin; teacher requires `timetable.view` | `semester_id?`, defaults as `/courses` | `{ slots: (TimetableSlot & { title, teacher? })[], weekend_days: number[] }` |
| GET | `/assignments` | Authenticated, scoped | List params; `offering_id?` | Paginated `AssignmentView[]` |
| POST | `/assignments` | Admin or assigned teacher with `assignments.manage` | `AssignmentInput` below | `Assignment` (201) |
| PATCH | `/assignments/{id}` | Same as create; offering cannot change | `AssignmentInput` | `Assignment` |
| POST | `/assignments/{id}/submissions` | Enrolled student; before deadline; ungraded | `{ file_ids: number[] }` | Own `Submission` (201); replaces existing ungraded submission |
| GET | `/assignments/{id}/submissions` | Admin or assigned teacher with `assignments.manage` | List params | Paginated `(Submission & { student_name })[]` |
| PATCH | `/submissions/{id}` | Admin or assigned teacher with `assignments.manage` | `{ score, feedback }` | `Submission` |
| POST | `/uploads` | Student for submission; admin/assigned teacher with `assignments.manage` for assignment | Multipart: `offering_id`, `purpose: submission/assignment`, repeated `files` | `Attachment[]` (201) |
| GET | `/announcements` | Authenticated, audience/ownership scoped | List params; `offering_id?` | Paginated `(Announcement & { author_name })[]` |
| POST | `/announcements` | Admin or teacher with `announcements.post` | `{ title, body, audience, role?, offering_id? }` | `Announcement` (201) |
| PATCH | `/announcements/{id}` | Admin or original teacher author with permission and offering access | Same as create | `Announcement` |

### Academic DTOs and validation

Canonical definitions are in `src/api/types/academic.ts` and `src/api/types/index.ts`.

- `CourseView` extends CourseOffering with `course: Course`, `semester: Semester`,
  `teacher: { id, name }`, `student_count`, `grade_status`.
- `CourseDetail` adds `components`, `grades`, `attendance_sessions`,
  `attendance_records`, `attendance_percent: number/null`, `settings`.
  Student scores/feedback/attendance records are their own; draft grades are
  omitted. Grade breakdown returns null score/feedback for unpublished components.
- `ResultCourse`: `{ id: offering ID, code, name: LocalizedName, credits,
  total: number/null, letter: string/null, status }`. Totals/averages exclude
  incomplete or unpublished results; cumulative averages are credit-weighted.
- `AssignmentView` extends Assignment with `course_name: LocalizedName`,
  `submission: Submission/null` (current student only; staff receive null), and
  `submission_count`. `AssignmentInput` is `{ offering_id, title, description,
  due_date: YYYY-MM-DD, attachment_ids: number[] }`. `due_date` becomes 23:59:59
  Asia/Kabul on the server and is returned as ISO `due_at`.
- Sort/search columns: courses `name, code, credits, teacher`; roster
  `name, email, institutional_id`; history `date, status`; breakdown
  `name, weight, score`; results `name, code, credits, total`; assignments
  `title, due_at, course`; submissions `student_name, submitted_at, score`;
  announcements `title, created_at, author_name`. Unknown sort fields return 422.
- Attendance requires non-empty records, unique enrolled student IDs, a valid
  Gregorian date no later than today in Kabul, and a configured attendance status.
  Saving upserts records for the offering/date, preserving other students' records.
- Grade batches require unique student/component pairs, enrolled students,
  components belonging to the offering, finite scores between zero and maximum,
  and optional feedback up to 2,000 characters. Locked grades reject changes.
  Publishing requires every student's component scores and weights totaling 100%.
- Components require a non-empty list, non-empty Dari/English names (max 150),
  maximum score > 0, weights 0–100 totaling 100%. IDs must belong to the offering.
  Omitted components and their entries are removed; published components cannot
  be changed. Save returns the entire component list.
- Assignment title is required, max 200 characters; description required, max
  10,000. Creation/edit due dates cannot precede today in Kabul. Submissions use
  1–5 file IDs belonging to the student's upload/course/purpose or their existing
  submission. Graded submissions cannot be replaced; grades are 0–100 with feedback
  max 2,000 characters. The server repeats upload ownership/type/size validation.
- Upload limits: 5 files, each non-empty and <=5 MiB; PDF, DOC/DOCX, PPT/PPTX,
  XLS/XLSX, JPG/JPEG, PNG, ZIP. The frontend reports progress and validates before
  upload. Real servers must verify file content, authorize downloads and persist
  files; mock uploads are temporary object URLs valid only in the current page.
- Announcement title/body are required, max 200/10,000 characters. A role audience
  requires `role`; offering audience requires an accessible `offering_id`.
  Teachers can post only to their assigned offerings and edit only their own
  posts. Admins may target all, role or offering audiences. List visibility follows
  the same audience rules as dashboard announcements.

Account and dashboard lists accept pagination/search/sort. Their `page` is an integer >=1,
`per_page` an integer 1–100. For `/admin/students` and `/admin/teachers`, `sort`
uses `name`, `email`, `id`, `institutional_id` or `status`, comma-separated with
optional `-` descending prefixes. Search matches those fields. Unknown sorts return
422. Dashboard sort/search fields are specified below.
No password, password hash, or reset secret appears in a User response. Password change
must verify the old password, hash the new one, and invalidate other sessions.
There is no registration or email recovery endpoint; an admin resets passwords.

### Validation

- Identifier: required valid email, trimmed and matched without case sensitivity.
  Normalize Persian/Arabic identifier digits to Latin. Return a
  generic credentials error on `identifier` for unknown users/wrong passwords.
- Passwords are opaque strings: **never normalize their digits or whitespace**.
- Login password: required, at most 128 characters. Inactive accounts return 403.
- Profile name: optional, trimmed, 2–100 characters for administrators only;
  locale: `fa | en` is required for all roles. Reject student/teacher profile requests
  containing name/email/password/current_password/password_confirmation with 403,
  even when unchanged or empty. Reject student/teacher password mutations with 403
  before validating their current password. Email, role,
  permissions and university profile fields cannot change through `/profile`.
- Admin-managed identity (students and teachers): name 2–100 characters, email valid and <=254 characters,
  trimmed/lowercased and unique across all users (422 `email` on conflict).
  Creation requires locale; role is fixed by the students/teachers resource path, status active, permissions
  empty, `must_change_password` false. Server assigns a unique institutional ID;
  department/current semester start null for subsequent academic enrollment or
  teaching assignment. Institutional IDs use `ST-` for students and `TC-` for
  teachers with unique increasing numbers. Identity payloads are strict and cannot
  change role, status, permissions or passwords through the generic edit endpoint.
- Status payloads are strict and accept only active/inactive. Deactivation
  preserves academic records and blocks login and later authenticated requests;
  real backend implementations must invalidate the account's active sessions.
- Teacher permission payloads are strict, replace the complete grant list, and
  allow only the six teacher permissions from the shared academic rules. Reject
  duplicates, unknown grants and `grades.unlock` with 422. Target role/ID must match
  the teachers resource; return 404 otherwise. Admin-only checks happen before
  validation/target lookup. New teachers have no grants. Presets are client-side
  conveniences: none, teaching without publishing, all teacher grants. The backend
  validates the explicit permission array and applies ownership checks separately.
- Generate a unique cryptographically random password on creation/reset; store only
  a hash on the real server. Return the plaintext once in that response, never in
  user/list responses, logs, or storage. Administrator copies it for direct handover
  to the account holder. No email is sent by this frontend. Reset invalidates old passwords
  and existing account sessions on the real server. Student AND teacher
  names/email/passwords are under administrator control; both roles may update
  only their own language preference. Profile inputs are disabled and security
  navigation/routes are administrator-only; hiding controls is not the API boundary.
- New password: 8–128 characters, must differ from current password; confirmation
  must match. Wrong current password returns a 422 `current_password` error.
- Admin first login: only me, logout and password change are allowed until
  the flag is cleared. Students and teachers never enter this self-service flow;
  the university gives them their email and unique password, ready to use for login.

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

`/dashboard/tasks` additionally accepts `attention_only=0|1` (default 0).
With 1, keep only pending, overdue and review statuses before pagination/sorting;
completed/submitted/graded work is omitted. Overview requests three rows sorted by
due date and independently shows at most three classes and three announcements.
Overview and notification summaries ignore page-local search/course filters.
Full files live at `/resources`; attendance rings/charts live at `/performance`;
full grades, assignments and schedules remain in their dedicated academic routes.

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

## Shared academic rules

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
dashboard reads and the academic endpoints above exist. Admin teacher/academic
structure/offerings/enrollment/settings management routes are still unimplemented;
student and teacher accounts, statuses and teacher permission mutations above exist.
Fixtures contain 1 admin, 3 teachers, 25 students, 1 faculty/department/year,
2 semesters, 6 courses/offerings, enrollment, mixed draft/published/locked grades,
attendance, assignments, one submission, three announcements and six downloadable
study-pack ZIP archives. Admin/teacher demo
password is `Campus123!`. Students have distinct demo passwords (`Student001!Campus`
for `student1@campus.test`, `Student024!Campus` for `student24@campus.test`, etc.).
Login uses email; institutional IDs are read-only record identifiers.
`teacher3@campus.test` uses issued credentials directly, like all students/teachers.
`student25@campus.test` is inactive. Session identity survives refresh in
sessionStorage; profile/password mutations and academic fixtures reset on reload.
This is deliberate demo behavior, not a persistence guarantee for the real API.
