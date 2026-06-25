# Project Report: AI-Powered Smart Task Management Website

## 1. Project Overview
This repository contains a full-stack AI-enhanced task management application built with:
- Frontend: React 19 + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB / Mongoose
- Real-time updates: Socket.io
- AI assistance: OpenAI GPT
- Authentication: JWT access + refresh, Google OAuth support

The app supports:
- user registration and login
- role-based access control (user, manager, admin)
- task creation, update, and assignment
- AI-generated task suggestions and summaries
- dashboard analytics with charts
- admin user management and audit logs

---

## 2. How It Works

### Backend
- `server/src/index.js` starts the Express API server and Socket.io.
- `server/src/config/db.js` connects to MongoDB and falls back to an in-memory MongoDB server if no local database is available.
- `server/src/routes/` defines API endpoints for auth, tasks, admin, and reports.
- `server/src/controllers/` contains logic for handling requests and returning JSON data.
- `server/src/middleware/` performs authentication and validation.
- `server/src/services/aiService.js` connects to OpenAI for task suggestions.
- `server/src/services/socket.js` initializes and manages real-time notifications.
- `server/src/utils/logger.js` manages audit logging.

### Frontend
- `client/src/App.jsx` defines routes and protected pages.
- `client/src/services/api.js` defines a shared Axios instance with JWT token injection and refresh handling.
- `client/src/context/` contains `AuthContext`, `TaskContext`, and `ThemeContext` for application state.
- `client/src/components/` holds reusable UI layers such as `Layout`, `ProtectedRoute`, and `ErrorBoundary`.
- `client/src/pages/` holds the main page screens: `Login`, `Register`, `Dashboard`, `TaskList`, and `AdminPanel`.

### Routing Summary
- `/login` — public login screen
- `/register` — public registration screen
- `/` — dashboard (authenticated users)
- `/tasks` — task list and task management (authenticated users)
- `/admin` — admin panel (authenticated admin only)
- `*` — fallback to login screen

---

## 3. File and Feature Mapping

### Root
- `README.md` — existing project summary
- `PROJECT_REPORT.md` — this report

### Server
- `server/package.json` — server scripts and dependencies
- `server/.env.example` — recommended environment variables
- `server/src/index.js` — app startup and middleware
- `server/src/config/db.js` — MongoDB connection
- `server/src/config/seeder.js` — seed sample users/tasks
- `server/src/routes/` — API route definitions
- `server/src/controllers/` — request handling logic
- `server/src/middleware/` — auth and validation utilities
- `server/src/models/` — Mongoose schemas for users, tasks, audits
- `server/src/services/` — AI and socket services
- `server/src/utils/logger.js` — audit logging helper

### Client
- `client/package.json` — client scripts and dependencies
- `client/.env.example` — frontend environment variables
- `client/src/App.jsx` — route tree and providers
- `client/src/main.jsx` — React app entry point
- `client/src/components/` — layout, route guard, error boundary
- `client/src/context/` — auth, task, theme state providers
- `client/src/pages/` — UI pages for auth, dashboard, tasks, admin
- `client/src/services/api.js` — Axios client with auth and refresh logic

---

## 4. Commands to Run the Website

### Root Launcher (new)
A new root-level `package.json` was added so you can start both applications together.

```bash
cd project
npm install
npm run dev
```

This runs both services at once:
- `cd server && npm run dev`
- `cd client && npm run dev -- --host 0.0.0.0`

For production-style startup after building the client:

```bash
cd project
npm run build
npm run start
```

Or deploy with a single root command:

```bash
cd project
npm run deploy
```

### Server Setup
```bash
cd server
npm install
copy .env.example .env
# Edit server/.env with your environment values
npm run dev
```

The server listens on `http://localhost:5000` by default.

> Note: `server/src/config/db.js` now includes a robust fallback path. If the configured MongoDB URI cannot be reached, the backend will try local MongoDB and then fall back to an in-memory MongoDB instance automatically.

### Client Setup
```bash
cd client
npm install
copy .env.example .env
# Edit client/.env with the backend API URL and Google client ID
npm run dev
```

The client runs by default at `http://localhost:5173`.

### Production Build
#### Frontend
```bash
cd client
npm run build
```

#### Backend
```bash
cd server
npm install
npm start
```

> For production, update `client/.env` and `server/.env` to point at your deployed backend and frontend hosts.

### SQA Smoke Test
A new automated smoke test is available at `project/sqa-smoke-test.js`.

Run it from the project root:
```bash
cd project
npm test
```

This performs:
- root health check
- admin login
- team member retrieval
- task listing
- AI suggestion endpoint validation
- task create/update/delete lifecycle
- token refresh validation
- role-based admin access restriction check

Latest SQA smoke test execution completed successfully against the current running backend.

---

---

## 5. Deployment Checklist

### Required environment variables

#### `server/.env`
- `PORT` — backend port
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — access token secret
- `JWT_REFRESH_SECRET` — refresh token secret
- `OPENAI_API_KEY` — OpenAI API key
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `NODE_ENV` — environment mode

#### `client/.env`
- `VITE_API_URL` — `http://localhost:5000/api` or production API URL
- `VITE_SOCKET_URL` — backend socket host
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID

### Production readiness notes
- `server/index.js` currently allows `origin: '*'` in CORS. In production, tighten this to the actual deployed frontend origin.
- Ensure the backend port and `VITE_API_URL` are correct for your environment.
- Deploy the built frontend static assets to a static host or serve them from the backend.
- Confirm that MongoDB is reachable from the deployed backend.

---

## 6. Debugging and Testing Report

### Code validation results
- `client/src/services/api.js` — no diagnostics errors found
- `server/src/index.js` — no diagnostics errors found
- `server/src/config/db.js` — no diagnostics errors found

