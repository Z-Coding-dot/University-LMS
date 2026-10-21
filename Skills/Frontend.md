# Task: Build the frontend of a University LMS (Learning Management System) — Dari + English, premium, mobile-first

Academic management only (NO payments). Roles: Admin, Teacher, Student. Frontend first; a Laravel + MySQL backend will be built AFTER this, from the API contract you produce. Design language = the Epart website (premium, orange/black/white, Vazirmatn). Do NOT use Epart branding; the app name/logo are placeholders in /src/config/app.ts.

## 1. Stack
React 18 + TypeScript (strict) + Vite, Tailwind CSS, React Router (data router), TanStack Query, TanStack Table (headless), React Hook Form + Zod, Zustand (auth/UI state only), Axios, react-i18next, `motion` (Framer Motion), Lucide React, Recharts, Sonner (toasts), Radix UI primitives (shadcn-style: Dialog, Select, Dropdown, Tabs, Tooltip, Popover, Switch, Checkbox) + class-variance-authority + tailwind-merge + clsx, react-multi-date-picker (Solar Hijri), Vitest (unit tests for pure utils ONLY). Fonts self-hosted: Vazirmatn (fa), Inter (en).

## 2. Design (same as Epart, adapted to an app)
- Tokens: #FF6B00, #FFB202, #111827, #F3F4F6, #FFFFFF as Tailwind/CSS variables. Dark sidebar (#111827) with orange active state, light content area, rounded-2xl cards, soft shadows, subtle gradients, glass accents, consistent Lucide icons, strong type scale.
- Login: follow the supplied reference: orange gradient panel with fine circular outlines, white curved base and a seated student reading; clean white email/password form beside it. No Google sign-in or signup. Forgot-password guidance directs users to the administrator. Mobile: single column. Preserve bilingual RTL support.
- Dashboard overview: show role-specific metrics, quick links, and compact previews (up to three each) of actionable deadlines, today's classes and announcements. Full courses, grades, assignments, learning files and attendance charts belong to their related sections. Sidebar collapse/expand sits beside the logo at the top in both sizes; hide its visible scrollbar while retaining keyboard/wheel scrolling. Keep the orange brand, dark sidebar, Recharts on Performance, skeleton loaders and empty states. Links must open real sections/details; data must respect enrollment, teacher assignment and grade visibility. Mobile panels stack and shared tables become cards.
- Motion: page transitions, staggered list reveal, hover lift, animated count-up on stat numbers. Directions must respect RTL (multiply x-offsets by dir). Respect `prefers-reduced-motion`. Keep it tasteful; no heavy WebGL.
- No dark mode (out of scope).

## 3. i18n, RTL, calendar, numbers
- Languages: Dari (`fa`, RTL, `lang="fa-AF"`) and English (`en`, LTR). Switcher in topbar + login; persisted in localStorage; updates `<html dir lang>`. Default: Dari. Translation files split by namespace under /src/i18n/{fa,en}/. All UI strings via i18n — zero hardcoded text. Use academic Afghan Dari terms («پوهنتون»، «پوهنځی»، «سمستر»، «نمره»، «حاضری»…).
- Use Tailwind logical utilities only (ms/me/ps/pe/start/end, text-start); mirror directional icons (chevrons/arrows) in RTL.
- Dates: stored/transferred as Gregorian ISO. Display in Dari with Solar Hijri, in English with Gregorian — through ONE util `formatDate()` in /src/lib/date.ts. Try `Intl.DateTimeFormat('fa-AF-u-ca-persian')`; verify month names are the Afghan ones (حمل، ثور، جوزا، سرطان، اسد، سنبله، میزان، عقرب، قوس، جدی، دلو، حوت); if not, add a month-name map. One `DatePicker` component (Solar Hijri picker in fa with Afghan month names, Gregorian in en) always emitting Gregorian ISO. Week starts Saturday in fa; weekend days configurable in settings (default Friday).
- Numbers: Persian digits in fa display, Latin in en (`formatNumber()`). Inputs must accept Persian/Arabic digits and normalize to Latin before validation/submit (`normalizeDigits()`).

