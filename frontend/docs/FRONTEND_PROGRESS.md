# Frontend progress review

Updated 22 October 2026 against `Skills/Frontend.md` (the requested
`Skills/Frotnend.md` is named `Frontend.md` in this repository).

## What was already present

The React/TypeScript foundation, shared controls, Dari/English support, RTL,
fonts, mock authentication, profile/security, role dashboards and administrator
student provisioning were implemented. Academic API handlers and several student
and teacher components existed, but their routes and academic translations were
missing. The results page contained JSX syntax errors that failed both TypeScript
and ESLint. Documentation did not cover the existing academic components and the
integration work they still needed.

## Current status

| Area | Status | Remaining work |
|---|---|---|
| Foundation | Implemented | Real backend integration and browser/device QA remain |
| Login | Improved | Backend session/CSRF verification when Laravel is available |
| Role dashboards | Focused overview, staff work/submission feeds, recent academic activity, Performance/Learning files pages | Validate with real institutional data |
| Student area | Semester subject submenu, 16-week content and assignment detail/upload screens connected | Browser/device and backend workflow verification |
| Teacher area | Weekly lecture/assignment editing, submission review, attendance and grades connected | Browser/device and backend workflow verification |
| Admin accounts and permissions | Implemented | Real backend session invalidation and persistence |
| Admin academic area | Core screens implemented in mock mode | Browser/device validation and real backend transactions/authorization |
| Phase 4 documentation/build | Frontend review completed; contract/setup/env and permitted checks complete | Real deployment remains separate |
| Backend/deployment | Frontend contract and build tooling | Laravel/MySQL implementation, hosting configuration and deployment |

This is a feature inventory, not a percentage estimate or a claim of production
readiness. No browser, screenshots, Playwright, Cypress or Lighthouse was used,
following the verification constraint in the brief.

## Work completed in this continuation

### Student navigation and weekly learning revisions

- Use shared compact 12px typography and smaller headings/metrics across desktop
  and mobile; preserve the 16px root layout scale and 44px touch targets.
- Move the collapsed expand button below the logo, revealed on hover/focus with
  a visible touch fallback. Remove account/footer sign-out from sidebar and drawer;
  show identity, role and sign-out in the topbar profile menu.
- Hide Assignments, Learning files, Performance and Announcements navigation for
  students. Keep course assignment/file access and Overview announcements.
- Add All weeks with all 16 headings/content counts, current-week highlighting
  and the current materials open by default. Existing week lists load on expansion.
  Seed different materials/assignments in Weeks 4, 5 and 8.
- Move course notices into Weekly learning, supporting course-wide notices and
  teacher instructions for a numbered week. Remove the separate course notice tab.
- Show student assignment scores/feedback in weekly lists and the course Grades
  tab. Results now includes configured Midterm/Endterm/Final/FX/custom assessments,
  each course's assignment grades and weighted totals without exposing drafts.
- Fix the shared responsive filter layout, centered search icon and truncation of
  long semester values. Extend DTOs, mock validation, contract and bilingual text.

### Final review requested before backend work

The frontend was not fully complete at the start of this review. These gaps are
now addressed:

- Add **Teaching activity** for administrators and teachers: pending attendance,
  draft gradebooks, recent submissions and published-score activity. Overview
  previews have at most three entries; full lists use the shared DataTable.
  Permissions, current semester and assigned-offering ownership scope each feed.
- Calculate attendance against all sessions, including sessions without records.
  Student history explicitly shows unmarked sessions; course detail displays the
  configured attendance warning. Staff percentages use expected student/session
  records as the denominator.
- Preserve grade edits when an unchanged query refetches; disable window-focus
  refetch for grade entry and clear dirty state after successful saves.
- Reject duplicate draft component IDs and maxima below saved scores; prevent
  removed component IDs and scores being reused by newly added components.
- Add keyboard arrow/Home/End navigation, unique tab/panel IDs and roving focus to
  mobile timetable days. The initial day now follows Kabul time at midnight.
- Add friendly 403/404 query states, shared staggered row/card reveals, subtle
  interactive hover lift, RTL movement and reduced-motion delay suppression.
- Extend the typed API contract and both translation sets for these additions.

### Requirement audit

| Brief section | Frontend implementation |
|---|---|
| 1. Stack | Requested React/TypeScript toolchain and shared libraries present |
| 2. Design | Orange tokens, login artwork, dark sidebar/top collapse, compact overview, motion |
| 3. Language/calendar | Dari default, English, logical RTL layout, local fonts, Afghan months and normalized digits |
| 4. Academic rules | Weighted results, configurable grade scale/attendance, draft/publish/lock and utility tests |
| 5. Access | Role/permission guards, managed credentials, one-time issuance and cookie/token client |
| 6. Screens | Student, teacher, admin and shared screens connected to mock endpoints |
| 7. Mobile/weekly learning | Enrollment submenu, instructor, 16 weeks, instructions before upload, cards/load-more, sheets/day tabs |
| 8. Architecture | Shared controls/tables/forms, Query server state, configured routes/nav and module guide |
| 9. Contract/deployment preparation | Typed endpoints, realistic mock data, contract, env/proxy and conditional copy script |
| 10. Verification | TypeScript, ESLint, utility tests and production build; no browser checks |

