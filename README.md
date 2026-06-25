# AI-Powered Smart Task Management System

A production-ready MERN stack team productivity application with AI auto-categorization, real-time notifications, role-based access control, and admin audit logging.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18+, Vite, Tailwind CSS, Chart.js, Socket.io-client |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas / Mongoose ODM |
| AI | OpenAI GPT-3.5-turbo |
| Auth | JWT (1h access + 7d refresh), Google OAuth |
| Real-time | Socket.io |

## Features

- **AI Task Intelligence** — Auto-suggest category, priority, and one-line summary on task creation
- **Role-Based Access** — User, Manager, Admin roles with protected routes
- **Real-Time Notifications** — Live task assignment/update alerts via Socket.io
- **Dashboard Analytics** — Pie chart (status), bar chart (priority), upcoming deadlines
- **Admin Panel** — User management, role changes, audit log viewer
- **Security** — bcrypt hashing, helmet, CORS, rate limiting (100 req/15 min), express-validator

## Project Structure

```
project/
├── server/
│   └── src/
│       ├── config/       # DB connection, seeder
│       ├── controllers/  # Auth, Task, Admin, Report
│       ├── middleware/   # JWT auth, validation
│       ├── models/       # User, Task, AuditLog
│       ├── routes/       # API route definitions
│       ├── services/     # OpenAI AI service, Socket.io
│       └── utils/        # Audit logger
└── client/
    └── src/
        ├── components/   # Layout, ProtectedRoute, ErrorBoundary
        ├── context/      # Auth, Task, Theme providers
        ├── pages/        # Login, Register, Dashboard, TaskList, AdminPanel
        └── services/     # Axios API client with token refresh
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas URI (or local MongoDB — falls back to in-memory DB for dev)

### 1. Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env with your MONGO_URI, JWT secrets, and OPENAI_API_KEY
npm install
npm run dev
```

Server runs at `http://localhost:5000`

### 2. Frontend Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Client runs at `http://localhost:5173`

## Demo Accounts (Auto-Seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@task.com | admin123 |
| Manager | manager@task.com | manager123 |
| User | user@task.com | user123 |

## API Endpoints

### Auth — `/api/auth`
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Email/password login |
| POST | `/google` | Google OAuth login |
| POST | `/refresh-token` | Refresh JWT access token |
| GET | `/me` | Get current user profile |
| GET | `/team` | List active users for task assignment |

### Tasks — `/api/tasks`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List tasks (filters: status, priority, assignedTo, q) |
| GET | `/:id` | Get single task |
| POST | `/` | Create task (triggers AI) |
| PUT | `/:id` | Update task |
| DELETE | `/:id` | Soft delete (admin/manager) |
| POST | `/ai-suggest` | AI preview without saving |
| POST | `/:id/ai-summary` | Regenerate AI summary |

### Admin — `/api/admin` (Admin only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/users` | List all users |
| PUT | `/users/:id/role` | Update user role/status |
| GET | `/audit-logs` | View audit trail |

### Reports — `/api/reports`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/analytics` | Dashboard chart data |
| GET | `/export/csv` | Export tasks CSV (admin/manager) |

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
NODE_ENV=development
```

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=...
```

## License

ISC
