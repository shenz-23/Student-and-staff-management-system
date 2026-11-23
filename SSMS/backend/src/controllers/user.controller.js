import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const loginUser = async (req, res) => {
    try {
        const { role, email, password } = req.body;

        if (!role || !email || !password) {
            return res.status(400).json({
                message: "Role, email and password are required"
            });
        }

        if (!["admin", "student", "lecturer"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const user = await User.findByEmail(role, email);

        if (!user || !user.password) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        
        if (
            (role === "student" || role === "lecturer") &&
            user.accountStatus !== "Active"
        ) {
            return res.status(403).json({
                message: "Your account has been deactivated. Please contact the administrator."
            });
        }


        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: role
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Error logging in"
        });
    }
};


const createAccount = async (req, res) => {
    try {
        const {
            role,
            id,
            firstName,
            lastName,
            email,
            password,
            bod,
            age,
            contactNo,
            nic,
            address,
            qualification,
            salary
        } = req.body;

        if (!role || !["student", "lecturer"].includes(role)) {
            return res.status(400).json({
                message: "Role must be student or lecturer"
            });
        }

        if (
            id === undefined ||
            !Number.isInteger(Number(id)) ||
            Number(id) <= 0 ||
            !firstName ||
            !lastName ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                message: "ID, first name, last name, email and password are required"
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const newId = await User.createAccount(
            role,
            {
                id: Number(id),
                firstName,
                lastName,
                email,
                bod,
                age: age === "" || age === undefined ? null : Number(age),
                contactNo,
                nic,
                address,
                qualification,
                salary: salary === "" || salary === undefined
                    ? null
                    : Number(salary)
            },
            passwordHash,
            req.user.user_id
        );

        return res.status(201).json({
            message: `${role} account created successfully`,
            user: {
                user_id: newId,
                email,
                role
            }
        });
    } catch (error) {
        console.error("Account creation error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "That ID, email or NIC already exists"
            });
        }

        return res.status(500).json({
            message: "Error creating account. Check the backend terminal."
        });
    }
};


const getStudentDashboard = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "This dashboard is only for students"
            });
        }

        const dashboard = await User.getStudentDashboard(
            req.user.user_id
        );

        if (!dashboard) {
            return res.status(404).json({
                message: "Student record not found"
            });
        }

        return res.status(200).json(dashboard);
    } catch (error) {
        console.error("Student dashboard error:", error);

        return res.status(500).json({
            message: "Error loading student dashboard"
        });
    }
};

const getLecturerDashboard = async (req, res) => {
    try {
        if (req.user.role !== "lecturer") {
            return res.status(403).json({
                message: "This dashboard is only for lecturers"
            });
        }

        const dashboard = await User.getLecturerDashboard(req.user.user_id);

        if (!dashboard) {
            return res.status(404).json({
                message: "Lecturer record not found"
            });
        }

        return res.status(200).json(dashboard);

    } catch (error) {
        console.error("Lecturer dashboard error:", error);

        return res.status(500).json({
            message: "Error loading lecturer dashboard"
        });
    }
};


const getAdminDashboard = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const dashboard = await User.getAdminDashboard(
            user.user_id
        );

        if (!dashboard) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        return res.status(200).json(dashboard);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


const getAllStudents = async (req, res) => {
    try {
        if (req.user.role !== "lecturer") {
            return res.status(403).json({
                message: "Only lecturers can view students"
            });
        }

        const students = await User.getAllStudents();

        return res.status(200).json({
            message: "Students retrieved successfully",
            students: students
        });

    } catch (error) {
        console.error("Get students error:", error);

        return res.status(500).json({
            message: "Error retrieving students"
        });
    }
};


const getAdminStudents = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const students = await User.getAllStudents();

        return res.status(200).json({
            students: students
        });

    } catch (error) {
        console.error("Admin students error:", error);

        return res.status(500).json({
            message: "Error retrieving students"
        });
    }
};


