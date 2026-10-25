
/*
  Student Management System - Student Dashboard
  This version uses sample data for the initial UI preview.
  We can connect it to the Express backend and MySQL database later.
*/

const demoDashboard = {
    student: {
        name: "Nethara Savindi",
        initials: "NS"
    },

    summary: {
        enrolledCourses: 6,
        attendanceRate: 92,
        currentGpa: 3.6,
        pendingAssignments: 2
    },

    courses: [
        {
            code: "CS101",
            name: "Computer Science Basics",
            semester: "Semester 1",
            status: "Ongoing"
        },
        {
            code: "AI101",
            name: "Introduction to AI",
            semester: "Semester 1",
            status: "Ongoing"
        },
        {
            code: "MATH101",
            name: "Mathematics I",
            semester: "Semester 1",
            status: "Ongoing"
        },
        {
            code: "ENG101",
            name: "English Communication",
            semester: "Semester 1",
            status: "Completed"
        }
    ],

    activities: [
        {
            icon: "▤",
            color: "purple",
            title: "Assignment submitted",
            detail: "Computer Science Basics",
            date: "12 Oct 2026"
        },
        {
            icon: "✓",
            color: "green",
            title: "Class attended",
            detail: "Mathematics I",
            date: "10 Oct 2026"
        },
        {
            icon: "A+",
            color: "blue",
            title: "New grade available",
            detail: "Introduction to AI",
            date: "08 Oct 2026"
        },
        {
            icon: "♧",
            color: "orange",
            title: "Notice from faculty",
            detail: "Semester announcement",
            date: "05 Oct 2026"
        }
    ],

    assignments: [
        {
            title: "Assignment 1",
            course: "Computer Science Basics",
            due: "15 Oct 2026"
        },
        {
            title: "Assignment 2",
            course: "Introduction to AI",
            due: "30 Oct 2026"
        }
    ]
};


// Select an HTML element using its CSS selector.
const $ = (selector) => document.querySelector(selector);


// Display a small notification message.
function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}


// Prevent text from being interpreted as HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// Display student details and summary statistics.
function renderDashboard(data) {
    const student = data.student;
    const summary = data.summary;
    const courses = data.courses || [];
    const activities = data.activities || [];
    const assignments = data.assignments || [];

    $("#headerName").textContent = student.name;

    $("#welcomeName").textContent =
        student.name.split(" ")[0];

    $("#headerInitials").textContent =
        student.initials ||
        student.name
            .split(" ")
            .map(name => name[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

    $("#enrolledCourses").textContent =
        summary.enrolledCourses;

    $("#attendanceRate").textContent =
        summary.attendanceRate;

    $("#attendanceProgress").style.width =
        `${summary.attendanceRate}%`;

    $("#currentGpa").textContent =
        Number(summary.currentGpa).toFixed(1);

    $("#pendingAssignments").textContent =
        summary.pendingAssignments;


    // Populate the desktop courses table.
    $("#courseTableBody").innerHTML = courses.map(course => `
        <tr>
            <td class="course-code">
                ${escapeHTML(course.code)}
            </td>

            <td class="course-name">
                ${escapeHTML(course.name)}
            </td>

            <td>
                ${escapeHTML(course.semester)}
            </td>

            <td>
                <span class="status-badge ${
                    course.status === "Completed"
                        ? "completed"
                        : ""
                }">
                    ${escapeHTML(course.status)}
                </span>
            </td>
        </tr>
    `).join("");


    // Populate the mobile courses list.
    $("#mobileCourseList").innerHTML = courses.map(course => `
        <div class="mobile-course">

            <div class="course-avatar">
                ${escapeHTML(course.code.slice(0, 2))}
            </div>

            <div class="mobile-course-copy">
                <strong>${escapeHTML(course.name)}</strong>

                <span>
                    ${escapeHTML(course.code)}
                    ·
                    ${escapeHTML(course.semester)}
                </span>
            </div>

            <span class="status-badge ${
                course.status === "Completed"
                    ? "completed"
                    : ""
            }">
                ${escapeHTML(course.status)}
            </span>

        </div>
    `).join("");


    // Populate recent activities.
    $("#activityList").innerHTML = activities.map(activity => `
        <div class="activity-item">

            <div class="activity-icon ${
                escapeHTML(activity.color || "purple")
            }">
                ${escapeHTML(activity.icon || "•")}
            </div>

            <div class="activity-copy">
                <strong>${escapeHTML(activity.title)}</strong>
                <span>${escapeHTML(activity.detail || "")}</span>
            </div>

            <span class="activity-date">
                ${escapeHTML(activity.date || "")}
            </span>

        </div>
    `).join("");


    // Populate upcoming assignments.
    $("#assignmentList").innerHTML = assignments.map(assignment => `
        <div class="assignment-item">

            <div class="assignment-icon">▤</div>

            <div class="assignment-info">
                <strong>${escapeHTML(assignment.title)}</strong>
                <span>${escapeHTML(assignment.course)}</span>
            </div>

            <span class="due-badge">
                Due ${escapeHTML(assignment.due)}
            </span>

        </div>
    `).join("");
}


// Show today's date above the welcome message.
function setCurrentDate() {
    const todayLabel = $("#todayLabel");

    if (!todayLabel) return;

    const today = new Date();

    todayLabel.textContent = today.toLocaleDateString(
        "en",
        {
            weekday: "long",
            month: "long",
            day: "numeric"
        }
    ).toUpperCase();
}


// Handle sidebar navigation and mobile menu.
function setupNavigation() {

    document.querySelectorAll(".nav-link[data-page]")
        .forEach(link => {

            link.addEventListener("click", event => {
                event.preventDefault();

                document.querySelectorAll(".nav-link[data-page]")
                    .forEach(item => {
                        item.classList.remove("active");
                    });

                link.classList.add("active");

                const page = link.dataset.page;

                $("#pageTitle").textContent = page;

                $("#sidebar").classList.remove("open");

                if (page === "Dashboard") {
                    showToast("You're viewing your dashboard.");
                } else {
                    showToast(
                        `${page} page is not connected yet.`
                    );
                }
            });
        });


    // Open the mobile sidebar.
    $("#openMenu").addEventListener("click", () => {
        $("#sidebar").classList.add("open");
    });


    // Close the mobile sidebar.
    $("#closeMenu").addEventListener("click", () => {
        $("#sidebar").classList.remove("open");
    });


    // Placeholder until authentication is connected.
    $("#logoutButton").addEventListener("click", () => {
        showToast(
            "Logout will be connected to your login system."
        );
    });
}


// Start the dashboard after the HTML has loaded.
document.addEventListener("DOMContentLoaded", () => {
    setCurrentDate();

    renderDashboard(demoDashboard);

    setupNavigation();
});
