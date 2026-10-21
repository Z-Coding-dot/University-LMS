# Campus — University LMS frontend

The foundation is implemented: React 18, strict TypeScript, Vite, Tailwind tokens, self-hosted
Vazirmatn/Inter, Dari/English namespaces, RTL, authentication, forced password
change, profile/security, responsive app navigation, reusable UI, and mock API.
Administrators can create, edit, reset passwords and activate/deactivate student
and teacher accounts. Teacher permission switches and presets are available in
Teacher accounts. Overview shows role metrics and three-item previews for
deadlines, today's classes and announcements. Courses open role-aware detail tabs for attendance,
grades, assignments and announcements. Student results, teacher attendance/grade
entry, assignment submissions/review, and the weekly timetable are connected.
Admin academic structure, offerings/enrollment,
settings and grade unlocking remain unfinished. See [the progress review](docs/FRONTEND_PROGRESS.md).

## Run locally

Use Node.js 22.12+ and npm. From the repository workspace:

```powershell
cd lms-frontend
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
Learning files owns the searchable download table. Courses, results/gradebook,
assignments, timetable and announcements each have their own pages.

The sidebar uses a solid dark surface with an orange active state. Collapse/expand
is beside the logo at the top in both widths; the visible scrollbar is hidden,
with keyboard/wheel scrolling retained. Compact links have labels and tooltips.
The notification button opens recent announcements and links to the announcements
page. Mobile stacks panels and uses shared DataTable cards, 10 records per page.

All data comes through typed dashboard endpoints. Students receive only their own
enrollment and published grades; teachers receive assigned offerings. New students
without enrollment get empty states. Course averages omit incomplete/draft results;
progress rings show recorded attendance rather than estimated course completion.
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
The existing `lms-frontend/` directory is retained. `npm.cmd run build:deploy`
builds `lms-frontend/dist` and copies it into `../backend/public` only when that
directory exists; it never creates a backend or removes backend files.

## Architecture and shared components

- `src/config/app.ts`: placeholder name/logo and Kabul timezone; no Epart branding.
- `src/config/nav.ts`: single role/permission-aware source for all navigation.
- `src/api`: typed endpoints, DTOs, Axios interceptors and mock adapter/fixtures.
- `src/app`: query/motion/tooltip providers, session bootstrap, router and guards.
- `src/components/ui`: all foundational primitives, `DatePicker`, and `DataTable`.
  Related controls share files and are re-exported from `ui/index.ts`.
- `src/components/layout`: split auth layout, shell, sidebar, topbar, drawer,
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
Dialogs become bottom sheets below `md`. Teacher/student navigation uses mobile
bottom tabs; admin navigation uses a drawer. Reduced motion is respected globally.

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
