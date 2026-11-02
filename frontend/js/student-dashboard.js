
const API_URL = "http://localhost:8000/api/v1/users";

// ========================================
// BASIC FUNCTIONS
// ========================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const PAGES = [
    ["overview", "Overview", "student-dashboard.html", "▦"],
    ["timetable", "Timetable & notifications", "student-timetable.html", "▤"],
    ["materials", "Study materials", "student-materials.html", "▣"],
    ["assignments", "Assignments", "student-assignments.html", "☷"],
    ["tests", "Online tests", "student-tests.html", "♧"],
    ["feedback", "Lecturer feedback", "student-feedback.html", "▢"],
    ["grades", "Grades", "student-grades.html", "◇"],
    ["attendance", "Attendance", "student-attendance.html", "♙"]
];

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}

function notice(message) {
    const element = $("#message");

    if (element) {
        element.textContent = message;
        element.classList.remove("hidden");
    } else {
        alert(message);
    }
}


// ========================================
// SIDEBAR AND NAVIGATION
// ========================================

async function initShell() {

    // Check if student is logged in
    if (!getToken()) {
        window.location.replace("login.html");
        return false;
    }

    // Check user role
    try {
        const user = JSON.parse(
            localStorage.getItem("user") || "{}"
        );

        if (user.role && user.role !== "student") {
            logout();
            return false;
        }

    } catch (error) {
        console.error("User information error:", error);
    }

    const currentPage =
        document.body.dataset.page || "overview";

    const nav = $("#nav");

    // Create sidebar links
    if (nav) {

        nav.innerHTML = PAGES.map((page) => {

            const [key, label, href, icon] = page;

            return `
                <a href="${href}"
                   class="${currentPage === key ? "active" : ""}">

                    <span class="ico">${icon}</span>
                    ${label}

                </a>
            `;

        }).join("") + `

            <a href="#" class="signout" id="signout">
                <span class="ico">↪</span>
                Sign out
            </a>
        `;

        $("#signout").addEventListener("click", function(event) {
            event.preventDefault();
            logout();
        });
    }

    // Mobile sidebar
    $("#menuButton")?.addEventListener("click", function() {
        $(".sidebar")?.classList.toggle("open");
    });

    // Display current page name
    const currentPageInfo = PAGES.find(
        page => page[0] === currentPage
    );

    if ($("#topPage") && currentPageInfo) {
        $("#topPage").textContent = currentPageInfo[1];
    }

    // Load student details from database
    await loadStudentProfile();

    return true;
}


// ========================================
// LOAD STUDENT DATA FROM MYSQL
// ========================================

async function loadStudentProfile() {

    const token = getToken();

    if (!token) {
        console.error("Login token not found");
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/student/dashboard`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        // Handle expired or invalid token
        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(
                "Failed to load student data: " + response.status
            );
        }

        const data = await response.json();

        console.log("Student dashboard data:", data);

        const student = data.student;

        if (!student) {
            throw new Error("Student information not found");
        }

        // --------------------------------
        // DISPLAY STUDENT NAME
        // --------------------------------

        const firstName = student.firstName || "";
        const lastName = student.lastName || "";

        const fullName = (
            firstName + " " + lastName
        ).trim();

        $$("[data-student-name]").forEach(element => {
            element.textContent = fullName || "Student";
        });

        $$("[data-student-first]").forEach(element => {
            element.textContent = firstName || "Student";
        });

        // --------------------------------
        // DISPLAY STUDENT ID
        // --------------------------------

        $$("[data-student-id]").forEach(element => {
            element.textContent = student.user_id || "";
        });

        // --------------------------------
        // DISPLAY STUDENT INITIALS
        // --------------------------------

        const initials =
            (firstName.charAt(0) || "S") +
            (lastName.charAt(0) || "");

        $$("[data-student-initials]").forEach(element => {
            element.textContent = initials.toUpperCase();
        });

        // --------------------------------
        // DISPLAY ENROLLED COURSES
        // --------------------------------

        const courses = data.courses || [];

        const enrolledCourses = $("#enrolledCourses");

        if (enrolledCourses) {
            enrolledCourses.textContent =
                data.enrolledCourses ?? courses.length;
        }

        const enrolledList = $("#enrolledList");

        if (enrolledList) {

            enrolledList.innerHTML = "";

            if (courses.length === 0) {

                enrolledList.innerHTML = `
                    <p class="muted">
                        No enrolled courses found.
                    </p>
                `;

            } else {

                courses.forEach(course => {

                    const div = document.createElement("div");
                    div.className = "list-item";

                    const name = document.createElement("strong");
                    name.textContent = course.courseName;

                    const id = document.createElement("small");
                    id.textContent = "Course ID: " + course.courseId;

                    div.appendChild(name);
                    div.appendChild(document.createElement("br"));
                    div.appendChild(id);

                    enrolledList.appendChild(div);

                });
            }
        }

    } catch (error) {

        console.error("Student dashboard error:", error);

        const enrolledList = $("#enrolledList");

        if (enrolledList) {
            enrolledList.textContent =
                "Unable to load courses from the database.";
        }
    }
}


// ========================================
// STUDY MATERIALS
// ========================================

// Temporary sample data until materials API is created

const exampleMaterials = [
    ["Routing and switching notes", "Computer Networks", "PDF · 2.4 MB"],
    ["Trees and graph traversal", "Data Structures", "PDF · 1.8 MB"],
    ["SQL joins: practice worksheet", "Database Systems", "DOCX · 840 KB"],
    ["Week 6 lecture slides", "Software Engineering", "PDF · 3.1 MB"],
    ["Recurrence relations guide", "Discrete Mathematics", "PDF · 960 KB"],
    ["Sorting algorithms", "Data Structures", "MP4 · 145 MB"]
];

function initMaterials() {

    const tableBody = $("#materialsBody");

    if (!tableBody) return;

    const searchInput = $("#materialSearch");
    const subjectFilter = $("#subjectFilter");

    function renderMaterials() {

        const search = searchInput
            ? searchInput.value.toLowerCase()
            : "";

        const subject = subjectFilter
            ? subjectFilter.value
            : "";

        const filtered = exampleMaterials.filter(material => {

            const matchesSearch = material
                .join(" ")
                .toLowerCase()
                .includes(search);

            const matchesSubject =
                !subject || material[1] === subject;

            return matchesSearch && matchesSubject;
        });

        tableBody.innerHTML = "";

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No matching materials found.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(material => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <input type="checkbox" class="material-check">
                </td>

                <td>${escapeHTML(material[0])}</td>

                <td>${escapeHTML(material[1])}</td>

                <td>${escapeHTML(material[2])}</td>

                <td>Sample</td>

                <td>Not uploaded</td>
            `;

            tableBody.appendChild(row);
        });
    }

    searchInput?.addEventListener("input", renderMaterials);
    subjectFilter?.addEventListener("change", renderMaterials);

    renderMaterials();

    $("#downloadSelected")?.addEventListener("click", function() {
        notice("Study material downloads are not connected yet.");
    });
}


