# Employee Management System (MERN)

A full-stack Employee Management System with **role-based access control** (Admin / Employee), built with the MERN stack.

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 4, React Router 6, Axios, react-hot-toast |
| Backend | Node.js, Express 4, express-validator, helmet, cors, rate-limit |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt (bcryptjs) |
| Testing | Postman (see `docs/POSTMAN_GUIDE.md`) |

## Features

**Authentication & security**
- Signup / login with client-side **and** server-side validation
- Passwords hashed with bcrypt (12 salt rounds), never returned by the API
- JWT auth; logout and password change **invalidate old tokens** (`tokenVersion`)
- Public signup can only create **employees**. Only an admin can create another admin
- Separate `protect` (authentication) and `authorize` (role) middleware, enforced on the backend
- Rate limiting on login/signup, `helmet` headers, JSON body size limit, NoSQL-injection-safe filters
- Inactive / terminated accounts cannot log in or use existing tokens

**Admin**
- Dashboard: total / active employees, on-leave counts, employees per department, recent additions
- Add, view, edit, delete (with confirmation) employees
- Searchable + filterable + paginated table (name/email/phone, department, status, role)
- Inline status updates; manage departments and their designations
- Safety rules: admins can't delete, demote or deactivate themselves; departments with employees can't be deleted

**Employee**
- Own dashboard: department, designation, joining date, status
- Edit only personal info (name, phone, address); change password securely
- Cannot reach admin pages or other employees' data (blocked in UI **and** API)

## Project structure

```
employee-management-system/
├── backend/
│   ├── config/db.js                 # MongoDB connection
│   ├── controllers/                 # Business logic (auth, employee, department, dashboard)
│   ├── middleware/                  # auth.js (protect/authorize), validators, validate, error handler
│   ├── models/                      # Employee.js, Department.js (Mongoose schemas)
│   ├── routes/                      # URL -> middleware -> controller wiring
│   ├── seed/createAdmin.js          # Creates the first admin
│   ├── utils/                       # ApiError, asyncHandler, generateToken, constants
│   ├── app.js                       # Express app (middleware + routes)
│   ├── server.js                    # Loads .env, connects DB, starts server
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/axios.js             # Axios instance + token interceptor
│   │   ├── context/AuthContext.jsx  # Global login state
│   │   ├── components/              # Layout, ProtectedRoute, Modal, StatusBadge, ...
│   │   ├── pages/                   # Login, Signup, Profile, admin/*, employee/*
│   │   ├── utils/                   # helpers + validators
│   │   ├── App.jsx                  # Route table
│   │   └── main.jsx
│   └── .env.example
├── docs/                            # Postman guide, deployment guide, interview Q&A
└── .gitignore
```

## How the pieces talk to each other

```
React page --(axios + "Authorization: Bearer <JWT>")--> Express route
   -> protect (verify JWT, load user) -> authorize('admin') -> validators -> controller -> Mongoose -> MongoDB Atlas
   <-- JSON { success, message, data } <-- errorHandler (central) <--
```

## Setup (step by step)

### 0. Prerequisites
Node.js 18+ (`node -v`), Git, a free [MongoDB Atlas](https://www.mongodb.com/atlas) account, and [Postman](https://www.postman.com/downloads/).

### 1. MongoDB Atlas
1. Create a free **M0** cluster.
2. **Database Access** -> add a database user (username + password).
3. **Network Access** -> add your current IP (use `0.0.0.0/0` only temporarily, e.g. for deployment).
4. **Connect -> Drivers** -> copy the connection string and put your database name before the `?`, e.g. `.../employee_management?retryWrites=true&w=majority`.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```
Edit `.env`: set `MONGO_URI`, a long random `JWT_SECRET`, and the `ADMIN_*` values. Then:
```bash
npm run seed:admin          # creates your first admin account
npm run dev                 # starts API on http://localhost:5000
```
**Test it:** open http://localhost:5000/api/health - you should see `{"success":true,"message":"API is running"}`.
Then follow `docs/POSTMAN_GUIDE.md` to test login and the protected routes.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # http://localhost:5173
```
**Test it:**
1. Log in with the admin email/password from your backend `.env`.
2. Create a department (with designations), then add an employee.
3. Log out, log in as that employee: you should land on the Employee dashboard and be unable to open `/admin`.
4. Sign up a new account on `/signup` - it will always be an Employee.

## Environment variables

`backend/.env`

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | Secret used to sign tokens - keep private |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d` |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS |
| `ADMIN_*` | Used only by the seed script |

`frontend/.env`

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the API, e.g. `http://localhost:5000/api` |

## API summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Create an employee account |
| POST | `/api/auth/login` | Public | Log in, returns JWT |
| POST | `/api/auth/logout` | Logged in | Invalidate current tokens |
| GET | `/api/auth/me` | Logged in | Current user profile |
| PUT | `/api/auth/me` | Logged in | Update own name/phone/address |
| PUT | `/api/auth/change-password` | Logged in | Change own password |
| GET | `/api/employees` | Admin | List with `search`, `department`, `status`, `role`, `page`, `limit` |
| POST | `/api/employees` | Admin | Create employee/admin |
| GET | `/api/employees/:id` | Admin | Employee details |
| PUT | `/api/employees/:id` | Admin | Update employee |
| PATCH | `/api/employees/:id/status` | Admin | Update status |
| DELETE | `/api/employees/:id` | Admin | Delete employee |
| GET/POST | `/api/departments` | Admin | List / create departments |
| PUT/DELETE | `/api/departments/:id` | Admin | Update / delete department |
| GET | `/api/dashboard/stats` | Admin | Dashboard statistics |

## Push to GitHub

```bash
cd employee-management-system
git init
git add .
git status                  # CHECK: .env and node_modules must NOT be listed
git commit -m "Initial commit: Employee Management System"
git branch -M main
```
Create an **empty** repository on github.com (no README/.gitignore), then:
```bash
git remote add origin https://github.com/<your-username>/employee-management-system.git
git push -u origin main
```
If you ever committed `.env` by mistake: **rotate** your Atlas password and `JWT_SECRET` immediately - deleting the file later does not remove it from Git history.

## Deployment
See `docs/DEPLOYMENT.md` (MongoDB Atlas + Render for the API + Vercel/Netlify for the frontend).

## Ideas to extend (good talking points)
Refresh tokens + httpOnly cookies, email password reset, leave requests, attendance, profile photo upload, unit/integration tests with Jest + Supertest, Docker.
