
/* =====================================
   1. SAMPLE DASHBOARD DATA
   Replace this sample data with API data later.
===================================== */

let students = [
    {
        id: 1001,
        name: "Amaya Perera",
        course: "Computer Science",
        email: "amaya@example.com",
        status: "Active"
    },
    {
        id: 1002,
        name: "Kavindu Silva",
        course: "Information Technology",
        email: "kavindu@example.com",
        status: "Active"
    },
    {
        id: 1003,
        name: "Nethmi Fernando",
        course: "Software Engineering",
        email: "nethmi@example.com",
        status: "Inactive"
    },
    {
        id: 1004,
        name: "Tharushi Jayawardena",
        course: "Computer Science",
        email: "tharushi@example.com",
        status: "Active"
    }
];

const staffMembers = [
    { name: "Staff Member", subject: "Computer Science" },
    { name: "Staff Member 2", subject: "Mathematics" },
    { name: "Staff Member 3", subject: "Database Systems" }
];

const subjects = [
    { name: "Web Development", code: "CS101" },
    { name: "Database Systems", code: "CS202" },
    { name: "Mathematics", code: "MA101" },
    { name: "Software Engineering", code: "SE301" }
];

const schedule = [
    {
        time: "08:30 AM",
        subject: "Web Development",
        details: "Room A101"
    },
    {
        time: "10:30 AM",
        subject: "Database Systems",
        details: "Room B202"
    },
    {
        time: "01:30 PM",
        subject: "Mathematics",
        details: "Room C103"
    }
];

/* =====================================
   2. GET HTML ELEMENTS
===================================== */

const studentTableBody =
    document.getElementById("studentTableBody");

const studentSearch =
    document.getElementById("studentSearch");

const statusFilter =
    document.getElementById("statusFilter");

const studentCount =
    document.getElementById("studentCount");

const studentModal =
    document.getElementById("studentModal");

const studentForm =
    document.getElementById("studentForm");

const sidebar =
    document.getElementById("sidebar");

const overlay =
    document.getElementById("overlay");

/* =====================================
   3. INITIALIZE DASHBOARD
===================================== */

function initializeDashboard() {
    updateDate();
    renderStudents();
    renderSubjects();
    renderSchedule();
    updateSummary();
}