// ========================================
// FORMS AND FILE UPLOAD PREVIEWS
// ========================================

function initForms() {

    // Demo forms
    $$("[data-demo-form]").forEach(form => {

        form.addEventListener("submit", function(event) {

            event.preventDefault();

            notice(
                "This feature is not connected to the database yet."
            );
        });
    });

    // Save drafts locally
    $$("[data-local-draft]").forEach(button => {

        button.addEventListener("click", function() {

            const form = button.closest("form");

            if (!form) return;

            const data = {};

            form.querySelectorAll(
                "input:not([type=file]), textarea, select"
            ).forEach(element => {

                const key = element.name || element.id;

                if (!key) return;

                if (element.type === "checkbox") {
                    data[key] = element.checked;
                } else {
                    data[key] = element.value;
                }
            });

            localStorage.setItem(
                "ssms-draft-" + (form.id || "form"),
                JSON.stringify(data)
            );

            notice("Draft saved in this browser.");
        });
    });

    // Display selected file names
    $$('input[type="file"]').forEach(input => {

        input.addEventListener("change", function() {

            const form = input.closest("form");

            const label = form?.querySelector(".selected-file");

            if (label) {
                label.textContent =
                    input.files[0]?.name || "No file selected";
            }
        });
    });

    // Feedback rating buttons
    $$("[data-rating]").forEach(group => {

        const buttons = group.querySelectorAll("button");

        buttons.forEach(button => {

            button.addEventListener("click", function() {

                buttons.forEach(item => {
                    item.classList.remove("primary");
                });

                button.classList.add("primary");
            });
        });
    });
}


// ========================================
// TABS
// ========================================

function initTabs() {

    $$("[data-tab-target]").forEach(button => {

        button.addEventListener("click", function() {

            const group = button.dataset.tabGroup;

            $$(`[data-tab-group="${group}"]`).forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            $$(`[data-tab-panel="${group}"]`).forEach(item => {
                item.classList.add("hidden");
            });

            const target = document.getElementById(
                button.dataset.tabTarget
            );

            target?.classList.remove("hidden");
        });
    });
}


// ========================================
// TIMETABLE - TEMPORARY SAMPLE DATA
// ========================================

function initCalendar() {

    const calendar = $("#calendar");

    if (!calendar) return;

    const days = [
        "Mon", "Tue", "Wed", "Thu", "Fri"
    ];

    const timeSlots = [
        "09:00–10:30",
        "11:00–12:30",
        "14:00–15:30"
    ];

    const sampleClasses = [
        [
            "Data Structures",
            "Discrete Mathematics",
            "Software Engineering",
            "Data Structures",
            "Discrete Mathematics"
        ],
        [
            "Database Systems",
            "Software Engineering",
            "Database Systems",
            "Computer Networks",
            "Independent study"
        ],
        [
            "Computer Networks",
            "Independent study",
            "Data Structures",
            "Discrete Mathematics",
            "Database Systems"
        ]
    ];

    calendar.innerHTML = "<div></div>";

    days.forEach(day => {
        calendar.innerHTML += `
            <div class="cal-head">${day}</div>
        `;
    });

    timeSlots.forEach((time, row) => {

        calendar.innerHTML += `
            <div class="cal-time">${time}</div>
        `;

        days.forEach((day, column) => {

            calendar.innerHTML += `
                <div class="cal-cell">
                    <strong>
                        ${sampleClasses[row][column]}
                    </strong>

                    <small>
                        Illustrative schedule
                    </small>
                </div>
            `;
        });
    });
}


// ========================================
// INITIALIZE STUDENT PORTAL
// ========================================


document.addEventListener("DOMContentLoaded", async function() {

    const ready = await initShell();

    if (!ready) {
        return;
    }

    initMaterials();
    initForms();
    initTabs();
    initCalendar();

});




