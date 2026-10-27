# University LMS

![Performance tabs](/frontend//public/performance.png)

![Login Page](/frontend//public/login.png)

The React application lives in [frontend](frontend/README.md). Implementation
status is recorded in the [progress review](frontend/docs/FRONTEND_PROGRESS.md),
and the Laravel backend is specified by the [API contract](frontend/docs/API_CONTRACT.md).

The Laravel API lives in [backend](backend/README.md), covering authentication,
academic administration, courses, grades, attendance, private files and dashboards.
Its setup guide explains real frontend login, installation and optional demo data.

```powershell
cd frontend
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```
