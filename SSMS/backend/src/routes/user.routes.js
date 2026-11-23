import { Router } from "express";

import {
    loginUser,
    createAccount,
    getStudentDashboard,
    getLecturerDashboard,
    getAllStudents,
    getAdminDashboard,
    getAdminStudents,
    getAdminLecturers,
    getAdminCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    updateStudent,
    deleteStudent,
    updateStudentStatus,
    updateLecturer,
    updateLecturerStatus,
    getStudentTimetable,
    getStudentNotifications,
    markNotificationAsRead,
    getStudentAssignments
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

router.get("/admin/students", verifyToken, getAdminStudents);

router.get("/admin/lecturers", verifyToken, getAdminLecturers);

router.get("/admin/courses", verifyToken, getAdminCourses);

router.post("/admin/courses", verifyAdmin, createCourse);

router.put("/admin/courses/:id", verifyAdmin, updateCourse);

router.delete("/admin/courses/:id", verifyAdmin, deleteCourse);

router.put("/admin/students/:id", verifyAdmin, updateStudent);

router.delete("/admin/students/:id", verifyAdmin, deleteStudent);

router.put("/admin/students/:id/status", verifyAdmin, updateStudentStatus);

router.put("/admin/lecturers/:id", verifyAdmin, updateLecturer);

router.put("/admin/lecturers/:id/status", verifyAdmin, updateLecturerStatus);

router.get("/student/timetable", verifyToken, getStudentTimetable);

router.get("/student/notifications", verifyToken, getStudentNotifications);

router.patch("/student/notifications/:notificationId/read",verifyToken,markNotificationAsRead);

router.get("/student/assignments", verifyToken, getStudentAssignments);

export default router;
