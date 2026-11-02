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


export { loginUser,
        createAccount, 
        getStudentDashboard, 
        getLecturerDashboard,
        getAdminDashboard,
        getAllStudents };


