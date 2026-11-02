import { Router } from "express";

import {
    loginUser,
    createAccount,
    getStudentDashboard,
    getLecturerDashboard,
    getAllStudents ,
    getAdminDashboard
} from "../controllers/user.controller.js";

import {
    verifyAdmin,
    verifyToken
} from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", loginUser);

router.post("/accounts", verifyAdmin, createAccount);

router.get("/student/dashboard", verifyToken, getStudentDashboard);

router.get("/lecturer/dashboard", verifyToken, getLecturerDashboard);

router.get("/students", verifyToken, getAllStudents);

router.get("/admin/dashboard", verifyToken, getAdminDashboard);

export default router;
