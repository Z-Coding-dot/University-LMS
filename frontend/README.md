# Campus — University LMS frontend

The foundation is implemented: React 18, strict TypeScript, Vite, Tailwind tokens, self-hosted
Vazirmatn/Inter, Dari/English namespaces, RTL, authentication, forced password
change, profile/security, responsive app navigation, reusable UI, and mock API.
Administrators can create, edit, reset passwords and activate/deactivate student
and teacher accounts. Teacher permission switches and presets are available in
Teacher accounts. Overview shows role metrics and three-item previews for
deadlines, today's classes and announcements. Courses open role-aware detail tabs for weekly learning, attendance,
grades and assignments. Course notices are inside Weekly learning. Student results, teacher attendance/grade
entry, assignment submissions/review, and the weekly timetable are connected.
Admin academic structure, offerings, instructor assignment, enrollment, class
schedules, grading/attendance settings and grade unlocking are connected in mock
mode. See [the progress review](docs/FRONTEND_PROGRESS.md) for validation limits.

## Run locally

Use Node.js 22.12+ and npm. From the repository workspace:

```powershell
cd frontend
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Open the local address printed by Vite. On macOS/Linux use `npm` instead of
`npm.cmd` and `cp .env.example .env`. The `.cmd` form avoids PowerShell execution
policy restrictions. No dev server or browser was launched during implementation.

Expand “Explore the demo” to fill a role's credentials. Admin/teacher password:
`Campus123!`; first student password: `Student001!Campus`. Other seeded students
have distinct passwords using their three-digit ID, e.g. `Student024!Campus`.

| Account | Email | ID |
|---|---|---|
| Admin | admin@campus.test | AD-001 |
| Teacher | teacher1@campus.test | TC-001 |
| Student | student1@campus.test | ST-001 |
| Another teacher | teacher3@campus.test | TC-003 |
| Inactive student | student25@campus.test | ST-025 |

No registration or email password recovery; the university administrator creates
accounts and resets passwords. Mock changes reset on refresh, including changed
passwords. The session survives a refresh in the same browser tab. Log out before
switching accounts.

Administrators can open **Student accounts** or **Teacher accounts** to create an account with a name and
email. A unique password and institutional ID are generated. Copy the credentials
from the one-time display and give them directly to the account holder. These screens
edit names/emails, reset passwords, and activate/deactivate access without deleting
academic records. Student and teacher profiles have disabled name, email and
password fields; only language is editable. Only administrators have profile/name
and password self-service. Legacy teacher password-change flags are ignored.
New teachers start without academic permissions. Use **Manage permissions** in
Teacher accounts to choose individual grants or a preset; save to apply changes.
The teaching preset excludes grade publishing; no preset grants grade unlocking.
Real persistence, password hashing and session invalidation belong to the future
Laravel backend; the mock mirrors the role restrictions and response shapes.

The login uses the supplied orange/photo reference with no signup or Google login.
Shared tokens include an accessible darker orange for white button labels. The
desktop panel includes bilingual introductory text; mobile shows a single form.
Protected deep links survive login and a required password change. Inputs are
disabled during sign-in, and field/server errors remain associated with the form.
Forgot-password guidance directs users to the university administrator. The
generated asset and exact imagegen prompt are recorded in [LOGIN_ASSET.md](docs/LOGIN_ASSET.md).

## Dashboard behavior

Overview includes role metrics, quick links and up to three deadlines needing
attention, today's classes and announcements. It has no full tables or attendance
charts. Deadlines open the course's assignment tab, and “View all” opens the related
section. Performance owns course attendance rings, search and the attendance chart;
Staff retain searchable Learning files and Performance sections. Student navigation
shows Overview, Courses, Results and Timetable, with profile in the account menu.
Student assignments and learning files are inside courses; general announcements
are read on Overview or in the notification popover.

Staff also see up to three pending attendance/grade tasks and recent submissions;
administrators see recent published scores. **Teaching activity** opens the full
searchable, paginated lists. Each item opens its course tab/date or assignment
review, with permissions and teacher ownership enforced by the mock API.

The sidebar uses a solid dark surface with an orange active state. Collapse is
beside the expanded logo; the collapsed expand button overlays the logo and
appears when that logo is hovered or keyboard-focused. The scrollbar is hidden
with keyboard/wheel scrolling retained. Account identity, role and sign-out are in
the topbar profile menu. Notifications open announcement details directly. Shared
typography uses a compact 12px base on desktop/mobile while preserving 44px touch
targets. Mobile stacks panels and uses shared DataTable cards, 10 records per page.
Mobile uses only bottom navigation for every role, with no sidebar or hamburger.
The bar is mounted at the document body outside page animations and retained on
page errors. Staff/admin extra destinations open in a non-modal More menu above
the bar. Shared safe-area height and page clearance keep Results reachable at
phone/tablet widths. Table actions align to the top with compact desktop padding.

All data comes through typed dashboard endpoints. Students receive only their own
enrollment and published grades; teachers receive assigned offerings. New students
without enrollment get empty states. Course averages omit incomplete/draft results;
progress rings count all class sessions, including sessions with unrecorded
attendance. Student course details warn below the configured attendance threshold;
history labels sessions without a record as unmarked.
The university timezone determines today's schedule. The read-only dashboard does
not add academic editing permissions or change student account restrictions.

## Environment and backend switch

| Variable | Default | Purpose |
|---|---|---|
| VITE_USE_MOCK | true | `false` uses the real API; `true` uses the in-memory adapter |
| VITE_API_URL | empty | Same-origin `/api/v1`; optionally override the backend origin, without `/api/v1` |
| VITE_AUTH_MODE | cookie | Sanctum cookie auth; set `token` for bearer auth |

Restart Vite after environment changes. With a compatible Sanctum backend,
switching off mock mode requires only `VITE_USE_MOCK=false`; the contract is in
[docs/API_CONTRACT.md](docs/API_CONTRACT.md). Cookie mode requires stateful domains,
credentialed CORS and CSRF configuration on Laravel. Deployment must rewrite
non-asset frontend paths to `index.html` for React Router's history routes.
Vite proxies `/api` and `/sanctum` to `http://localhost:8000` during development.
The application lives in `frontend/`. `npm.cmd run build:deploy`
builds `frontend/dist` and copies it into `../backend/public` only when that
directory exists; it never creates a backend or removes backend files.