const getAdminLecturers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const lecturers = await User.getAllLecturers();

        return res.status(200).json({
            lecturers: lecturers
        });

    } catch (error) {
        console.error("Admin lecturers error:", error);

        return res.status(500).json({
            message: "Error retrieving lecturers"
        });
    }
};


const getAdminCourses = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const courses = await User.getAllCourses();

        return res.status(200).json({
            courses: courses
        });

    } catch (error) {
        console.error("Admin courses error:", error);

        return res.status(500).json({
            message: "Error retrieving courses"
        });
    }
};


const createCourse = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const { courseName } = req.body;
        const courseId = Number(req.body.courseId);

        if (
            !Number.isInteger(Number(courseId)) ||
            courseId <= 0 ||
            typeof courseName !== "string" ||
            !courseName.trim() ||
            courseName.trim().length > 100
        ) {
            return res.status(400).json({
                message: "Enter a valid course ID and course name"
            });
        }

        await User.createCourse(
            courseId,
            courseName.trim(),
            req.user.user_id
        );

        return res.status(201).json({
            message: "Course created successfully"
        });

    } catch (error) {
        console.error("Create course error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Course ID already exists"
            });
        }

        return res.status(500).json({
            message: "Error creating course"
        });
    }
};


const updateCourse = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const courseId = Number(req.params.id);
        const { courseName } = req.body;

        if (
            !Number.isInteger(Number(courseId)) ||
            courseId <= 0 ||
            typeof courseName !== "string" ||
            !courseName.trim() ||
            courseName.trim().length > 100
        ) {
            return res.status(400).json({
                message: "Enter a valid course ID and course name"
            });
        }

        const updated = await User.updateCourse(
            courseId,
            courseName.trim()
        );

        if (updated === 0) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        return res.status(200).json({
            message: "Course updated successfully"
        });

    } catch (error) {
        console.error("Update course error:", error);

        return res.status(500).json({
            message: "Error updating course"
        });
    }
};

const deleteCourse = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const courseId = Number(req.params.id);

        if (!Number.isInteger(Number(courseId)) || courseId <= 0) {
            return res.status(400).json({
                message: "Invalid course ID"
            });
        }

        const deleted = await User.deleteCourse(courseId);

        if (deleted === 0) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        return res.status(200).json({
            message: "Course deleted successfully"
        });

    } catch (error) {
        console.error("Delete course error:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                message: "Cannot delete this course because it is linked to other records"
            });
        }

        return res.status(500).json({
            message: "Error deleting course"
        });
    }
};


const updateStudent = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const studentId = Number(req.params.id);

        const { firstName, lastName, email, contactNo } = req.body;

        if (
            !Number.isInteger(studentId) ||
            studentId <= 0 ||
            typeof firstName !== "string" ||
            !firstName.trim() ||
            typeof lastName !== "string" ||
            !lastName.trim() ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                message: "Enter valid student details"
            });
        }

        const updated = await User.updateStudent(
            studentId,
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            contactNo?.trim() || null
        );

        if (updated === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        return res.status(200).json({
            message: "Student updated successfully"
        });

    } catch (error) {
        console.error("Update student error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "This email is already in use"
            });
        }

        return res.status(500).json({
            message: "Error updating student"
        });
    }
};


const updateLecturer = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const lecturerId = Number(req.params.id);
        const { firstName, lastName, email, contactNo, qualification } = req.body;

        if (!Number.isInteger(lecturerId) || lecturerId <= 0) {
            return res.status(400).json({
                message: "Invalid lecturer ID"
            });
        }

        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                message: "First name, last name and email are required"
            });
        }

        const updated = await User.updateLecturer(
            lecturerId,
            firstName,
            lastName,
            email,
            contactNo || null,
            qualification || null
        );

        if (updated === 0) {
            return res.status(404).json({
                message: "Lecturer not found"
            });
        }

        return res.status(200).json({
            message: "Lecturer updated successfully"
        });

    } catch (error) {
        console.error("Update lecturer error:", error);

        return res.status(500).json({
            message: "Error updating lecturer"
        });
    }
};



