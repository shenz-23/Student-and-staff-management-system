
import { Router } from "express";
import {
    loginUser,
    createAccount
} from "../controllers/user.controller.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", loginUser);

router.post("/accounts", verifyAdmin, createAccount);

export default router;