function updateDate() {
    const dateElement = document.getElementById("todayDate");

    dateElement.textContent = new Date().toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

/* =====================================
   4. UPDATE SUMMARY CARDS
===================================== */

function updateSummary() {
    document.getElementById("totalStudents").textContent =
        students.length;

    document.getElementById("totalStaff").textContent =
        staffMembers.length;

    document.getElementById("totalSubjects").textContent =
        subjects.length;

    document.getElementById("totalClasses").textContent =
        schedule.length;
}

/* =====================================
   5. DISPLAY STUDENTS
===================================== */

function renderStudents() {
    const searchTerm = studentSearch.value
        .trim()
        .toLowerCase();

    const selectedStatus = statusFilter.value;

    const filteredStudents = students.filter(function(student) {
        const matchesSearch =
            student.name.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm) ||
            student.course.toLowerCase().includes(searchTerm) ||
            String(student.id).includes(searchTerm);

        const matchesStatus =
            selectedStatus === "all" ||
            student.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    studentTableBody.innerHTML = "";

    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    No students found.
                </td>
            </tr>
        `;
    }

    filteredStudents.forEach(function(student) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.className = "student-id";
        idCell.textContent = "STU" + student.id;

        const nameCell = document.createElement("td");
        nameCell.textContent = student.name;

        const courseCell = document.createElement("td");
        courseCell.textContent = student.course;

        const emailCell = document.createElement("td");
        emailCell.textContent = student.email;

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.className =
            "status " +
            (student.status === "Active"
                ? "status-active"
                : "status-inactive");

        statusBadge.textContent = student.status;
        statusCell.appendChild(statusBadge);

        const actionCell = document.createElement("td");
        const actionGroup = document.createElement("div");

        actionGroup.className = "action-group";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-button";
        editButton.title = "Edit student";
        editButton.setAttribute("aria-label", "Edit " + student.name);
        editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';

        editButton.addEventListener("click", function() {
            editStudent(student.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-button delete-button";
        deleteButton.title = "Delete student";
        deleteButton.setAttribute(
            "aria-label",
            "Delete " + student.name
        );
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

        deleteButton.addEventListener("click", function() {
            deleteStudent(student.id);
        });

        actionGroup.append(editButton, deleteButton);
        actionCell.appendChild(actionGroup);

        row.append(
            idCell,
            nameCell,
            courseCell,
            emailCell,
            statusCell,
            actionCell
        );

        studentTableBody.appendChild(row);
    });

    studentCount.textContent =
        "Showing " + filteredStudents.length +
        " of " + students.length + " students";
}

/* =====================================
   6. SEARCH AND FILTER
===================================== */

studentSearch.addEventListener("input", renderStudents);
statusFilter.addEventListener("change", renderStudents);

/* =====================================
   7. ADD STUDENT
===================================== */

document.getElementById("addStudentButton")
    .addEventListener("click", function() {
        studentForm.reset();

        // Clear the editing ID when adding a new student.
        delete studentForm.dataset.editingId;

        document.querySelector(".modal-header h2").textContent =
            "Add Student";

        studentModal.hidden = false;
        document.getElementById("studentName").focus();
    });

function closeStudentModal() {
    studentModal.hidden = true;
    studentForm.reset();
    delete studentForm.dataset.editingId;
}

document.getElementById("closeModal")
    .addEventListener("click", closeStudentModal);

document.getElementById("cancelStudent")
    .addEventListener("click", closeStudentModal);

studentModal.addEventListener("click", function(event) {
    if (event.target === studentModal) {
        closeStudentModal();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && !studentModal.hidden) {
        closeStudentModal();
    }
});

studentForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("studentName")
        .value.trim();

    const course = document.getElementById("studentCourse")
        .value.trim();

    const email = document.getElementById("studentEmail")
        .value.trim();

    const status = document.getElementById("studentStatus")
        .value;

    const editingId = studentForm.dataset.editingId;

    // Prevent duplicate email addresses in this sample dataset.
    const duplicateEmail = students.some(function(student) {
        return student.email.toLowerCase() === email.toLowerCase() &&
            String(student.id) !== editingId;
    });

    if (duplicateEmail) {
        showNotification("A student with this email already exists.");
        return;
    }

    if (editingId) {
        const student = students.find(function(item) {
            return String(item.id) === editingId;
        });

        if (!student) {
            showNotification("Student could not be found.");
            return;
        }

        student.name = name;
        student.course = course;
        student.email = email;
        student.status = status;

        showNotification("Student updated successfully.");
    } else {
        const newId = students.length > 0
            ? Math.max(...students.map(function(student) {
                return student.id;
            })) + 1
            : 1001;

        students.push({
            id: newId,
            name: name,
            course: course,
            email: email,
            status: status
        });

        showNotification("Student added successfully.");
    }

    renderStudents();
    updateSummary();
    closeStudentModal();
});

/* =====================================
   8. EDIT STUDENT
===================================== */

function editStudent(id) {
    const student = students.find(function(item) {
        return item.id === id;
    });

    if (!student) {
        showNotification("Student could not be found.");
        return;
    }

    document.getElementById("studentName").value = student.name;
    document.getElementById("studentCourse").value = student.course;
    document.getElementById("studentEmail").value = student.email;
    document.getElementById("studentStatus").value = student.status;

    studentForm.dataset.editingId = String(student.id);

    document.querySelector(".modal-header h2").textContent =
        "Edit Student";

    studentModal.hidden = false;
    document.getElementById("studentName").focus();
}

/* =====================================
   9. DELETE STUDENT
===================================== */

function deleteStudent(id) {
    const student = students.find(function(item) {
        return item.id === id;
    });

    if (!student) {
        showNotification("Student could not be found.");
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete " + student.name + "?"
    );

    if (!confirmed) {
        return;
    }

    students = students.filter(function(item) {
        return item.id !== id;
    });

    renderStudents();
    updateSummary();

    showNotification("Student deleted successfully.");
}

/* =====================================
   10. RENDER ASSIGNED SUBJECTS
===================================== */

function renderSubjects() {
    const subjectList = document.getElementById("subjectList");

    subjectList.innerHTML = "";

    subjects.forEach(function(subject) {
        const item = document.createElement("div");
        item.className = "subject-item";

        const icon = document.createElement("div");
        icon.className = "subject-icon";
        icon.innerHTML = '<i class="fa-solid fa-book-open"></i>';

        const info = document.createElement("div");
        info.className = "subject-info";

        const name = document.createElement("h3");
        name.textContent = subject.name;

        const code = document.createElement("p");
        code.textContent = "Subject Code: " + subject.code;

        info.append(name, code);
        item.append(icon, info);
        subjectList.appendChild(item);
    });
}

/* =====================================
   11. RENDER TIMETABLE
===================================== */

function renderSchedule() {
    const scheduleList = document.getElementById("scheduleList");

    scheduleList.innerHTML = "";

    schedule.forEach(function(item) {
        const row = document.createElement("div");
        row.className = "schedule-item";

        const time = document.createElement("div");
        time.className = "schedule-time";
        time.textContent = item.time;

        const info = document.createElement("div");
        info.className = "schedule-info";

        const subject = document.createElement("h3");
        subject.textContent = item.subject;

        const room = document.createElement("p");
        room.textContent = item.details;

        info.append(subject, room);
        row.append(time, info);
        scheduleList.appendChild(row);
    });
}

/* =====================================
   12. EXPORT STUDENTS TO CSV
===================================== */

document.getElementById("reportButton")
    .addEventListener("click", function() {
        const headers = [
            "Student ID",
            "Name",
            "Course",
            "Email",
            "Status"
        ];

        const rows = students.map(function(student) {
            return [
                "STU" + student.id,
                student.name,
                student.course,
                student.email,
                student.status
            ];
        });

        function escapeCSV(value) {
            return '"' +
                String(value).replace(/"/g, '""') +
                '"';
        }

        const csv = [headers, ...rows]
            .map(function(row) {
                return row.map(escapeCSV).join(",");
            })
            .join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csv],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "students.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        showNotification("Student CSV export started.");
    });

/* =====================================
   13. SIDEBAR FOR MOBILE
===================================== */

function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("show");
}

function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
}

document.getElementById("menuToggle")
    .addEventListener("click", openSidebar);

document.getElementById("closeSidebar")
    .addEventListener("click", closeSidebar);

overlay.addEventListener("click", closeSidebar);

/* =====================================
   14. SIDEBAR NAVIGATION
===================================== */

const pageNames = {
    dashboard: "Dashboard",
    students: "Students",
    staff: "Staff Directory",
    classes: "Classes & Subjects",
    timetable: "Timetable",
    attendance: "Attendance",
    settings: "Settings"
};

document.querySelectorAll(".nav-link[data-page]")
    .forEach(function(link) {
        link.addEventListener("click", function(event) {
            event.preventDefault();

            const page = link.dataset.page;

            document.querySelectorAll(".nav-link[data-page]")
                .forEach(function(item) {
                    item.classList.remove("active");
                });

            link.classList.add("active");

            const dashboardPage =
                document.getElementById("dashboard");

            const otherPage =
                document.getElementById("otherPage");

            document.getElementById("pageTitle").textContent =
                pageNames[page];

            document.getElementById("breadcrumbTitle").textContent =
                pageNames[page];

            if (page === "dashboard") {
                dashboardPage.hidden = false;
                otherPage.hidden = true;
            } else {
                dashboardPage.hidden = true;
                otherPage.hidden = false;

                document.getElementById("otherPageTitle").textContent =
                    pageNames[page];

                const messages = {
                    students:
                        "Student records are currently managed in the Dashboard. Use the dashboard to add, search, edit, or delete students.",
                    staff:
                        "Staff directory preview. Connect your staff API to display real staff records.",
                    classes:
                        "Classes and subjects preview. Connect your academic data to manage classes and subjects.",
                    timetable:
                        "Timetable preview. Connect your timetable API to display actual class schedules.",
                    attendance:
                        "Attendance preview. Connect your attendance API to record and review student attendance.",
                    settings:
                        "Account settings preview. Add your application's profile and preference settings here."
                };

                document.getElementById("otherPageMessage").textContent =
                    messages[page] || "This section is under development.";
            }

            closeSidebar();
        });
    });

/* =====================================
   15. NOTIFICATIONS AND LOGOUT
===================================== */

function showNotification(message) {
    const oldNotification =
        document.querySelector(".notification-message");

    if (oldNotification) {
        oldNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = "notification-message";
    notification.setAttribute("role", "status");
    notification.textContent = message;

    document.body.appendChild(notification);

    window.setTimeout(function() {
        notification.remove();
    }, 3000);
}

document.getElementById("notificationButton")
    .addEventListener("click", function() {
        showNotification("You have no new notifications.");
    });

document.getElementById("logoutButton")
    .addEventListener("click", function() {
        const confirmed = window.confirm(
            "Do you want to log out?"
        );

        if (confirmed) {
            showNotification(
                "Demo only: connect this button to your login/logout system."
            );
        }
    });

/* =====================================
   16. START THE APPLICATION
===================================== */

initializeDashboard();