## Semester subjects and 16-week learning

The student Courses navigation expands into enrolled subjects for their current
semester, showing subject names/codes and instructors. It loads ten entries at a
time when needed; the count is driven by university enrollment, never fixed at
seven. On mobile, the bottom Courses tab opens the subject list
with the shared responsive table. Each subject opens **Weekly learning** by
default, with Week 1–16 and **All weeks** selection. The current week opens by
default and is highlighted; All weeks shows every week heading and content counts
with the current week expanded. Other weeks load their paginated content on opening.
Course-wide and weekly announcements/instructions are shown here, with lecture
downloads and assignment submission status, grades and feedback.
The course Grades tab combines grade components and every assignment into one
searchable, paginated table with type, score/maximum, week, weight, status and
feedback. Assignment titles open the corresponding details.

An assigned teacher needs `materials.manage` to upload weekly lecture text/files
and `assignments.manage` to create weekly assignments. The teaching/full presets
include lecture management. For an assignment, choose its week, text and/or
instruction attachments, deadline and whether student submissions are enabled.
Its detail page shows instructions and instruction files above the student's
completed-work upload area. Submitted files can be replaced until the deadline
and before grading; closed/disabled/graded assignments explain the restriction.
The mock API repeats ownership, enrollment, week and submission checks.

Seeded lectures/assignments are in **Weeks 4, 5 and 8**, with downloadable study packs
and examples of graded/pending work. Empty weeks remain selectable. Staff Learning files includes lecture and assignment
instruction attachments, deduplicated per offering/file. Mock uploads are page-local
object URLs; a real backend must persist and authorize their downloads.

## Admin academic workflow

1. In **Academic structure**, create/edit faculties, departments, academic years,
   semesters and subjects. Semester dates must fit inside their academic year.
2. Create/activate a teacher account and grant the required academic permissions.
3. In **Offerings & enrollment**, create an offering by choosing subject,
   semester, instructor and capacity. Existing offerings keep their subject/semester.
4. Use **Enroll students** to select active students. The explicit current-semester
   switch can set the selected semester on their profiles. Enrollment is additive;
   academic history is preserved and capacity/schedule conflicts are checked.
5. Use **Academic placement** in Student accounts to change a student's home
   department/current semester independently. This never enrolls them automatically.
