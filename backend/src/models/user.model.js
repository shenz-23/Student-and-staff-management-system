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
            const [rows] = await connection.execute(
                `SELECT ${account.id} AS user_id,
                        Email AS email,
                        Password AS password
                 FROM ${account.table}
                 WHERE Email = ?
                 LIMIT 1`,
                [email]
            );

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
                Contact_No AS contactNo
             FROM Student
             ORDER BY S_ID`
        );

        return students;

    } finally {
        await connection.end();
    }
}


};


