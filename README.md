# Attendance Management Module

A full-stack, multi-tenant attendance system: employees clock in, HR and admins govern the company, and a platform super admin manages organizations. Built with **React (Vite)**, **Node.js / Express**, **PostgreSQL (Prisma)**, and **Tailwind CSS**.

## Role hierarchy (top → bottom)

Access is **scoped by company**, except the platform **Super Admin**, who operates across all companies.

| Order | Role        | Scope        | Purpose |
|------|-------------|--------------|---------|
| 1    | **Super Admin** | Platform   | Onboard and oversee companies, cross-company visibility, audit. |
| 2    | **Admin**       | One company| Users, roles (within the company), settings, company attendance. |
| 3    | **HR**          | One company| Correction workflow, team attendance, dashboard metrics. |
| 4    | **Employee**    | Self         | Check-in/out, history, correction requests. |

## Features by role

### 1. Super Admin (platform owner)

- Create and manage **companies** (multi-tenant)
- **Cross-company** views and platform-level operations
- **Audit logs** for compliance and traceability
- Onboard the first admins per company (per your product rules / seed)

### 2. Admin (company)

- **User management**: create, update, activate/deactivate
- **Role assignment** for the company: Employee, HR, Admin
- **Company settings** (e.g. work hours, grace period, timezone)
- **Attendance**: view and adjust records for the company

### 3. HR (company)

- **Dashboard**: attendance and chart-friendly summaries
- **Correction requests**: review, approve/reject with remarks; approved changes can update attendance
- **Company attendance** views and filters

### 4. Employee

- **Check-in / check-out** with time tracking
- **Attendance history**
- **Correction requests** (missed or wrong in/out) and request status
- **Quick links** to history and corrections from the home dashboard

## Tech stack

| Layer    | Technology |
|----------|------------|
| API      | Node.js, Express, Prisma, PostgreSQL, JWT, Zod |
| Web app  | React 18, Vite, React Router, Tailwind CSS, Axios |
| Security | Helmet, CORS, rate limiting, bcrypt password hashing |

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ (or use Docker — see below)

## Local development

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` (at minimum `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`).

```bash
npx prisma migrate dev
# If you have no migration history yet, you can use: npx prisma db push
npm run seed
npm run dev
```

The API runs at **http://localhost:5000** (or the port in `PORT`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at **http://localhost:5173** and proxies `/api` to the backend (see `vite.config.js`).

## Docker (optional)

From the project root, with **Docker Desktop** running:

```bash
docker compose up --build
```

- **UI + proxied API**: http://localhost  
- **API only**: http://localhost:5000  
- **PostgreSQL**: `localhost:5432` (see `docker-compose.yml` for default credentials)

Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (env file or host environment) before any real deployment.

## Deploying the frontend (Netlify, Vercel, static hosting)

Netlify only serves **static files**. There is **no** `/api` on `*.netlify.app`, so requests to `/api/auth/login` return **404** unless you point the app at a real API (see `VITE_API_BASE_URL` below).

### Netlify

**SPA routing (refresh on `/login`, etc.):** **`frontend/netlify.toml`** declares a single rewrite: `/*` → `/index.html` with status **200**, so you do not need to configure redirects in the Netlify UI. Keep **Base directory** set to **`frontend`** so this file is picked up with your build.

Configure in **Site configuration → Build & deploy → Build settings** (or equivalent):

| Setting | Example |
|--------|---------|
| **Base directory** | `frontend` or `./frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `frontend/dist` or `./frontend/dist` (must match your layout; with base `frontend`, some setups use `dist` only) |
| **Node.js** (dependency management) | e.g. `22.x` (matches the default or set explicitly) |

In **Environment variables** (for the build, not only “runtime”): set **`VITE_API_BASE_URL`** to your API server, e.g. `https://your-app.onrender.com` (origin only is fine; the app adds `/api`) or `https://your-app.onrender.com/api` explicitly. Then **redeploy** so Vite bakes it in at build time.

If you are **not** using Netlify Functions, you can clear **Functions directory** in the UI or point it to an empty/unused path so the project does not need `frontend/netlify/functions`.

1. **Host the Node API** somewhere with a public URL (this repo’s `backend/`).
2. Set **`VITE_API_BASE_URL`** in Netlify (build context) as above; **redeploy** after any change.
3. On the API, set **`CORS_ORIGIN`** to your site origin(s), comma-separated, e.g. `https://your-app.netlify.app,http://localhost:5173`

Details: `frontend/.env.example`.

## Sample credentials (after seed)

Use these in the same order as roles (Super Admin → Admin → HR → Employee).

| # | Role        | Email                 | Password  |
|---|-------------|------------------------|-----------|
| 1 | Super Admin | `superadmin@platform.com` | `super123` |
| 2 | Admin       | `admin@company.com`   | `admin123`  |
| 3 | HR          | `hr@company.com`      | `hr123`     |
| 4 | Employee    | `john@company.com`    | `emp123`    |
| 5 | Employee    | `jane@company.com`    | `emp123`    |

## Project structure

```
Attendance Module/
├── backend/                 # Express API, Prisma, JWT auth
│   ├── prisma/            # schema (and migrations when added)
│   └── src/               # routes, controllers, services, middleware
├── frontend/              # Vite + React SPA
│   └── src/               # pages (by role), components, services
├── docker-compose.yml     # postgres + backend + frontend
└── README.md
```

## API overview (grouped by role)

Base URL: `/api`. Rate limiting applies under `/api/`.

### Super Admin

- `GET` / `POST` `/api/superadmin/companies` — list / create companies  
- `GET` / `PATCH` `/api/superadmin/companies/:id` — get / update company  
- `GET` `/api/superadmin/companies/:id/users` — list users in a company  
- `GET` `/api/superadmin/companies/:id/attendance` — attendance for a company  
- `GET` `/api/superadmin/audit-logs` — platform audit log  

### Admin

- `GET    /api/admin/users` — list users  
- `POST   /api/admin/users` — create user  
- `PATCH  /api/admin/users/:id` — update user  
- `GET    /api/admin/settings` / `PATCH /api/admin/settings` — company settings  
- `GET    /api/admin/attendance` — company attendance  

### HR

- `GET  /api/hr/dashboard` — HR dashboard metrics  
- `GET  /api/hr/attendance` — filtered company attendance  
- `GET` / `POST` `/api/hr/employees` — list / add employees; `DELETE /api/hr/employees/:id` — deactivate  
- `GET  /api/hr/pending-requests` / `GET /api/hr/requests` — correction queue  
- `POST /api/hr/requests/:id/review` — approve / reject with remarks  

### Auth & attendance (all authenticated users; employees use these most)

- `POST /api/auth/login` · `POST /api/auth/refresh` · `POST /api/auth/logout`  
- `GET  /api/auth/profile`  
- `POST /api/attendance/check-in` · `POST /api/attendance/check-out`  
- `GET  /api/attendance/today` · `GET /api/attendance/history`  
- `POST /api/corrections` — create correction request  
- `GET  /api/corrections/my-requests` — my requests  

## Security & quality

- **JWT** access + refresh tokens; axios interceptor refresh flow on the client  
- **RBAC** enforced per route; company isolation for Admin / HR / Employee  
- **Input validation** (Zod), **Prisma** for safe SQL, **Helmet** + **CORS** + **rate limits** on the API  

Deeper design notes: [ARCHITECTURE.md](ARCHITECTURE.md)

## License

MIT
