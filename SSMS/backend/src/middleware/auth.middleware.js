import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication token is required"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Server authentication is not configured"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check whether a student account is still active
        if (decoded.role === "student") {
            const student = await User.getStudentStatus(decoded.user_id);

            if (!student || student.accountStatus !== "Active") {
                return res.status(403).json({
                    message: "Your student account is inactive. Please contact the administrator."
                });
            }
        }

        
        if (decoded.role === "lecturer") {
            const lecturer = await User.getLecturerStatus(decoded.user_id);

            if (!lecturer || lecturer.accountStatus !== "Active") {
                return res.status(403).json({
                    message: "Your lecturer account is inactive. Please contact the administrator."
                });
            }
        }


        req.user = decoded;
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError") {
            return res.status(401).json({
                message: "Invalid or expired authentication token"
            });
        }

        console.error("Authentication error:", error);

        return res.status(500).json({
            message: "Error verifying account access"
        });
    }
};


const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admins can create accounts"
            });
        }

        next();
    });
};

export { verifyToken, verifyAdmin };
