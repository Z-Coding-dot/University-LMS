# Frontend progress review

Reviewed 21 October 2026 against `Skills/Frontend.md` (the requested
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
| Role dashboards | Focused overview and dedicated Performance/Learning files pages | Validate with real institutional data |
| Student area | Core screens connected | Browser/device and backend workflow verification |
| Teacher area | Core screens connected | Browser/device and backend workflow verification |
| Admin accounts and permissions | Implemented | Real backend session invalidation and persistence |
| Admin academic area | Partial | Academic structure, offerings, enrollment, schedules, settings, grade unlocking |
| Backend/deployment | Frontend contract and build tooling | Laravel/MySQL implementation, hosting configuration and deployment |

This is a feature inventory, not a percentage estimate or a claim of production
readiness. No browser, screenshots, Playwright, Cypress or Lighthouse was used,
following the verification constraint in the brief.

## Work completed in this continuation

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
  six permission switches with presets. New teachers have no grants. Passwords
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
The source directory remains `lms-frontend/`, avoiding a disruptive rename of the
existing project despite the brief's later `frontend/` naming example.

## Verification

Required checks: TypeScript, ESLint, Vite production build, and Vitest restricted
to pure utilities in `src/lib`. Authentication destination tests cover preserved
course tabs/anchors, external targets, malformed state and redirect loops.

The utility suite passes 25 tests across 8 files, including managed-account
credential rejection and permission preset/revocation rules. Browser/device and real-backend
flows have not been exercised under this brief's verification constraints.

The next development phase is the remaining admin area listed above. Its API
mutations must extend the contract alongside the screens and mock handlers.
