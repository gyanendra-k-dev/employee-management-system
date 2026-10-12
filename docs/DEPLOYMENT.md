# Deployment Guide

Free-tier friendly setup: **MongoDB Atlas** (database) + **Render** (backend API) + **Vercel** or **Netlify** (frontend).
Deploy in this order: database -> backend -> frontend -> update CORS.

## 1. MongoDB Atlas (production database)
1. Use your existing free cluster (or create a new one for production).
2. **Database Access:** create a dedicated user with a strong password and "Read and write to any database" (or restrict to your database).
3. **Network Access:** Render uses changing IPs on the free tier, so add `0.0.0.0/0` (allow from anywhere). This is acceptable **only** because the database requires a strong user/password; tighten it if your host offers static IPs.
4. Copy the connection string (with the `employee_management` database name) - you will paste it into Render as `MONGO_URI`.

## 2. Backend on Render
1. Push the project to GitHub (see README).
2. Render -> **New -> Web Service** -> connect the repo.
3. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Environment variables** (Render -> Environment):
   - `NODE_ENV` = `production`
   - `MONGO_URI` = your Atlas string
   - `JWT_SECRET` = a **new** long random value (not the one from development)
   - `JWT_EXPIRES_IN` = `1d`
   - `CLIENT_URL` = *(set after step 3; temporarily `http://localhost:5173`)*
5. Deploy. Test `https://<your-api>.onrender.com/api/health`.
6. Create the first production admin: Render -> your service -> **Shell**, run
   `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=StrongPass123 ADMIN_NAME="Your Name" npm run seed:admin`
   (Or run `npm run seed:admin` **locally** with `MONGO_URI` pointing at the production database, then switch back.) Change the password right after your first login.

> Free Render services sleep after inactivity; the first request can take ~30-60 seconds. Mention this in your README so recruiters aren't surprised.

## 3. Frontend on Vercel (or Netlify)
**Vercel:** New Project -> import the repo ->
- **Root Directory:** `frontend`
- **Framework Preset:** Vite (build `npm run build`, output `dist`)
- **Environment Variable:** `VITE_API_URL` = `https://<your-api>.onrender.com/api`
- Deploy. `frontend/vercel.json` makes page refreshes work with React Router.

**Netlify:** New site from Git -> base directory `frontend`, build command `npm run build`, publish directory `frontend/dist`, env var `VITE_API_URL`. `frontend/public/_redirects` handles React Router refreshes.

> `VITE_*` variables are baked in at **build time**. If you change `VITE_API_URL`, redeploy the frontend.

## 4. Connect them (CORS)
Copy your frontend URL (e.g. `https://ems-demo.vercel.app`, no trailing slash) into Render's `CLIENT_URL`, then redeploy the backend. For several origins, separate them with commas.

## 5. Production checklist
- [ ] `.env` is not in GitHub (`git ls-files | grep .env` shows only `.env.example`)
- [ ] Production `JWT_SECRET` differs from development
- [ ] Atlas user has a strong password
- [ ] Logged in on the live site, created an employee, tested the Employee login
- [ ] Opening `/admin` as an employee redirects away, and the API returns 403
- [ ] README has the live URLs and a demo admin login (use a throwaway demo account, never your real one)

## Troubleshooting
| Problem | Fix |
|---|---|
| CORS error in browser console | `CLIENT_URL` must exactly match the frontend origin (https, no trailing slash) |
| 404 when refreshing a page on the live site | Missing SPA rewrite (`vercel.json` / `_redirects`) |
| `MongooseServerSelectionError` | Atlas Network Access doesn't allow the host, or the password has unencoded special characters |
| Login works locally but not live | `VITE_API_URL` not set at build time; redeploy the frontend |
| First request very slow | Free Render instance was asleep |
