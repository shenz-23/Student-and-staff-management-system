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
    }

};


