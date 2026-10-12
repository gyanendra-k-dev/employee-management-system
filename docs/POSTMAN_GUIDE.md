# Postman API Testing Guide

Base URL: `http://localhost:5000/api`. Start the backend first (`npm run dev`) and create the admin (`npm run seed:admin`).

## 0. Set up an environment (saves a lot of typing)
1. Postman -> **Environments** -> New -> name it `EMS Local`.
2. Add variables: `baseUrl` = `http://localhost:5000/api`, `adminToken`, `employeeToken`, `employeeId`, `departmentId` (leave the last four empty).
3. Select the environment (top right). Use `{{baseUrl}}` in URLs.
4. For protected requests: **Authorization** tab -> Type **Bearer Token** -> Token `{{adminToken}}` (or `{{employeeToken}}`).

**Auto-save tokens:** in the *Scripts -> Post-response* tab of the login requests add:
```js
pm.environment.set("adminToken", pm.response.json().token);   // use employeeToken for the employee login
```
All POST/PUT/PATCH bodies: **Body -> raw -> JSON**.

## 1. Authentication tests

| # | Request | Body | Expected |
|---|---|---|---|
| 1 | `GET {{baseUrl}}/health` | - | **200** `API is running` |
| 2 | `POST /auth/login` (admin) | `{"email":"admin@example.com","password":"ChangeMe123"}` | **200**, returns `token` + `user` (no password field) |
| 3 | `POST /auth/login` wrong password | same email, wrong password | **401** `Invalid email or password` |
| 4 | `POST /auth/login` missing password | `{"email":"admin@example.com"}` | **400** `Password is required` |
| 5 | `POST /auth/signup` | `{"fullName":"Riya Sharma","email":"riya@example.com","phone":"9876543210","password":"Riya12345"}` | **201**, `role` is `employee` |
| 6 | `POST /auth/signup` same email again | same body | **409** `already exists` |
| 7 | `POST /auth/signup` weak password | `"password":"abc"` | **400** password message |
| 8 | `POST /auth/signup` **role injection** | add `"role":"admin"` to the body in #5 (new email) | **201** but `role` must still be **employee** |

Save the employee token from #5 into `employeeToken` and `user._id` into `employeeId`.

## 2. Profile tests (any logged-in user)

| # | Request | Expected |
|---|---|---|
| 9 | `GET /auth/me` with employee token | **200**, own profile |
| 10 | `GET /auth/me` with **no** token | **401** |
| 11 | `GET /auth/me` with token `abc` | **401** `Invalid token` |
| 12 | `PUT /auth/me` `{"phone":"9123456780","address":"Noida"}` | **200** updated |
| 13 | `PUT /auth/me` `{"role":"admin","status":"active","email":"x@y.com"}` | **200**, but role/email **unchanged** (ignored) |
| 14 | `PUT /auth/change-password` `{"currentPassword":"wrong","newPassword":"NewPass123"}` | **400** `Current password is incorrect` |
| 15 | `PUT /auth/change-password` `{"currentPassword":"Riya12345","newPassword":"NewPass123"}` | **200**, returns a new `token`; the **old** token now gives **401** |

## 3. Authorization tests (employee token on admin routes)

Use `employeeToken` for all of these - every one must return **403**:

- `GET /employees`
- `POST /employees`
- `GET /employees/{{employeeId}}`
- `DELETE /employees/{{employeeId}}`
- `PATCH /employees/{{employeeId}}/status`
- `GET /departments`
- `GET /dashboard/stats`

Without any token they must return **401**.

## 4. Admin: departments (use `adminToken`)

| # | Request | Expected |
|---|---|---|
| 16 | `POST /departments` `{"name":"Engineering","designations":["Frontend Developer","Backend Developer"]}` | **201** - save `data._id` as `departmentId` |
| 17 | `POST /departments` same name | **409** |
| 18 | `GET /departments` | **200**, each has `employeeCount` |
| 19 | `PUT /departments/{{departmentId}}` `{"designations":["Frontend Developer","QA Engineer"]}` | **200** |
| 20 | `PUT /departments/123` | **400** `Invalid ID` |

## 5. Admin: employee CRUD (use `adminToken`)

| # | Request | Expected |
|---|---|---|
| 21 | `POST /employees` `{"fullName":"Arjun Mehta","email":"arjun@example.com","phone":"9000000001","password":"Arjun12345","department":"{{departmentId}}","designation":"Frontend Developer","role":"employee"}` | **201** |
| 22 | `POST /employees` with an admin role `"role":"admin"` | **201**, `role: admin` (only admins can do this) |
| 23 | `POST /employees` duplicate email | **409** |
| 24 | `POST /employees` bad email `"email":"nope"` | **400** |
| 25 | `POST /employees` bad department id `"department":"000000000000000000000000"` | **400** `does not exist` |
| 26 | `GET /employees` | **200** + `pagination` |
| 27 | `GET /employees?search=arjun` | only matching employees |
| 28 | `GET /employees?status=active&department={{departmentId}}&page=1&limit=5` | filtered list |
| 29 | `GET /employees/{{employeeId}}` | **200** |
| 30 | `GET /employees/000000000000000000000000` | **404** |
| 31 | `PUT /employees/{{employeeId}}` `{"designation":"QA Engineer"}` | **200** |
| 32 | `PATCH /employees/{{employeeId}}/status` `{"status":"on_leave"}` | **200** |
| 33 | `PATCH /employees/{{employeeId}}/status` `{"status":"banana"}` | **400** |
| 34 | `PATCH` status to `inactive`, then log in as that employee | login returns **403** `not active` |
| 35 | `DELETE /employees/<your own admin id>` | **400** `cannot delete your own account` |
| 36 | `PUT /employees/<your own admin id>` `{"role":"employee"}` | **400** `cannot change your own role` |
| 37 | `DELETE /departments/{{departmentId}}` while employees belong to it | **409** |
| 38 | `DELETE /employees/{{employeeId}}` | **200**, then GET gives **404** |
| 39 | `GET /dashboard/stats` | **200** with totals, `byDepartment`, `recentHires` |

## 6. Logout test
1. `POST /auth/logout` with `adminToken` -> **200**.
2. `GET /auth/me` with the same token -> **401** `Session expired` (the token was invalidated).
3. Log in again to get a fresh token.

## 7. Status code cheat sheet
`200` OK - `201` created - `400` validation/bad input - `401` not logged in / bad token - `403` logged in but not allowed - `404` not found - `409` conflict (duplicate) - `429` too many attempts - `500` server error.
