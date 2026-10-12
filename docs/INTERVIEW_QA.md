# Interview Questions & Answers (based on this project)

## Project overview
**Q1. Describe your project in 30 seconds.**
A MERN Employee Management System with two roles. Admins manage employees and departments through a dashboard with search, filters and statistics. Employees see only their own profile and can update limited personal details and their password. Security is enforced on the backend with JWT authentication, bcrypt password hashing, role-based middleware and request validation.

**Q2. Why did you choose this stack?**
React gives reusable components and fast UI updates, Vite gives quick builds, Tailwind speeds up consistent styling, Express is minimal and flexible, and MongoDB's document model fits employee records. JavaScript across the whole stack lets me share knowledge between frontend and backend.

**Q3. Walk me through what happens when an admin opens the Employees page.**
React Router renders `Employees`, which calls `GET /api/employees` through my Axios instance (it adds `Authorization: Bearer <token>`). On the server: `protect` verifies the JWT and loads the user, `authorize('admin')` checks the role, the controller builds a Mongoose filter from the query string, queries MongoDB with pagination, and returns JSON. React stores it in state and renders the table.

## Authentication & security
**Q4. How does JWT authentication work here?**
On login the server verifies the password and signs a token containing the user id and a `tokenVersion`. The client stores it and sends it in the `Authorization` header. The `protect` middleware verifies the signature and expiry, loads the user, and compares `tokenVersion`.

**Q5. How do you store passwords?**
Hashed with bcrypt (12 salt rounds) in a Mongoose `pre('save')` hook that runs only when the password changed. The field has `select: false` and is stripped in `toJSON`, so it is never returned by queries or responses. Plain-text passwords are never stored or logged.

