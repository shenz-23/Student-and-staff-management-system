// SSMS Admin UI: Existing backend endpoints are used where supported.
// Other actions are deliberately labelled as previews until APIs exist.
const API = 'http://localhost:8000/api/v1/users';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const token = localStorage.getItem('token');
let savedUser = {};
try { savedUser = JSON.parse(localStorage.getItem('user') || '{}') || {}; } catch { savedUser = {}; }

function showStatus(message, error = false) {
  const el = $('#statusMessage');
  if (!el) return;
  el.hidden = false;
  el.classList.toggle('error', error);
  el.textContent = message;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function signOut() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  location.href = '../login.html';
}
$('#adminSignout')?.addEventListener('click', e => { e.preventDefault(); signOut(); });
if (!token || savedUser.role !== 'admin') {
  showStatus('Admin sign-in is required. Please sign in with an admin account.', true);
  // Avoid displaying restricted pages to unauthenticated users.
  document.querySelector('.content')?.replaceChildren();
  location.replace('../login.html');
} else {
  const display = [savedUser.firstName, savedUser.lastName].filter(Boolean).join(' ') || savedUser.email?.split('@')[0] || 'Admin';
  $$('[data-admin-name]').forEach(el => el.textContent = display);
  $$('[data-admin-first]').forEach(el => el.textContent = savedUser.firstName || display.split(' ')[0]);
  $$('[data-admin-initials]').forEach(el => el.textContent = display.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase());
  $$('[data-admin-id]').forEach(el => el.textContent = `Admin · ${savedUser.user_id ?? 'Account'}`);
}
async function api(path, options = {}) {
  const headers = { Authorization: `Bearer ${token}`, ...options.headers };
  const response = await fetch(API + path, { ...options, headers });
  if (response.status === 401) { signOut(); throw new Error('Session expired'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
$$('[data-demo]').forEach(b => b.addEventListener('click', () => showStatus(`${b.dataset.demo} is a preview only. A secure backend endpoint is required before this action can be completed.`)));
$$('[data-tab]').forEach(b => b.addEventListener('click', () => {
  $$('[data-tab]').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  showStatus(`${b.textContent} selected. The configuration sections are displayed below.`);
}));
function addCell(tr, text) { const td = document.createElement('td'); td.textContent = String(text ?? '—'); tr.append(td); return td; }
function emptyRow(tbody, count, message) { tbody.replaceChildren(); const tr = document.createElement('tr'); const td = addCell(tr, message); td.colSpan = count; tbody.append(tr); }



async function loadUsers() {
    const directory = document.querySelector("#userDirectory tbody");

    if (!directory) return;

    try {
        const studentData = await api("/admin/students");
        const lecturerData = await api("/admin/lecturers");

        
const students = studentData.students.map(student => ({
    id: student.studentId,
    name: student.firstName + " " + student.lastName,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    contactNo: student.contactNo,
    accountStatus: student.accountStatus,
    role: "Student"
}));


        
const lecturers = lecturerData.lecturers.map(lecturer => ({
    id: lecturer.lecturerId,
    name: lecturer.firstName + " " + lecturer.lastName,
    firstName: lecturer.firstName,
    lastName: lecturer.lastName,
    email: lecturer.email,
    contactNo: lecturer.contactNo,
    qualification: lecturer.qualification,
    accountStatus: lecturer.accountStatus,
    role: "Lecturer"
}));


        const users = [...students, ...lecturers];

        document.getElementById("userCount").textContent = users.length;

        function displayUsers() {
            const search = document.getElementById("userSearch").value.toLowerCase().trim();
            const role = document.getElementById("userRole").value;

            const filteredUsers = users.filter(user => {
                const matchesSearch =
                    user.name.toLowerCase().includes(search) ||
                    user.email.toLowerCase().includes(search) ||
                    String(user.id).includes(search);

                const matchesRole =
                    role === "All roles" || user.role === role;

                return matchesSearch && matchesRole;
            });

            directory.replaceChildren();

            if (filteredUsers.length === 0) {
                emptyRow(directory, 5, "No users found.");
                return;
            }

            filteredUsers.forEach(user => {
                const tr = document.createElement("tr");

                addCell(tr, user.name + " (" + user.id + ")");
                addCell(tr, user.role);
                addCell(tr, user.email);
                addCell(tr, user.accountStatus || "Not available");

                const actionCell = document.createElement("td");

                if (user.role === "Student") {
                    const editButton = document.createElement("button");

                    editButton.textContent = "Edit";
                    editButton.className = "btn";
                    editButton.type = "button";

                    editButton.addEventListener("click", function() {
                        document.getElementById("editStudentId").value = user.id;
                        document.getElementById("editStudentFirstName").value = user.firstName;
                        document.getElementById("editStudentLastName").value = user.lastName;
                        document.getElementById("editStudentEmail").value = user.email;
                        document.getElementById("editStudentContact").value = user.contactNo || "";

                        const section = document.getElementById("editStudentSection");

                        section.hidden = false;
                        section.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    });

                    actionCell.appendChild(editButton);



const statusButton = document.createElement("button");

statusButton.textContent =
    user.accountStatus === "Active" ? "Deactivate" : "Activate";

statusButton.className = "btn";
statusButton.type = "button";
statusButton.style.marginLeft = "10px";

statusButton.addEventListener("click", async function() {

    const newStatus =
        user.accountStatus === "Active" ? "Inactive" : "Active";

    const confirmed = confirm(
        "Are you sure you want to " +
        (newStatus === "Active" ? "activate " : "deactivate ") +
        user.name + "?"
    );

    if (!confirmed) return;

    try {
        const data = await api(
            "/admin/students/" + user.id + "/status",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        showStatus(data.message);

        await loadUsers();
        await loadAccountCount();

    } catch (error) {
        showStatus(error.message, true);
        console.error("Error updating student status:", error);
    }
});

actionCell.appendChild(statusButton);



                
} else if (user.role === "Lecturer") {

    const editButton = document.createElement("button");

    editButton.textContent = "Edit";
    editButton.className = "btn";
    editButton.type = "button";

    editButton.addEventListener("click", function() {

        document.getElementById("editLecturerId").value = user.id;
        document.getElementById("editLecturerFirstName").value = user.firstName;
        document.getElementById("editLecturerLastName").value = user.lastName;
        document.getElementById("editLecturerEmail").value = user.email;
        document.getElementById("editLecturerContact").value = user.contactNo || "";
        document.getElementById("editLecturerQualification").value = user.qualification || "";

        const section = document.getElementById("editLecturerSection");

        section.hidden = false;
        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    actionCell.appendChild(editButton);

    
const statusButton = document.createElement("button");

statusButton.type = "button";
statusButton.className = "btn";
statusButton.style.marginLeft = "10px";

statusButton.textContent =
    user.accountStatus === "Active" ? "Deactivate" : "Activate";

statusButton.addEventListener("click", async function() {

    const newStatus =
        user.accountStatus === "Active" ? "Inactive" : "Active";

    const confirmed = confirm(
        "Are you sure you want to " +
        (newStatus === "Active" ? "activate " : "deactivate ") +
        user.name + "?"
    );

    if (!confirmed) return;

    try {
        const data = await api(
            "/admin/lecturers/" + user.id + "/status",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        showStatus(data.message);

        await loadUsers();
        await loadAccountCount();

    } catch (error) {
        showStatus(error.message, true);
        console.error("Error updating lecturer status:", error);
    }
});

actionCell.appendChild(statusButton);

}


                tr.appendChild(actionCell);
                directory.appendChild(tr);
            });
        }

        displayUsers();

        document.getElementById("userSearch").oninput = displayUsers;
        document.getElementById("userRole").onchange = displayUsers;

    } catch (error) {
        console.error("Error loading users:", error);
        emptyRow(directory, 5, "Unable to load users.");
        showStatus(error.message, true);
    }
}





async function loadAccountCount() {
    const countElement = document.getElementById("activeAccounts");

    if (!countElement) return;

    try {
        const studentData = await api("/admin/students");
        const lecturerData = await api("/admin/lecturers");

        const activeStudents = studentData.students.filter(
            student => student.accountStatus === "Active"
        ).length;

        const activeLecturers = lecturerData.lecturers.filter(
            lecturer => lecturer.accountStatus === "Active"
        ).length;

        // Include the currently logged-in admin
        const total = activeStudents + activeLecturers + 1;

        countElement.textContent = total;

    } catch (error) {
        console.error("Error loading active accounts:", error);
    }
}





async function loadCourses() {
    const directory = document.querySelector("#courseDirectory tbody");

    if (!directory) return;

    try {
        const data = await api("/admin/courses");

        directory.replaceChildren();

        if (data.courses.length === 0) {
            emptyRow(directory, 3, "No courses found.");
            return;
        }

        data.courses.forEach(course => {
            const tr = document.createElement("tr");

            addCell(tr, course.courseId);
            addCell(tr, course.courseName);

            const td = document.createElement("td");

            // EDIT BUTTON
            const editButton = document.createElement("button");

            editButton.textContent = "Edit";
            editButton.className = "btn";
            editButton.type = "button";

            editButton.addEventListener("click", function() {
                document.getElementById("editCourseId").value = course.courseId;
                document.getElementById("editCourseName").value = course.courseName;

                document.getElementById("editCourseSection").hidden = false;
            });

            td.appendChild(editButton);

            tr.appendChild(td);
            directory.appendChild(tr);
        });

    } catch (error) {
        console.error("Error loading courses:", error);
        emptyRow(directory, 3, "Unable to load courses.");
        showStatus(error.message, true);
    }
}




$('#createAccount')?.addEventListener('submit', async e => {
  e.preventDefault();
  const get = id => document.getElementById(id).value.trim();
  const payload = {
    role: get('newRole'), id: Number(get('newId')),
    firstName: get('newFirst'), lastName: get('newLast'),
    email: get('newEmail'), password: get('newPassword'),
    contactNo: get('newContact') || null, qualification: get('newQualification') || null
  };
  if (!Number.isInteger(payload.id) || payload.id <= 0 || !payload.firstName || !payload.lastName || !payload.email || payload.password.length < 8) {
    showStatus('Enter a positive numeric ID, names, email and a password of at least 8 characters.', true);
    return;
  }
  try {
    const result = await api('/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    showStatus(result.message || 'Account created successfully.');
    e.target.reset();
  } catch (err) { showStatus(err.message, true); }
});

$('#saveClassDraft')?.addEventListener('click', () => {
  const ids = ['classCourse','classCohort','classLecturer','classDate','classRoom','classStart','classEnd','classReason'];
  const draft = Object.fromEntries(ids.map(id => [id, document.getElementById(id).value]));
  localStorage.setItem('ssms-admin-class-draft', JSON.stringify(draft));
  updateDraftPreview();
  showStatus('Class draft saved in this browser only. It has not been published.');
});
$('#discardClassDraft')?.addEventListener('click', () => {
  localStorage.removeItem('ssms-admin-class-draft');
  $('#classForm')?.reset(); updateDraftPreview();
  showStatus('Local draft discarded.');
});
function updateDraftPreview() {
  const target = $('#classDraftPreview'); if (!target) return;
  const raw = localStorage.getItem('ssms-admin-class-draft');
  if (!raw) { target.textContent = 'No draft saved.'; return; }
  try {
    const d = JSON.parse(raw);
    target.textContent = `${d.classCourse || 'Unnamed class'} · ${d.classDate || 'Date not set'} · ${d.classStart || '?'}–${d.classEnd || '?'} · ${d.classRoom || 'Room not set'} (local draft)`;
  } catch { target.textContent = 'Draft could not be read.'; }
}
updateDraftPreview();

$('#saveSettings')?.addEventListener('click', () => {
  const form = $('#settingsForm');
  if (!form) return;
  const settings = Object.fromEntries([...form.querySelectorAll('input,select')].map(el => [el.id, el.value]));
  localStorage.setItem('ssms-admin-local-settings', JSON.stringify(settings));
  showStatus('Configuration saved in this browser only. Server settings have not changed.');
});
try {
  const saved = JSON.parse(localStorage.getItem('ssms-admin-local-settings') || '{}');
  Object.entries(saved).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.value = value; });
} catch { /* Ignore malformed browser storage. */ }

$('#saveSupportNote')?.addEventListener('click', () => {
  localStorage.setItem('ssms-admin-support-note', $('#supportReply')?.value || '');
  showStatus('Support note saved in this browser only. It is not attached to a support ticket.');
});
if ($('#supportReply')) $('#supportReply').value = localStorage.getItem('ssms-admin-support-note') || '';

async function loadStudentPreview() {
  const tbody = $('#studentAttendanceTable tbody');
  if (!tbody) return;
  // No admin-authorized attendance API yet; never show fabricated attendance.
  emptyRow(tbody, 3, 'Attendance register is not connected to an admin-authorized endpoint.');
}

async function checkAPI() {
  if (!$('#apiStatus')) return;
  try {
    // This route is already present and enforces lecturer role; 403 still confirms API connectivity.
    const response = await fetch(API + '/lecturer/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    $('#apiStatus').textContent = response.status === 403 || response.ok ? 'Reachable' : `HTTP ${response.status}`;
  } catch { $('#apiStatus').textContent = 'Not reachable'; }
}


/* ===================================
   LOAD ADMIN PROFILE FROM DATABASE
=================================== */

async function loadAdminProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
        console.log("No login token found");
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:8000/api/v1/users/admin/dashboard",
            {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            console.log("Failed to load admin profile");
            return;
        }

        const data = await response.json();
        const admin = data.admin;

if (!admin) {
    console.error("Admin information not found");
    return;
}

admin.name = admin.name || "Admin";

        // Display admin name
        document.querySelectorAll(
            "[data-admin-name]"
        ).forEach(element => {
            element.textContent = admin.name;
        });

        // Display admin ID
        document.querySelectorAll(
            "[data-admin-id]"
        ).forEach(element => {
            element.textContent = admin.user_id;
        });

        // Display first name
        const firstName = admin.name.split(" ")[0];

        document.querySelectorAll(
            "[data-admin-first]"
        ).forEach(element => {
            element.textContent = firstName;
        });

        // Display initials
        const initials = admin.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase();

        document.querySelectorAll(
            "[data-admin-initials]"
        ).forEach(element => {
            element.textContent = initials;
        });

        console.log("Admin profile loaded");

    } catch (error) {
        console.error("Error loading admin profile:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");

    if (token && savedUser.role === "admin") {
        loadAdminProfile();
    }
});


const createCourseForm = document.getElementById("createCourseForm");

if (createCourseForm) {
    createCourseForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const courseId = Number(document.getElementById("newCourseId").value);
        const courseName = document.getElementById("newCourseName").value.trim();

        try {
            const data = await api("/admin/courses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    courseId: courseId,
                    courseName: courseName
                })
            });

            showStatus(data.message);

            createCourseForm.reset();

            // Refresh the course table
            await loadCourses();

        } catch (error) {
            showStatus(error.message, true);
            console.error("Error creating course:", error);
        }
    });
}


