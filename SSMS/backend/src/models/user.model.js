import connectDB from "../config/database.js";

const tables = {
    admin: {
        table: "Admin",
        id: "Admin_ID"
    },
    student: {
        table: "Student",
        id: "S_ID"
    },
    lecturer: {
        table: "Lecturer",
        id: "Lec_ID"
    }
};

export const User = {
    
findByEmail: async (role, email) => {
    const account = tables[role];

    if (!account) {
        throw new Error("Invalid role");
    }

    const connection = await connectDB();

    try {
        let sql = `
            SELECT ${account.id} AS user_id,
                   Email AS email,
                   Password AS password
        `;
        if (role === "student" || role === "lecturer") {
            sql += `, Account_Status AS accountStatus`;
        }

        sql += `
            FROM ${account.table}
            WHERE Email = ?
            LIMIT 1
        `;

        const [rows] = await connection.execute(sql, [email]);

        return rows[0] || null;

    } finally {
        await connection.end();
    }
},


    
    createAccount: async (role, details, passwordHash, adminId) => {
        if (role !== "student" && role !== "lecturer") {
            throw new Error("Only student and lecturer accounts can be created here");
        }

        const connection = await connectDB();

        try {
            if (role === "student") {
                const [result] = await connection.execute(
                    `INSERT INTO Student
                    (S_ID, F_Name, L_Name, BOD, Age, Email,
                     Contact_No, NIC, Address, Admin_ID, Password)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        details.id,
                        details.firstName,
                        details.lastName,
                        details.bod || null,
                        details.age || null,
                        details.email,
                        details.contactNo || null,
                        details.nic || null,
                        details.address || null,
                        adminId,
                        passwordHash
                    ]
                );

                return result.insertId || details.id;
            }

            const [result] = await connection.execute(
                `INSERT INTO Lecturer
                (Lec_ID, F_Name, L_Name, NIC, Email, Qualification,
                 Contact_No, BOD, Age, Salary, Address, Admin_ID, Password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    details.id,
                    details.firstName,
                    details.lastName,
                    details.nic || null,
                    details.email,
                    details.qualification || null,
                    details.contactNo || null,
                    details.bod || null,
                    details.age || null,
                    details.salary || null,
                    details.address || null,
                    adminId,
                    passwordHash
                ]
            );

            return result.insertId || details.id;
        } finally {
            await connection.end();
        }
    },

    
getStudentDashboard: async (studentId) => {
    const connection = await connectDB();

    try {
        const [students] = await connection.execute(
            `SELECT
                S_ID AS user_id,
                F_Name AS firstName,
                L_Name AS lastName,
                Email AS email
             FROM Student
             WHERE S_ID = ?
             LIMIT 1`,
            [studentId]
        );

        if (students.length === 0) {
            return null;
        }

        const [courses] = await connection.execute(
            `SELECT
                Course.C_ID AS courseId,
                Course.C_Name AS courseName
             FROM Enroll
             INNER JOIN Course
                ON Enroll.C_ID = Course.C_ID
             WHERE Enroll.S_ID = ?`,
            [studentId]
        );

        return {
            student: students[0],
            courses: courses,
            enrolledCourses: courses.length
        };
    } finally {
        await connection.end();
    }
},


getStudentAssignments: async (studentId) => {

    const connection = await connectDB();

    try {
        const [assignments] = await connection.execute(
            `SELECT
                a.Assignment_ID AS assignmentId,
                a.Title AS title,
                a.Description AS description,
                a.Due_Date AS dueDate,
                a.Created_At AS createdAt,
                m.M_Name AS moduleName
             FROM Assignment a
             JOIN Module m ON a.M_ID = m.M_ID
             JOIN Learn l ON a.M_ID = l.M_ID
             WHERE l.Student_ID = ?
             ORDER BY a.Due_Date ASC`,
            [studentId]
        );

        return assignments;

    } finally {
        await connection.end();
    }
},


getLecturerDashboard: async (lecturerId) => {
    const connection = await connectDB();

    try {
        const [lecturers] = await connection.execute(
            `SELECT
                Lec_ID AS user_id,
                F_Name AS firstName,
                L_Name AS lastName,
                Email AS email,
                Qualification AS qualification
             FROM Lecturer
             WHERE Lec_ID = ?
             LIMIT 1`,
            [lecturerId]
        );

        if (lecturers.length === 0) return null;

        return {
            lecturer: lecturers[0]
        };

    } finally {
        await connection.end();
    }
},


getAdminDashboard: async (adminId) => {
    const connection = await connectDB();

    try {
        const [admins] = await connection.execute(
            `SELECT
                Admin_ID AS user_id,
                Name AS name,
                Email AS email,
                Contact_No AS contactNo,
                Qualification AS qualification
             FROM Admin
             WHERE Admin_ID = ?
             LIMIT 1`,
            [adminId]
        );

        if (admins.length === 0) {
            return null;
        }

        return {
            admin: admins[0]
        };

    } finally {
        await connection.end();
    }
},


getAllStudents: async () => {
    const connection = await connectDB();

    try {
        const [students] = await connection.execute(
            `SELECT
                S_ID AS studentId,
                F_Name AS firstName,
                L_Name AS lastName,
                Email AS email,
                Contact_No AS contactNo,
                Account_Status AS accountStatus
             FROM Student
             ORDER BY S_ID`
        );

        return students;

        } finally {
        await connection.end();
    }
},


updateStudent: async (studentId, firstName, lastName, email, contactNo) => {
    const connection = await connectDB();

    try {
        const [result] = await connection.execute(
            `UPDATE Student
             SET F_Name = ?,
                 L_Name = ?,
                 Email = ?,
                 Contact_No = ?
             WHERE S_ID = ?`,
            [firstName, lastName, email, contactNo, studentId]
        );

        return result.affectedRows;

    } finally {
        await connection.end();
    }
},


updateStudentStatus: async (studentId, status) => {
    const connection = await connectDB();

    try {
        const [result] = await connection.execute(
            `UPDATE Student
             SET Account_Status = ?
             WHERE S_ID = ?`,
            [status, studentId]
        );

        return result.affectedRows;

    } finally {
        await connection.end();
    }
},



getAllLecturers: async () => {
    const connection = await connectDB();

    try {
        const [lecturers] = await connection.execute(
            `SELECT
                Lec_ID AS lecturerId,
                F_Name AS firstName,
                L_Name AS lastName,
                Email AS email,
                Contact_No AS contactNo,
                Qualification AS qualification,
                Account_Status AS accountStatus
             FROM Lecturer
             ORDER BY Lec_ID`
        );

        return lecturers;

    } finally {
        await connection.end();
    }
},


updateLecturer: async (lecturerId, firstName, lastName, email, contactNo, qualification) => {
    const connection = await connectDB();

    try {
        const [result] = await connection.execute(
            `UPDATE Lecturer
             SET F_Name = ?,
                 L_Name = ?,
                 Email = ?,
                 Contact_No = ?,
                 Qualification = ?
             WHERE Lec_ID = ?`,
            [
                firstName,
                lastName,
                email,
                contactNo,
                qualification,
                lecturerId
            ]
        );

        return result.affectedRows;

    } finally {
        await connection.end();
    }
},


getAllCourses: async () => {
    const connection = await connectDB();

    try {
        const [courses] = await connection.execute(
            `SELECT
                C_ID AS courseId,
                C_Name AS courseName
             FROM Course
             ORDER BY C_ID`
        );

        return courses;

    } finally {
        await connection.end();
    }
},


updateLecturerStatus: async (lecturerId, status) => {
    const connection = await connectDB();

    try {
        const [result] = await connection.execute(
            `UPDATE Lecturer
             SET Account_Status = ?
             WHERE Lec_ID = ?`,
            [status, lecturerId]
        );

        return result.affectedRows;

    } finally {
        await connection.end();
    }
},



createCourse: async (courseId, courseName, adminId) => {
    const connection = await connectDB();

    try {
        const [result] = await connection.execute(
            `INSERT INTO Course (C_ID, C_Name, Admin_ID)
             VALUES (?, ?, ?)`,
            [courseId, courseName, adminId]
        );

        return result.affectedRows;

    } finally {
        await connection.end();
    }
},


updateCourse: async (courseId, courseName) => {
    const connection = await connectDB();

    try {
        const [result] = await connection.execute(
            `UPDATE Course SET C_Name = ? WHERE C_ID = ?`,
            [courseName, courseId]
        );

        return result.affectedRows;

    } finally {
        await connection.end();
    }
},

deleteCourse: async (courseId) => {
    const connection = await connectDB();

    try {
        const [result] = await connection.execute(
            "DELETE FROM Course WHERE C_ID = ?",
            [courseId]
        );

        return result.affectedRows;

    } finally {
        await connection.end();
    }
},


deleteStudent: async (studentId) => {
    const connection = await connectDB();

    try {
        const [result] = await connection.execute(
            "DELETE FROM Student WHERE S_ID = ?",
            [studentId]
        );

        return result.affectedRows;

    } finally {
        await connection.end();
    }
},


getStudentStatus: async (studentId) => {
    const connection = await connectDB();

    try {
        const [rows] = await connection.execute(
            `SELECT Account_Status AS accountStatus
             FROM Student
             WHERE S_ID = ?`,
            [studentId]
        );

        return rows[0] || null;

    } finally {
        await connection.end();
    }
},


getLecturerStatus: async (lecturerId) => {
    const connection = await connectDB();

    try {
        const [rows] = await connection.execute(
            `SELECT Account_Status AS accountStatus
             FROM Lecturer
             WHERE Lec_ID = ?`,
            [lecturerId]
        );

        return rows[0] || null;

    } finally {
        await connection.end();
    }
},


getStudentTimetable: async (studentId) => {
    const connection = await connectDB();

    try {
        const [timetable] = await connection.execute(
            `SELECT
                cs.Schedule_ID AS scheduleId,
                m.M_Name AS moduleName,
                l.F_Name AS lecturerFirstName,
                l.L_Name AS lecturerLastName,
                cs.Class_Day AS classDay,
                cs.Start_Time AS startTime,
                cs.End_Time AS endTime,
                cs.Room AS room
             FROM Class_Schedule cs
             INNER JOIN Module m ON cs.M_ID = m.M_ID
             INNER JOIN Lecturer l ON cs.Lec_ID = l.Lec_ID
             INNER JOIN Learn ln ON cs.M_ID = ln.M_ID
             WHERE ln.Student_ID = ?
             ORDER BY FIELD(cs.Class_Day,
                'Monday', 'Tuesday', 'Wednesday',
                'Thursday', 'Friday', 'Saturday', 'Sunday'),
                cs.Start_Time`,
            [studentId]
        );

        return timetable;

    } finally {
        await connection.end();
    }
},


getStudentNotifications: async (studentId) => {

    const connection = await connectDB();

    try {
        const [notifications] = await connection.execute(
            `SELECT
                Notification_ID AS notificationId,
                Title AS title,
                Message AS message,
                Created_At AS createdAt,
                Is_Read AS isRead
             FROM Notification
             WHERE S_ID = ?
             ORDER BY Created_At DESC, Notification_ID DESC`,
            [studentId]
        );

        return notifications;

    } finally {
        await connection.end();
    }
},


markNotificationAsRead: async (studentId, notificationId) => {

    const connection = await connectDB();

    try {
        const [result] = await connection.execute(
            `UPDATE Notification
             SET Is_Read = 1
             WHERE Notification_ID = ?
             AND S_ID = ?`,
            [notificationId, studentId]
        );

        return result.affectedRows;

    } finally {
        await connection.end();
    }
},



};