## 4. Domain (university, single institution)
Entities: Faculty, Department, AcademicYear, Semester, Course (code, name fa/en, credits), CourseOffering (course + semester + teacher + schedule slots + capacity), Enrollment (student ↔ offering), GradeComponent (per offering: name, max score, weight; weights must sum to 100), GradeEntry (per student per component: score + optional feedback), AttendanceSession (offering + date), AttendanceRecord (present | absent | late | excused), Assignment (offering, title, description, due date, attachments), Submission (student, files, submitted_at, optional score/feedback), Announcement (audience: all | role | offering), TimetableSlot (offering, weekday, start, end, room), User (role, status, profile: student ID / teacher ID, department, current semester).
Rules (put in /src/lib/grading.ts as pure functions + unit tests):
- Course total = Σ(score/max × weight). Letter grade and pass mark come from admin-configurable settings (scale: ranges → letters).
- Semester average = credit-weighted average of course totals. Cumulative average across semesters. No 4.0 GPA.
- Attendance % = (present + late + excused) / total sessions (configurable which statuses count); warning threshold configurable.
- Grade lifecycle: draft → published (visible to student) → locked (only admin can unlock). Students never see draft grades.
- The server will be authoritative for all calculations; the client computes only for display/preview.

## 5. Roles & permissions
- Admin: creates users (students/teachers), assigns teachers to offerings, enrolls students, and grants/revokes teacher PERMISSIONS.
- Permission strings (constants in /src/lib/permissions.ts): `attendance.take`, `grades.enter`, `grades.publish`, `assignments.manage`, `announcements.post`, `timetable.view`. Admin has everything implicitly; `grades.unlock` is admin-only.
- User object from API: `{ id, name, email, role, permissions: string[], locale, must_change_password }`.
- Implement `useCan(permission)`, `<Can>`, role route guards, and a single permission-aware nav config. 403 → friendly page. First login with `must_change_password` forces the change-password screen for administrators only. Students and teachers use university-issued credentials directly and never enter a self-service password-change flow, including when a legacy flag is present.
- Auth: login with university-issued email + password; no Google login, self-registration or email-based reset. Only administrators create student/teacher accounts and change their name/email/password. Generate a unique password per new account/reset, reveal credentials once to the administrator for direct handover, and never expose passwords in lists. Students and teachers may change their language preference only; their name/email/password profile inputs are disabled. Enforce restrictions in UI/routes and API. API client supports Sanctum cookie mode (`withCredentials`, CSRF cookie) behind a single switch in /src/api/client.ts.