**Q6. What's the difference between hashing and encryption?**
Hashing is one-way (you can't recover the original); encryption is two-way with a key. Passwords should be hashed. bcrypt is deliberately slow and adds a random salt, which defeats rainbow tables and slows brute force.

**Q7. Authentication vs authorization?**
Authentication = who are you (`protect`: valid token -> `req.user`). Authorization = what may you do (`authorize('admin')`: role check). They're separate middleware, so routes combine them as needed.

**Q8. Why enforce roles on the backend and not just hide admin pages in React?**
Frontend code runs in the user's browser and can be modified; anyone can call the API with Postman or curl. The React route guard is only UX. The real security is `authorize('admin')` on every admin route. I tested this in Postman: an employee token gets 403 on every admin endpoint.

**Q9. How did you stop a user from signing up as admin?**
The signup controller ignores any `role` in the request body and always creates `role: 'employee'`. Admins are created either by the seed script (first admin) or by an existing admin through the protected `POST /api/employees`. I tested "role injection" in Postman.

**Q10. JWTs are stateless. How did you implement logout?**
Each user has a `tokenVersion` stored in the database and embedded in the token. Logout (and password change) increments it, so older tokens fail the version check in `protect`. The trade-off is one extra DB lookup per request, which I already do to load the user.

**Q11. Where do you store the JWT on the client, and what are the risks?**
In `localStorage` for simplicity. The risk is XSS: injected script could read it. React escapes output by default, which helps. A more secure production approach is an httpOnly, secure, SameSite cookie plus a refresh-token flow (which also needs CSRF protection). I'd list that as a next improvement.

**Q12. What other security measures did you add?**
`helmet` security headers, CORS restricted to my frontend origin, rate limiting on login/signup, JSON body size limit, input validation with express-validator, Mongoose schema validation, a generic "Invalid email or password" message (no user enumeration), regex escaping in search, type checks on query params to prevent NoSQL injection, and `.env` kept out of Git.

**Q13. What is NoSQL injection?**
Sending operators like `{"$ne": ""}` where a string is expected, e.g. `?status[$ne]=x`, to alter a query. I only accept string values for filters and check them against allowed lists / ObjectId format.

**Q14. What is CORS and why did you need it?**
Browsers block a page from one origin (localhost:5173) calling an API on another (localhost:5000) unless the API allows it via CORS headers. The `cors` middleware only allows the origins in `CLIENT_URL`.

## Backend
**Q15. Explain your folder structure.**
Routes map URLs to middleware and controllers. Controllers hold business logic. Models define schemas. Middleware holds reusable cross-cutting logic (auth, validation, errors). Utils hold helpers. `app.js` configures Express and `server.js` starts it. Separating them keeps code testable and readable.

**Q16. How do you handle errors?**
Controllers are wrapped in `asyncHandler`, which forwards rejected promises to Express. A central `errorHandler` converts Mongoose validation errors, duplicate keys (11000 -> 409), bad ObjectIds (CastError -> 400) and JWT errors (401) into consistent JSON with the right status code, and hides internal details in production.

**Q17. Which HTTP status codes did you use and why?**
200 OK, 201 created, 400 validation error, 401 not authenticated, 403 authenticated but forbidden, 404 not found, 409 duplicate email / department in use, 429 rate limited, 500 unexpected error.

**Q18. How is the unique email enforced?**
`unique: true` creates a MongoDB unique index, which is the real guarantee even under race conditions. The controller also checks first for a friendly message, and the error handler maps the 11000 error to a 409 as a fallback.

**Q19. How does search/filter/pagination work?**
The controller builds a filter object: a case-insensitive regex across name/email/phone/designation for `search`, plus exact matches for department/status/role. Then `skip((page-1)*limit).limit(limit)` with `countDocuments` for totals. The frontend debounces typing by 400 ms to avoid a request on every keystroke.

**Q20. Why `populate` for department? Why a separate Department model?**
Departments are reusable and have their own data (designations). Storing a reference (ObjectId) avoids spelling inconsistencies and lets admin rename a department once. `populate('department','name')` swaps the id for the name in responses. The dashboard uses an aggregation with `$group` and `$lookup` for per-department counts.

**Q21. Why `bcryptjs` instead of `bcrypt`?**
It's a pure-JavaScript implementation of the same algorithm and avoids native build problems on some Windows/CI setups. `bcrypt` is faster but both are secure and API-compatible.

## Frontend
**Q22. How does your protected routing work?**
`ProtectedRoute` reads the user from `AuthContext`; if there's none it redirects to `/login`, and if `roles` doesn't include the user's role it redirects to their own dashboard. It's used as a layout route wrapping children via `<Outlet />`.

**Q23. How do you keep the user logged in after a refresh?**
The token stays in localStorage. On app load, `AuthProvider` calls `GET /auth/me`; while that runs, `loading` is true so routes show a spinner instead of redirecting wrongly.

**Q24. What does the Axios interceptor do?**
The request interceptor attaches the token to every call. The response interceptor catches 401s, clears the token and redirects to login, so expired sessions are handled in one place.

**Q25. How did you handle forms and validation?**
Controlled components with a shared `FormField`, client-side validation for instant feedback, and server error messages displayed on submit. Client validation is for UX only - the backend validates everything again.

**Q26. How did you avoid stale data from slow responses?**
In the employees list, each `useEffect` has an `ignore` flag set in the cleanup function, so an older, slower response can't overwrite the results of a newer search.

## Design decisions & improvements
**Q27. What business rules protect data integrity?**
Admins can't delete/demote/deactivate themselves (prevents lockout), departments with employees can't be deleted, inactive/terminated users can't log in, and employees can only update name/phone/address through a whitelist of fields.

**Q28. What would you improve with more time?**
Refresh tokens + httpOnly cookies, email-based password reset, audit logs, automated tests (Jest + Supertest, React Testing Library), file upload for profile photos, leave/attendance modules, Docker + CI/CD.

**Q29. How would you test this?**
Manually with Postman (auth, authorization, CRUD, error cases - see the guide). For automation: Jest + Supertest with an in-memory MongoDB for API tests, and React Testing Library for components.

**Q30. What was the hardest part?**
Suggested answer: designing authorization so the same endpoints are safe - e.g. making sure an employee can't escalate their role through the profile endpoint (solved with field whitelisting) and invalidating JWTs on logout (solved with `tokenVersion`).
