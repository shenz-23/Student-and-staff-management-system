# Lecturer Portal — SSMS

Copy the HTML files into your existing `frontend/` directory. Copy `css/lecturer.css` into `frontend/css/` and `js/lecturer.js` into `frontend/js/`.

**Keep your existing `login.html` and `js/login.js`.** Your login already redirects lecturers to `staff-dashboard.html`.

Pages: staff-dashboard.html, lecturer-timetable.html, lecturer-materials.html, lecturer-assessments.html, lecturer-lectures.html, lecturer-submissions.html, lecturer-provide-feedback.html, lecturer-student-feedback.html, lecturer-grades.html.

Start the backend on `http://localhost:8000` and open your existing login via Live Server. The profile uses GET `/api/v1/users/lecturer/dashboard` and the student list uses GET `/api/v1/users/students` with the existing JWT token.

**Important:** All other metrics and actions are previews until you implement their backend APIs. The illustrative timetable is not real class data. Buttons explain that actions are not yet connected; they do not claim to publish or save. Live lecture is a visual mockup, not a video call. Do not use the illustrative grade bands as official policy without checking.

Your original login page is intentionally not replaced.