## 6. Screens
Admin: dashboard (counts, attendance overview, recent activity) · users (students, teachers: list/create/edit/deactivate/reset password) · teacher permissions (per-teacher toggles + quick presets) · academic structure (faculties, departments, academic years, semesters, courses) · offerings (create, assign teacher, enroll students, schedule slots) · timetable overview · grading & attendance settings (pass mark, letter scale, attendance rule/threshold, weekend days) · announcements · unlock grades · profile.
Teacher: dashboard (today's classes, pending attendance/grades, recent submissions) · my classes → class detail tabs: Students / Attendance / Grades / Assignments / Announcements · attendance taking (date picker, mark-all-present, per-student status, summary) · grade entry per component (validates ≤ max, feedback per entry, save draft, publish) · assignments (create, view submissions, score + feedback) · timetable · profile. Actions hidden/disabled per permission.
Student: dashboard (semester average, attendance %, upcoming assignments, latest announcements) · my courses (current semester) → course detail: grade breakdown per component + feedback, attendance history, assignments (submit files), announcements · results by semester (course totals, letter, semester average, cumulative average, chart) · timetable (week view) · announcements · profile.
Shared: announcements list/detail, timetable view, profile (student/teacher name/email/password disabled and administrator-managed; language editable; name/password self-service for administrators only).

## 7. Mobile-first rules (critical)
### Semester subjects and weekly teaching content
- The student Courses navigation expands into the subjects assigned by the university for the student's current semester. This is enrollment-driven, not a fixed list or subject count (e.g. seven assigned subjects means seven entries). Display subject name/code and its assigned teacher/instructor. Support the same course selection on mobile, and refresh it after enrollment changes.
- Each course offering has 16 numbered weeks. Course detail opens a weekly learning area with accessible week selection. Every week may have multiple lectures/materials and assignments; show useful empty states for unpublished/empty weeks.
- Assigned teachers with `materials.manage` can create/edit weekly lectures with text and/or downloadable files. Assigned teachers with `assignments.manage` can create/edit an assignment in a chosen week (e.g. Week 4), provide text instructions and/or instruction attachments, set a deadline, and explicitly enable/disable student submissions.
- Assignment detail shows the instructions and instruction files ABOVE the student's completed-work upload area. Students can upload/replace their own completed files only when submissions are enabled, before the deadline and before grading. Display submitted status, files, score and feedback; staff can review submissions separately. Disabled/closed/graded assignments remain readable with a clear reason why uploading is unavailable.
- Enforce week range 1–16, offering ownership, enrollment, file limits and submission status in the mock API and future Laravel backend, not only the UI. Record weekly lecture, assignment and submission fields/endpoints in the API contract.

- Style mobile-first; must work from 360px up. Body text ≥16px, fa line-height ~1.8. Touch targets ≥44px, no hover-only actions, safe-area padding.
- Navigation: desktop = collapsible sidebar; mobile student/teacher = bottom tab bar (4–5 items + "More" sheet); mobile admin = drawer.
- ONE reusable `DataTable` component for ALL tables: desktop renders a real table; below `md` each row becomes a CARD. Column config has `mobile: "primary" | "secondary" | "hidden"` — cards show only primary fields plus a "Show more / بیشتر" toggle revealing secondary fields and row actions. Lists on mobile show the first 10 items with a "Load more / نمایش بیشتر" button — never dump all rows. Supports server-side pagination, sorting, search, filters, loading skeleton, empty state, optional row selection.
- Grade entry on mobile: per-student cards with collapsible component inputs (not a spreadsheet grid), sticky save/publish bar. Desktop: editable grid.
- Attendance on mobile: per-student card with segmented status buttons, sticky summary bar, "mark all present" action, 10-at-a-time with "Load more".
- Forms: single column on mobile, correct `inputmode`/`type`, full-width buttons. Modals become bottom sheets on mobile. Timetable on mobile = day tabs, not a wide grid. Charts resize and use simplified legends on mobile.

## 8. Reusable & flexible architecture (strict)
Before creating ANY component, search /components and reuse or extend via props/variants. No duplicated markup across features. Everything config-driven where possible: nav config (role + permission), table column configs, form field configs, enums/constants in one place (statuses, weekdays, permissions). Adding a new module (e.g. exams) must require only: a new /features/<module> folder + route entry + nav entry + i18n namespace. Document this in README ("How to add a module", ≤20 lines).

Folder structure (follow exactly):
```
lms-frontend/
├── public/{fonts,icons,images/logo}/
├── docs/API_CONTRACT.md
├── src/
│   ├── app/            # router.tsx, providers.tsx, guards/ (RequireAuth, RequireRole, RequirePermission)
│   ├── config/         # app.ts (name, logo), nav.ts, constants.ts
│   ├── api/
│   │   ├── client.ts   # axios, interceptors (401 → logout, 403, 422 → RHF errors, Accept-Language)
│   │   ├── endpoints/  # one file per resource, typed
│   │   ├── mock/       # in-memory adapter + fixtures, enabled by VITE_USE_MOCK=true
│   │   └── types/      # DTO types shared across features
│   ├── components/
│   │   ├── ui/         # Button, IconButton, Input, PasswordInput, Textarea, Select, Combobox, Checkbox, Switch, SegmentedControl, FormField, DatePicker, Dialog, Sheet, Tabs, Dropdown, Tooltip, Badge, Card, Avatar, Skeleton, Progress, ProgressRing, Accordion, Pagination, EmptyState, ConfirmDialog, DataTable
│   │   ├── layout/     # AppShell, Sidebar, Topbar, MobileTabBar, MobileDrawer, PageHeader, AuthLayout
│   │   └── shared/     # StatCard, ChartCard, FilterBar, SemesterSwitcher, LanguageSwitcher, UserCell, GradeBadge, AttendanceBadge, StatusBadge, WeekTimetable
│   ├── features/
│   │   ├── auth/ ┬ admin/ ┬ teacher/ ┬ student/ ┬ announcements/ ┬ timetable/ ┬ profile/
│   │   └── (each: pages/, components/, hooks/ (TanStack Query hooks), schemas.ts (Zod))
│   ├── hooks/          # useCan, useMediaQuery, useDebounce, useDir
│   ├── lib/            # grading.ts(+test), date.ts(+test), number.ts(+test), permissions.ts, cn.ts
│   ├── i18n/{fa,en}/   # namespaced JSON
│   ├── styles/index.css
│   ├── App.tsx
│   └── main.tsx
├── index.html, package.json, tailwind.config.ts, tsconfig.json, vite.config.ts, .env.example
```

## 9. API layer & contract (for the future Laravel backend)
- REST under `/api/v1`. Success: `{ data }`; paginated: `{ data, meta: { current_page, per_page, total, last_page } }` using `page` / `per_page` / `sort` / `search` / filter query params. Validation errors: HTTP 422 `{ message, errors: { field: string[] } }`. Dates ISO 8601 Gregorian. IDs numeric.
- The whole frontend must run fully on the mock adapter (`VITE_USE_MOCK=true`) with realistic fixtures (1 admin, 3 teachers, ~25 students, 2 semesters, 6+ offerings; Dari and English names, mixed attendance/grades). The mock mirrors the real contract exactly so switching to Laravel = changing the env flag.
- As you build, maintain `docs/API_CONTRACT.md`: every endpoint used (method, path, query, request body, response shape, required role/permission), entity field lists, validation rules, and business rules from §4–5. This file is the input for the backend prompt — keep it accurate and compact.
- Monorepo layout: this project lives in `frontend/` next to a future `backend/` (Laravel). API base URL is the relative path `/api/v1` (same origin in production). In dev, configure the Vite proxy: `/api` and `/sanctum` → `http://localhost:8000`. Use `base: "/"` and put the build output in `frontend/dist` (the backend will serve it). Add an npm script `build:deploy` that builds and copies `dist` into `../backend/public` only if that folder exists.

- Shared-hosting friendly: no Node server features, no SSR. Route-level code-splitting (`React.lazy`) and a small bundle. File uploads: validate type and size client-side using limits from a config constant (default max 5 MB per file, allowed: pdf, doc/docx, ppt/pptx, xls/xlsx, jpg, png, zip); show clear Dari/English errors. Show upload progress.
## 10. TOKEN & TIME BUDGET (strict)
- NO screenshots, NO Playwright/Cypress, NO Lighthouse, NO launching a browser, NO repeated dev-server runs just to look at the UI.
- Verification = `tsc --noEmit`, `eslint`, `vite build`, and Vitest for the pure utils in /src/lib only. Fix errors, don't re-verify repeatedly.
- Follow the mobile rules in §7 by construction (shared DataTable, AppShell) instead of testing each page visually.
- Don't re-read large files you just wrote; don't rewrite files wholesale for small changes; no speculative refactors. Keep status messages to ≤5 lines per phase.

## 11. Phases
0. Foundation: project setup, tokens, fonts, i18n + RTL, date/number utils, API client + mock adapter skeleton, all base ui/ + layout/ + shared/ components (incl. DataTable), auth + guards, login, profile. STOP here and give me run instructions + a short list of what exists.
1. Student area. 2. Teacher area. 3. Admin area. (Proceed through these without waiting, unless blocked.)
4. Finish: complete `docs/API_CONTRACT.md`, README (setup, env, mock mode, how to add a module), `.env.example`, final tsc/eslint/build pass.
Ask me only if blocked; otherwise decide and flag the decision in your phase report.
