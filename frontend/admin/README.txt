SSMS ADMIN DASHBOARD PACKAGE
============================

FILES
frontend/admin-dashboard.html
frontend/admin/admin-timetable.html
frontend/admin/admin-users.html
frontend/admin/admin-system.html
frontend/admin/admin-invitations.html
frontend/admin/admin-student-attendance.html
frontend/admin/admin-lecturer-attendance.html
frontend/admin/admin-support.html
frontend/css/admin.css
frontend/js/admin.js

HOW TO INSTALL
1. Unzip this package.
2. Copy the CONTENTS of its frontend folder into the existing project's frontend folder.
3. Do not replace or delete your existing login.html.
4. Start the existing Express backend on port 8000.
5. Sign in as an admin using your existing login flow.
6. Open frontend/admin-dashboard.html through your normal frontend server.
7. Later, add the "View Dashboard" button to login.html. The correct target is admin-dashboard.html (relative to login.html).

IMPORTANT
- The design uses actual localStorage user/token from your existing login.
- Creating student/lecturer accounts uses POST http://localhost:8000/api/v1/users/accounts with your existing verifyAdmin middleware.
- Other modules are UI previews until their corresponding backend routes, MySQL tables and access controls are implemented.
- Browser-local drafts/settings/notes are not database records.
- No example student attendance, counts, support tickets, service statuses or invitation delivery is presented as live data.
- Your login response currently returns only user_id/email/role, so the admin header displays the email prefix unless you later add an admin profile endpoint.
- You can adapt these files to your own actual database fields and admin routes later.
