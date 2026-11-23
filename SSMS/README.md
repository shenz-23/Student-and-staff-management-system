# SSMS integrated project — reviewed build

## Setup
1. Install Node.js 20+ and MySQL 8+.
2. Import `backend/database/schema.sql` into a NEW database (it creates `SSM_DB`).
3. Optionally import `backend/database/dataadd.sql` for sample people and courses (only once; sample records have NO login credentials).
4. Import `backend/database/migration.sql` after the base schema. If your existing database already contains tables, **back it up first**, then run ONLY the migration (not the base schema or sample seed).
5. In `backend`, copy `.env.example` to `.env` and configure MySQL and a strong JWT secret.
6. In `backend`, run `npm install` and `npm start`.
7. Open `frontend/login.html` with VS Code Live Server (port 5500).
8. Verify `http://localhost:8000/api/health` returns `{ "status": "ok" }`.

## IMPORTANT: Existing accounts
The sample SQL only inserts names. You must create a real admin email and bcrypt password hash using an authorized provisioning process before you can log in. Do not store plaintext passwords. Existing user records may lack email and passwords.

## Verified by static checks
Backend JavaScript syntax, route-to-controller exports, frontend JavaScript syntax and local HTML asset paths. Database integration and browser workflows need testing against your local MySQL data and actual role accounts.

## Known unfinished features
Many lecturer/admin actions in the supplied mockups are still marked `data-demo` and are not database operations. Student submission UI remains a preview; a secure upload handler and file storage are not implemented. Grades, attendance, tests, online lectures, invitations, and feedback require new data models and complete API/UI integration. Do not represent them as working features. The supplied schema lacks the required entities for most of these workflows.