The core startup, auth, and API request flow code is syntactically valid.

### Current test coverage status
- No unit or integration tests are present in the repository.
- `server/package.json` currently has a placeholder test script:
  - `npm test` prints an error and exits

### Recommended test and debugging steps
1. Run frontend build locally:
   - `cd client && npm run build`
2. Run backend in development mode:
   - `cd server && npm run dev`
3. Manually exercise these flows:
   - register/login
   - create/edit tasks
   - assign tasks and view notifications
   - access admin panel as admin
4. Use browser console / network tab to verify API calls and socket connections.
5. Add tests later with Jest or Vitest for frontend and Mocha/Jest for backend.

---

## 7. Architecture Map

### User-facing pages
- `Login.jsx` — sign in page
- `Register.jsx` — new account registration
- `Dashboard.jsx` — summary charts and quick stats
- `TaskList.jsx` — task creation, filtering, and updates
- `AdminPanel.jsx` — admin user management and audit logs

### Shared UI components
- `Layout.jsx` — shell, nav menu, page container
- `ProtectedRoute.jsx` — route guard for authenticated access
- `ErrorBoundary.jsx` — catches runtime UI errors

### Context providers
- `AuthContext.jsx` — current user, auth state, login/logout, token storage
- `TaskContext.jsx` — task list state, fetch/update tasks
- `ThemeContext.jsx` — theme mode state

### API and backend flow
- Frontend calls `/api/auth`, `/api/tasks`, `/api/admin`, `/api/reports`
- `api.js` attaches JWT access tokens and refreshes them automatically
- Backend validates auth with JWT middleware
- AI suggestions use OpenAI from `server/src/services/aiService.js`
- `server/src/services/socket.js` emits real-time events to the client

---

## 8. Deployment Recommendation

This project is structured for immediate local deployment, with the following final steps:
- set `.env` values for production
- build frontend with `npm run build`
- host built frontend assets and backend together or separately
- use `npm start` on the backend
- secure CORS origins and secrets

If you want, I can also generate a single `deploy.sh`/`deploy.ps1` script or add a `production` profile for this repo.

---

## 9. Recent Changes (Admin user creation & frontend id normalization)

Summary:
- Added an admin-only API endpoint to create users/managers: `POST /api/admin/users`.
- Added a Create User form in the admin UI so administrators can create users, managers, or admins directly from the [AdminPanel](client/src/pages/AdminPanel.jsx#L1).
- Normalized frontend handling of user identifiers so components accept either `id` or `_id` from API responses and the socket registration uses the normalized id value.

Server-side details:
- New controller function: `createUser` in [server/src/controllers/adminController.js](server/src/controllers/adminController.js#L1) — accepts `{ name, email, password?, role? }`, validates values, creates the user, and writes an audit log.
- New route: `POST /api/admin/users` (see [server/src/routes/adminRoutes.js](server/src/routes/adminRoutes.js#L1)). Requires an authenticated admin user.

Frontend details:
- AdminPanel now contains a compact `Create User` form allowing admins to supply `name`, `email`, optional `password`, and select a `role` (user, manager, admin). The form posts to `/api/admin/users` and prepends the created user to the local users list.
- `TaskContext` and other parts that previously referenced `user.id` now use `user._id || user.id` when registering the socket and comparing identity to avoid mismatches from different API responses.

How to add a new user or manager (Admin UI):
1. Start the backend and frontend (see Section 4 for commands).
2. Log in as an admin account (seeded demo admin credentials available in the `Login` page demo box).
3. Navigate to the Administration panel (`/admin`).
4. Use the top Create User form to enter `Name`, `Email`, optional `Password`, and choose `Role`. Submit to create the account.

How to add a new user or manager (API):
1. Make an authenticated `POST` request to the admin endpoint with an admin access token in `Authorization: Bearer <token>` header.

Request example (curl):
```bash
curl -X POST "http://localhost:5000/api/admin/users" \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
   -d '{"name":"Sam Taylor","email":"sam@example.com","password":"pass123","role":"manager"}'
```

Response example:
```json
{
   "success": true,
   "data": { "id": "64f3a...", "name": "Sam Taylor", "email": "sam@example.com", "role": "manager", "isActive": true },
   "message": "User created successfully"
}
```

Notes about identifier normalization:
- The backend returns `id` for some auth endpoints and `_id` for Mongoose query results. The frontend now tolerates both shapes (`user._id || user.id`) and will use whichever is present for socket registration and admin identity checks. This prevents issues where the active user's id is stored under `id` but other lists contain `_id` fields.

Testing & verification performed:
- Ran `client` unit tests (Vitest) — protected-route tests pass.
- Ran `server` tests (Vitest & in-memory MongoDB fallback) — API suite passed after changes.

Next steps (optional):
- Add email invitation flow for admin-created users (send temporary password or invite link).
- Add backend validation to prevent admins creating `admin` roles via public registration (already restricted to admin API).
- Expand tests to cover the new `POST /api/admin/users` controller.

Email invite flow (implemented):
- When an administrator creates a new user via `POST /api/admin/users` and omits the `password` field, the server now generates a secure temporary password and emails it to the new user using SMTP. The temporary password is set on the account so the user can sign in immediately and is expected to change their password in profile settings.
- Email configuration (add to server `.env`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and `FRONTEND_URL`.
- If SMTP is not configured, the server uses a safe stub transport (no external email is sent) so local testing and CI remain deterministic.

Security note:
- Temporary passwords are automatically hashed by the Mongoose pre-save hook. Consider implementing a one-time token reset flow for production instead of sending plain temporary passwords.

---

If you'd like, I can now:
- add API tests for the new admin create-user endpoint,
- implement email invite flows, or
- add a small PR-ready changelog entry and version bump.
