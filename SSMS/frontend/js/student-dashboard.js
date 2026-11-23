
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

    window.location.href = "../login.html";
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
        window.location.replace("../login.html");
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


async function initCalendar() {

    const calendar = $("#calendar");

    if (!calendar) return;

    calendar.textContent = "Loading timetable...";

    try {
        const response = await fetch(
            `${API_URL}/student/timetable`,
            {
                headers: {
                    Authorization: "Bearer " + getToken()
                }
            }
        );

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load timetable");
        }

        const data = await response.json();
        const timetable = data.timetable || [];

        calendar.innerHTML = "";

        if (timetable.length === 0) {
            calendar.textContent = "No classes scheduled.";
            return;
        }

        const days = ["Monday", "Tuesday", "Wednesday",
                      "Thursday", "Friday"];

        // Keep the existing five-column calendar design
        calendar.innerHTML = "<div></div>";

        days.forEach(day => {
            calendar.innerHTML += `
                <div class="cal-head">${day}</div>
            `;
        });

        // Use actual start times from the database
        const times = [...new Set(
            timetable.map(item => item.startTime)
        )].sort();

        times.forEach(time => {

            const timeLabel = document.createElement("div");
            timeLabel.className = "cal-time";
            timeLabel.textContent = time.slice(0, 5);
            calendar.appendChild(timeLabel);

            days.forEach(day => {

                const cell = document.createElement("div");
                cell.className = "cal-cell";

                const classes = timetable.filter(item =>
                    item.classDay === day &&
                    item.startTime === time
                );

                classes.forEach(item => {
                    const name = document.createElement("strong");
                    name.textContent = item.moduleName;

                    const details = document.createElement("small");
                    details.textContent =
                        item.startTime.slice(0, 5) + " - " +
                        item.endTime.slice(0, 5) + " | " +
                        item.room + " | " +
                        item.lecturerFirstName + " " +
                        item.lecturerLastName;

                    cell.appendChild(name);
                    cell.appendChild(details);
                });

                calendar.appendChild(cell);
            });
        });

    } catch (error) {
        console.error("Timetable error:", error);
        calendar.textContent = "Unable to load timetable.";
    }
}


