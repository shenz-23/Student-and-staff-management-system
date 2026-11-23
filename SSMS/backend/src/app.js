
import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import portalRoutes from "./routes/portal.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/portal", portalRoutes);
app.use((err, _req, res, _next) => {
    console.error("Unhandled API error:", err);
    res.status(500).json({ message: "Internal server error" });
});

export default app;
