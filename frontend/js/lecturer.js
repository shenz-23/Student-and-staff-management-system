
const API = "http://localhost:8000/api/v1/users";

// ========== NAVIGATION ==========

const NAV = [
    ["overview", "Overview", "staff-dashboard.html", "▦"],
    ["timetable", "Timetable & notifications", "lecturer-timetable.html", "▤"],
    ["materials", "Study materials", "lecturer-materials.html", "▣"],
    ["assessments", "Assignments & tests", "lecturer-assessments.html", "▤"],
    ["lectures", "Online lectures", "lecturer-lectures.html", "▣"],
    ["submissions", "Submissions & scripts", "lecturer-submissions.html", "▧"],
    ["provide", "Provide feedback", "lecturer-provide-feedback.html", "➤"],
    ["feedback", "Student feedback", "lecturer-student-feedback.html", "▢"],
    ["grades", "Grades", "lecturer-grades.html", "◇"]
];

const page = document.body.dataset.page;
const nav = document.getElementById("lecturerNav");

// Create sidebar navigation
nav.innerHTML = NAV.map(([key, label, href, icon]) => `
    <a href="${href}" class="${page === key ? 'active' : ''}">
        <span class="nav-icon">${icon}</span>
        ${label}
    </a>
`).join('') + `
    <a class="signout" href="#" id="lecturerSignout">
        <span class="nav-icon">↪</span>
        Sign out
    </a>
`;

// ========== LOGOUT ==========

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "../login.html";
}

document.getElementById("lecturerSignout").addEventListener("click", e => {
    e.preventDefault();
    logout();
});

// ========== STATUS MESSAGE ==========

function status(message) {
    const el = document.getElementById("statusMessage");

    el.hidden = false;
    el.textContent = message;
}

// ========== API REQUEST ==========

async function request(path) {

    const response = await fetch(API + path, {
        headers: {
            Authorization: "Bearer " + localStorage.getItem("token")
        }
    });

    if (response.status === 401) {
        logout();
        throw new Error("Session expired");
    }

    if (!response.ok) {
        throw new Error("API returned " + response.status);
    }

    return response.json();
}

// ========== LOAD LECTURER PROFILE ==========

async function loadLecturer() {

    try {
        const data = await request("/lecturer/dashboard");

        const l = data.lecturer;

        if (!l) {
            throw new Error("No lecturer returned");
        }

        const first = l.firstName || "";
        const last = l.lastName || "";

        // Lecturer full name
        document.querySelectorAll("[data-lecturer-name]").forEach(x => {
            x.textContent = (first + " " + last).trim() || "Lecturer";
        });

        // Lecturer first name
        document.querySelectorAll("[data-lecturer-first]").forEach(x => {
            x.textContent = first || "Lecturer";
        });

        // Lecturer initials
        document.querySelectorAll("[data-lecturer-initials]").forEach(x => {
            x.textContent = (
                (first[0] || "L") + (last[0] || "")
            ).toUpperCase();
        });

        // Lecturer ID
        document.querySelectorAll("[data-lecturer-id]").forEach(x => {
            x.textContent = "LEC-" + l.user_id;
        });

        // Lecturer qualification
        document.querySelectorAll("[data-lecturer-qualification]").forEach(x => {
            x.textContent = l.qualification || "";
        });

    } catch (e) {
        console.error("Lecturer profile:", e);

        status("Could not load lecturer profile: " + e.message);
    }
}

// ========== LOAD STUDENTS ==========

async function loadStudents() {

    const list = document.getElementById("studentList");
    const grade = document.getElementById("gradeTable");

    if (!list && !grade) {
        return;
    }

    try {
        const data = await request("/students");

        const students = data.students || [];

        // ========== STUDENT LIST ==========

        if (list) {

            list.textContent = "";

            if (!students.length) {
                list.textContent = "No students found.";
            }

            students.forEach(s => {

                const b = document.createElement("button");

                b.className = "student-entry btn";

                b.style.cssText =
                    "display:block;width:100%;text-align:left;margin:9px 0;background:#f3f6fc";

                b.textContent =
                    `${s.firstName || ""} ${s.lastName || ""} · ID ${s.studentId}`;

                b.addEventListener("click", () => {

                    document.getElementById("selectedStudent").textContent =
                        `${s.firstName || ""} ${s.lastName || ""} · ID ${s.studentId}`;

                });

                list.appendChild(b);
            });
        }

        // ========== GRADES TABLE ==========

        if (grade) {

            const table = document.createElement("table");

            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Coursework</th>
                        <th>Tests</th>
                        <th>Average</th>
                        <th>Status</th>
                    </tr>
                </thead>
            `;

            const body = document.createElement("tbody");

            students.forEach(s => {

                const tr = document.createElement("tr");

                const name = document.createElement("td");

                name.textContent =
                    `${s.firstName || ""} ${s.lastName || ""} · ${s.studentId}`;

                tr.append(name);

                [
                    "Not available",
                    "Not available",
                    "—",
                    "Not connected"
                ].forEach(t => {

                    const td = document.createElement("td");

                    td.textContent = t;

                    tr.append(td);
                });

                body.append(tr);
            });

            table.append(body);

            grade.replaceChildren(table);
        }

    } catch (e) {

        console.error("Student records:", e);

        if (list) {
            list.textContent = "Unable to load students.";
        }

        if (grade) {
            grade.textContent = "Unable to load students.";
        }

        status("Could not load student records: " + e.message);
    }
}

loadLecturer();
loadStudents();