async function loadStudentNotifications() {

    const allContainer = $("#allNotices");
    const unreadContainer = $("#unreadNotices");

    if (!allContainer || !unreadContainer) return;

    try {
        const response = await fetch(
            `${API_URL}/student/notifications`,
            {
                headers: {
                    Authorization: "Bearer " + getToken()
                }
            }
        );

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load notifications");
        }

        const data = await response.json();
        const notifications = data.notifications || [];

        const unread = notifications.filter(item => !item.isRead);

        function displayNotifications(container, items) {

            container.innerHTML = "";

            if (items.length === 0) {
                const message = document.createElement("p");
                message.className = "empty";
                message.textContent = "No notifications found.";
                container.appendChild(message);
                return;
            }

            items.forEach(item => {

                const div = document.createElement("div");
                div.className = "list-item";
                div.style.marginBottom = "10px";

                const title = document.createElement("strong");
                title.textContent = item.title;

                const message = document.createElement("p");
                message.textContent = item.message;

                const status = document.createElement("span");
                status.className = item.isRead ? "tag green" : "tag";
                status.textContent = item.isRead ? "Read" : "Unread";

                
if (!item.isRead) {
    const readButton = document.createElement("button");

    readButton.textContent = "Mark as Read";
    readButton.className = "btn";
    readButton.style.marginLeft = "10px";

    readButton.addEventListener("click", async () => {
        readButton.disabled = true;

        try {
            const response = await fetch(
                `${API_URL}/student/notifications/${item.notificationId}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: "Bearer " + getToken()
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Failed to mark notification as read");
            }

            await loadStudentNotifications();
            await loadOverviewNotifications();

        } catch (error) {
            console.error(error);
            alert("Unable to mark notification as read.");
            readButton.disabled = false;
        }
    });

    div.appendChild(readButton);
}


                div.appendChild(title);
                div.appendChild(message);
                div.appendChild(status);

                container.appendChild(div);
            });
        }

        displayNotifications(allContainer, notifications);
        displayNotifications(unreadContainer, unread);

    } catch (error) {
        console.error("Notifications error:", error);

        allContainer.textContent = "Unable to load notifications.";
        unreadContainer.textContent = "Unable to load notifications.";
    }
}


async function loadUpcomingDeadlines() {
    const deadlineElement = document.querySelector("#upcomingDeadlines");

    if (!deadlineElement) return;

    try {
        const response = await fetch(`${API_URL}/student/assignments`, {
            headers: {
                Authorization: "Bearer " + getToken()
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load assignments");
        }

        const data = await response.json();
        const assignments = data.assignments || [];

        const now = new Date();

        const upcoming = assignments.filter(item =>
            new Date(item.dueDate) >= now
        );

        deadlineElement.textContent = upcoming.length;

    } catch (error) {
        console.error("Assignments error:", error);
        deadlineElement.textContent = "N/A";
    }
}



async function loadOverviewNotifications() {
    const countElement = document.querySelector("#unreadNotificationCount");
    const listElement = document.querySelector("#latestNotifications");

    if (!countElement || !listElement) return;

    try {
        const response = await fetch(`${API_URL}/student/notifications`, {
            headers: {
                Authorization: "Bearer " + getToken()
            }
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load notifications");
        }

        const data = await response.json();
        const notifications = data.notifications || [];

        // Count unread notifications
        const unread = notifications.filter(item => !item.isRead);
        countElement.textContent = unread.length;

        // Display the latest 3 notifications
        listElement.innerHTML = "";

        if (notifications.length === 0) {
            listElement.textContent = "No notifications yet.";
            return;
        }

        notifications.slice(0, 3).forEach(item => {
            const div = document.createElement("div");
            div.className = "list-item";

            const title = document.createElement("strong");
            title.textContent = item.title;

            const message = document.createElement("p");
            message.textContent = item.message;

            const status = document.createElement("span");
            status.className = item.isRead ? "tag green" : "tag";
            status.textContent = item.isRead ? "Read" : "Unread";

            div.appendChild(title);
            div.appendChild(message);
            div.appendChild(status);

            listElement.appendChild(div);
        });

    } catch (error) {
        console.error("Overview notifications error:", error);
        countElement.textContent = "N/A";
        listElement.textContent = "Unable to load notifications.";
    }
}




async function loadTodayTimetable() {

    const container = $("#todayTimetable");

    if (!container) return;

    try {
        const response = await fetch(
            `${API_URL}/student/timetable`,
            {
                headers: {
                    Authorization: "Bearer " + getToken()
                }
            }
        );

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load today's timetable");
        }

        const data = await response.json();
        const timetable = data.timetable || [];

        // Get today's day name
        const today = new Date().toLocaleDateString("en-US", {
            weekday: "long"
        });

        // Find classes scheduled for today
        const todayClasses = timetable.filter(item =>
            item.classDay === today
        );

        container.innerHTML = "";

        if (todayClasses.length === 0) {
            container.textContent = "No classes scheduled for today.";
            return;
        }

        todayClasses.forEach(item => {

            const div = document.createElement("div");
            div.className = "list-item";

            const name = document.createElement("strong");
            name.textContent = item.moduleName;

            const details = document.createElement("small");
            details.textContent =
                item.startTime.slice(0, 5) + " - " +
                item.endTime.slice(0, 5) + " | " +
                item.room + " | " +
                item.lecturerFirstName + " " +
                item.lecturerLastName;

            div.appendChild(name);
            div.appendChild(details);

            container.appendChild(div);
        });

    } catch (error) {
        console.error("Today's timetable error:", error);
        container.textContent = "Unable to load today's timetable.";
    }
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
    loadTodayTimetable();
    loadStudentNotifications();
    loadOverviewNotifications();
    loadUpcomingDeadlines();
});





// Read-only assignment list backed by the authenticated student API.
async function loadAssignmentList() {
    const list = document.getElementById("assignmentList");
    if (!list) return;
    try {
        const response = await fetch(`${API_URL}/student/assignments`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const { assignments = [] } = await response.json();
        const count = document.getElementById("assignmentCount");
        if (count) count.textContent = assignments.filter(a => new Date(a.dueDate) >= new Date()).length;
        list.replaceChildren();
        if (!assignments.length) {
            const empty = document.createElement("p");
            empty.className = "muted";
            empty.textContent = "No assignments for your enrolled modules.";
            list.append(empty);
            return;
        }
        for (const assignment of assignments) {
            const card = document.createElement("article");
            card.className = "list-item";
            const title = document.createElement("strong");
            title.textContent = assignment.title;
            const detail = document.createElement("p");
            detail.textContent = assignment.description || "No description provided";
            const meta = document.createElement("small");
            meta.textContent = `${assignment.moduleName} · Due ${new Date(assignment.dueDate).toLocaleString()}`;
            card.append(title, detail, meta);
            list.append(card);
        }
    } catch (error) {
        list.textContent = `Could not load assignments: ${error.message}`;
    }
}
document.addEventListener("DOMContentLoaded", loadAssignmentList);