6. Edit class times using weekday/start/end/room controls. The mock rejects overlap
   for an instructor, room or enrolled student in the same semester.
7. Configure grading ranges, pass mark, attendance statuses/threshold and weekends
   in **Academic settings**. Grade ranges must cover 0–100 without gaps/overlap.
8. Use **Unlock grades** to reopen a locked gradebook as published. Authorized
   teachers can then edit it; published grades remain visible to students.

All changes above are in-memory in mock mode and reset on refresh. The current
build is a frontend milestone; real Laravel persistence, deployment and browser
workflow validation are separate remaining work.

## Architecture and shared components

- `src/config/app.ts`: placeholder name/logo and Kabul timezone; no Epart branding.
- `src/config/nav.ts`: single role/permission-aware source for all navigation.
- `src/api`: typed endpoints, DTOs, Axios interceptors and mock adapter/fixtures.
- `src/app`: query/motion/tooltip providers, session bootstrap, router and guards.
- `src/components/ui`: all foundational primitives, `DatePicker`, and `DataTable`.
  Related controls share files and are re-exported from `ui/index.ts`.
- `src/components/layout`: split auth layout, shell, desktop sidebar, topbar,
  bottom tabs and page headers. Related navigation components share one file.
- `src/components/shared`: identity/status/grade cells, filters, semester/language
  switchers, stat/chart cards and responsive week timetable.
- `src/features`: auth and profile use Query hooks, RHF, and Zod schemas.
- `src/lib`: pure grading, dates, number normalization, permissions, and helpers.
- `src/i18n/{fa,en}`: common, navigation, auth, profile, foundation, admin, dashboard and academic namespaces.

Search existing components before adding one. `DataTable` receives a typed
`fetchPage(params, signal)` function, a stable `queryKey` scoped to the current
account, columns, row IDs, filters and optional row actions/selection. Each column
declares `mobile: primary | secondary | hidden`. Desktop renders a real table;
mobile fetches 10 records initially, appends pages, and reveals secondary fields
and actions on request. Server sorting/search/filtering live in the same query.
Pass user-triggered filter changes as `filterValues` to reset pagination.

`useCan`, `<Can>`, `RequireRole`, and `RequirePermission` share permission constants.
Role-specific modules must still enforce ownership and permissions on the server.
Zustand contains auth/UI state only; server data belongs to TanStack Query.

Dari is the default. Local language choices persist in localStorage and update
`html[dir]`/`html[lang]`; login applies the account's locale. Topbar language changes
affect the current browser; save language in profile to update the account too.
All dates display through `formatDate`; date selections emit Gregorian date-only
ISO strings. Afghan month names are explicit. Numeric input schemas must call
`normalizeDigits` before validation. Passwords are never normalized.

Fonts in `public/fonts` include their OFL licenses; no remote font requests.
Dialogs become bottom sheets below `md`. All roles use mobile bottom tabs, with
additional staff/admin sections in the More menu. Reduced motion is respected globally.

## How to add a module

1. Search `components` for controls/layouts to reuse.
2. Add `src/features/<module>/{pages,components,hooks}` and `schemas.ts`.
3. Add a lazy route in `src/app/router.tsx` with the required guards.
4. Add a role/permission-aware entry to `src/config/nav.ts`.
5. Add both language namespaces and register them in `src/i18n/index.ts`.
6. For new resources, add DTOs, typed endpoints and matching mock handlers.
7. Record those endpoints/validation/permissions in `docs/API_CONTRACT.md`.
8. Use Query for server state and the shared DataTable for all record tables.
9. Keep calculations in pure utilities; test only those utilities with Vitest.
10. Run the verification commands below.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Vitest is limited to `src/lib/**/*.test.ts`. Utility coverage includes mixed-digit
normalization, Afghan calendar boundaries, ISO validation, weighted averages,
configurable attendance, grade visibility/lifecycle and permission restrictions.
No screenshots, browser automation, Lighthouse or visual dev-server checks.

The dependency versions are locked in `package-lock.json` for React 18. Refer to
[Vite setup](https://vite.dev/guide/),
[the date picker's calendar documentation](https://shahabyazdi.github.io/react-multi-date-picker/calendars/)
and its [locale API](https://shahabyazdi.github.io/react-multi-date-picker/locales/)
for the foundational tool requirements and calendar configuration.