const editCourseForm = document.getElementById("editCourseForm");

if (editCourseForm) {
    editCourseForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const courseId = document.getElementById("editCourseId").value;
        const courseName = document.getElementById("editCourseName").value.trim();

        try {
            const data = await api("/admin/courses/" + courseId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    courseName: courseName
                })
            });

            showStatus(data.message);

            document.getElementById("editCourseSection").hidden = true;

            await loadCourses();

        } catch (error) {
            showStatus(error.message, true);
            console.error("Error updating course:", error);
        }
    });
}

document.getElementById("cancelEditCourse")?.addEventListener("click", function() {
    document.getElementById("editCourseSection").hidden = true;
});


const editStudentForm = document.getElementById("editStudentForm");

if (editStudentForm) {
    editStudentForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const studentId = document.getElementById("editStudentId").value;
        const firstName = document.getElementById("editStudentFirstName").value.trim();
        const lastName = document.getElementById("editStudentLastName").value.trim();
        const email = document.getElementById("editStudentEmail").value.trim();
        const contactNo = document.getElementById("editStudentContact").value.trim();

        try {
            const data = await api("/admin/students/" + studentId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    contactNo
                })
            });

            showStatus(data.message);

            document.getElementById("editStudentSection").hidden = true;

            await loadUsers();

        } catch (error) {
            showStatus(error.message, true);
            console.error("Error updating student:", error);
        }
    });
}

document.getElementById("cancelEditStudent")?.addEventListener("click", function() {
    document.getElementById("editStudentSection").hidden = true;
});


const editLecturerForm = document.getElementById("editLecturerForm");

if (editLecturerForm) {
    editLecturerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const lecturerId = document.getElementById("editLecturerId").value;
        const firstName = document.getElementById("editLecturerFirstName").value.trim();
        const lastName = document.getElementById("editLecturerLastName").value.trim();
        const email = document.getElementById("editLecturerEmail").value.trim();
        const contactNo = document.getElementById("editLecturerContact").value.trim();
        const qualification = document.getElementById("editLecturerQualification").value.trim();

        try {
            const data = await api("/admin/lecturers/" + lecturerId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    contactNo,
                    qualification
                })
            });

            showStatus(data.message);

            document.getElementById("editLecturerSection").hidden = true;

            await loadUsers();

        } catch (error) {
            showStatus(error.message, true);
            console.error("Error updating lecturer:", error);
        }
    });
}

document.getElementById("cancelEditLecturer")?.addEventListener("click", function() {
    document.getElementById("editLecturerSection").hidden = true;
});





loadUsers();
loadStudentPreview();
checkAPI();
loadAccountCount();
loadCourses();
