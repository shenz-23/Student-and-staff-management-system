# SSMS Student Portal — HTML/CSS/JS

## Files
- `student-login.html`: student login
- `student-dashboard.html`: student overview
- `student-timetable.html`: timetable and notifications
- `student-materials.html`: study materials
- `student-assignments.html`: assignments
- `student-tests.html`: online tests
- `student-feedback.html`: lecturer feedback
- `student-grades.html`: grades
- `student-attendance.html`: attendance
- `css/student.css`: shared styles
- `js/student.js`: shared interactions and API calls

## Installation
1. Back up your existing frontend files before replacing anything.
2. Copy these files into your existing `frontend/` folder (do not touch `backend/` or `database/`).
3. In `js/student.js`, set `API_URL` to your Express server, currently `http://localhost:8000/api/v1/users`.
4. Make your existing role-based login redirect student users to `student-dashboard.html`, or use `student-login.html` to sign in directly.
5. Open `student-login.html` with VS Code Live Server. Sign in with a real student account.
6. If your existing backend returns `data.student` and `data.courses` from `/student/dashboard`, the overview will show real student name and courses.

## Backend integration
Already connected:
- `POST /api/v1/users/login` with `{role:'student',email,password}`
- `GET /api/v1/users/student/dashboard` with `Authorization: Bearer <token>`

Not connected yet: timetable, notifications, study-material downloads, assignments, tests, feedback, grades and attendance. Their pages are functional frontend previews only; forms explicitly do not send data to the server. Drafts are stored only in browser localStorage. Illustrative timetable/material rows are labeled as samples. Do not treat them as student data.

## Important notes
- Login uses email because your existing backend login accepts `email`, not a student ID. To support student ID login, the backend must be updated separately.
- The campus photo is cropped from your screenshot; replace `assets/campus.jpg` with the original high-resolution image if available.
- The Figma screenshots are references; this is a responsive recreation, not an automated pixel-perfect Figma export.
- `Remember me` is visual only: token storage follows your existing localStorage pattern.
- Do not commit `.env`, passwords or tokens to Git.