Phases 0–4 are complete for the frontend running against the mock API. Backend
implementation is deferred until the user's backend specification is supplied.
Browser/device validation and real backend integration have not been performed.

- Add the requested weekly teaching specification to `Skills/Frontend.md`.
  Student subjects are driven by university enrollment in the current semester;
  each subject shows its instructor and offers 16 weeks of content.
- Add an accessible, paginated subject submenu in desktop/mobile navigation and
  a default Weekly learning course tab. Seed Week 4 with lecture material and an
  assignment; other weeks have empty states until content is added.
- Add `materials.manage` and weekly lecture text/file editing. Weekly assignments
  have text/file instructions, a deadline and an explicit submission switch.
  Assignment detail puts instructions above student uploads, with status/files,
  scores/feedback and API-enforced closed/expired/graded restrictions.
- Complete the remaining admin screens: academic structure, offerings and teacher
  assignment, additive enrollment, schedules, grading/attendance settings and grade
  unlocking. Add student academic placement for department/current semester changes
  without automatic enrollment. Validate capacity, parent relationships, dates,
  grade-scale coverage and timetable conflicts before mutations.
- Finish API documentation and correct setup/deployment paths after the project
  was moved to `frontend/`. Existing root README images are retained.

Earlier work also completed:

- Sidebar: move collapse/expand beside the logo in both sizes; hide the visible
  scrollbar while preserving accessible scrolling, strengthen active states and
  make account text legible on the dark surface.
- Overview: retain metrics, quick links and three-item deadline/class/announcement
  previews. Move attendance rings/charts to Performance and downloads to Learning
  files. Full academic workflows remain in their own sections.
- Account policy: disable name/email/password inputs for students AND teachers,
  restrict security routes to administrators, reject credential writes in the mock
  API, and allow managed users to update language only. Legacy teacher forced
  password-change flags no longer redirect to self-service.
- Admin: share account forms, tables, API handlers and hooks across students and
  teachers; add teacher provisioning, password reset, activation/deactivation and
  teacher permission switches with presets. New teachers have no grants. Passwords
  are shown once on issue/reset; permission presets never include grade unlocking.

The earlier continuation also completed:

- Login: bilingual desktop introduction, retained student artwork, single-column
  mobile form, shared orange tokens, darker action color, 56px fields/buttons,
  clear issued-credential guidance, pending-state input protection and password
  visibility control alignment.
- Authentication: preserve local deep links through login and forced password
  change; reject external/invalid destinations and authentication redirect loops.
- Navigation: lazy routes for courses/details, results, assignments, timetable,
  announcements and staff gradebook; role-aware tabs and permission-aware actions.
  Course selections on Performance link to course details.
- Academic area: connect existing attendance, grade component editing,
  draft/publish/lock, assignment upload/submission/review, semester results and
  announcement components. Add matching English/Dari academic translations.
- Fix the results page syntax errors. Keep the shared DataTable's mobile cards,
  10-row loading, shared form components and server-state hooks.
- Transport: default to relative `/api/v1`, add Vite `/api` and `/sanctum` proxies,
  and add an optional build/copy script for an existing backend public directory.
- Update README and API contract to distinguish connected features from admin
  work that remains.

## Applying the requested reference

[devkodeio/frontend-system-design](https://github.com/devkodeio/frontend-system-design)
is a frontend architecture checklist, with guidance on design systems, forms,
accessibility, state, routing, localization and authorization. It does not supply
a UI component package or a visual token palette. The implementation applies its
guidance through the existing typed API boundary, Query server state, reusable
controls, lazy routes, validation, role checks and bilingual logical layouts.

The project's own brief remains the visual specification: orange/amber, dark
sidebar, white surfaces, rounded cards, Vazirmatn/Inter and mobile-first RTL.
`--brand` retains `#FF6B00`; `--brand-action` is `#C2410C` for white-label contrast.
The source directory is now `frontend/`, beside the future `backend/`, matching
the deployment layout in the brief.

## Verification

Required checks: TypeScript, ESLint, Vite production build, and Vitest restricted
to pure utilities in `src/lib`. Authentication destination tests cover preserved
course tabs/anchors, external targets, malformed state and redirect loops.

The utility suite passes 36 tests across 10 files, including managed-account
credential rejection, permission presets, closed/expired/graded submissions,
grade-scale coverage, timetable overlap rules, missing attendance records and
the Kabul midnight boundary, current teaching weeks and private result breakdowns.
Browser/device and real-backend
flows have not been exercised under this brief's verification constraints.

Phases 0–4 have their frontend work completed against the mock API, including
the final contract/setup/build checks. This does not certify real
backend integration, browser/device behavior or production readiness.