const deleteStudent = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const studentId = Number(req.params.id);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                message: "Invalid student ID"
            });
        }

        const deleted = await User.deleteStudent(studentId);

        if (deleted === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        return res.status(200).json({
            message: "Student deleted successfully"
        });

    } catch (error) {
        console.error("Delete student error:", error);

        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.code === "ER_ROW_IS_REFERENCED"
        ) {
            return res.status(409).json({
                message: "Cannot delete this student because they have related academic records"
            });
        }

        return res.status(500).json({
            message: "Error deleting student"
        });
    }
};


const updateStudentStatus = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const studentId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                message: "Invalid student ID"
            });
        }

        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                message: "Invalid account status"
            });
        }

        const updated = await User.updateStudentStatus(studentId, status);

        if (updated === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        return res.status(200).json({
            message: "Student account " +
                (status === "Active" ? "reactivated" : "deactivated") +
                " successfully"
        });

    } catch (error) {
        console.error("Update student status error:", error);

        return res.status(500).json({
            message: "Error updating student status"
        });
    }
};


const updateLecturerStatus = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const lecturerId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(lecturerId) || lecturerId <= 0) {
            return res.status(400).json({
                message: "Invalid lecturer ID"
            });
        }

        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                message: "Invalid account status"
            });
        }

        const updated = await User.updateLecturerStatus(lecturerId, status);

        if (updated === 0) {
            return res.status(404).json({
                message: "Lecturer not found"
            });
        }

        return res.status(200).json({
            message: status === "Active"
                ? "Lecturer account activated successfully"
                : "Lecturer account deactivated successfully"
        });

    } catch (error) {
        console.error("Update lecturer status error:", error);

        return res.status(500).json({
            message: "Error updating lecturer status"
        });
    }
};


export const getStudentTimetable = async (req, res) => {
    try {
        const studentId = req.user.user_id;

        const timetable = await User.getStudentTimetable(studentId);

        return res.status(200).json({
            timetable: timetable
        });

    } catch (error) {
        console.error("Student timetable error:", error);

        return res.status(500).json({
            message: "Failed to load student timetable"
        });
    }
};


export const getStudentNotifications = async (req, res) => {

    try {
        const studentId = req.user.user_id;

        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const notifications = await User.getStudentNotifications(studentId);

        return res.status(200).json({
            notifications: notifications
        });

    } catch (error) {
        console.error("Student notifications error:", error);

        return res.status(500).json({
            message: "Failed to load notifications"
        });
    }
};


const getStudentAssignments = async (req, res) => {
    try {
        const studentId = req.user.user_id;

        const assignments = await User.getStudentAssignments(studentId);

        return res.status(200).json({
            message: "Assignments retrieved successfully",
            assignments: assignments
        });

    } catch (error) {
        console.error("Student assignments error:", error);

        return res.status(500).json({
            message: "Failed to retrieve assignments"
        });
    }
};



const markNotificationAsRead = async (req, res) => {
    try {
        const studentId = req.user.user_id;
        const notificationId = Number(req.params.notificationId);

        if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const affectedRows = await User.markNotificationAsRead(
            studentId,
            notificationId
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            message: "Notification marked as read"
        });

    } catch (error) {
        console.error("Mark notification error:", error);

        return res.status(500).json({
            message: "Failed to mark notification as read"
        });
    }
};



export { 
        loginUser,
        updateStudent,
        markNotificationAsRead,
        deleteStudent,
        createAccount, 
        getStudentDashboard, 
        getLecturerDashboard,
        getAdminDashboard,
        getAllStudents,
        getAdminStudents,
        getAdminLecturers,
        getAdminCourses,
        createCourse,
        updateCourse,
        deleteCourse,
        updateStudentStatus,
        updateLecturer,
        updateLecturerStatus,
        getStudentAssignments
    };


