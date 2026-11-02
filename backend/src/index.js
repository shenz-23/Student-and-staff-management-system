
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const { default: app } = await import("./app.js");
const { default: connectDB } = await import("./config/database.js");

const startServer = async () => {
    try {
        const connection = await connectDB();
        await connection.end();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.log("Error starting server:", error);
        process.exit(1);
    }
};

startServer();

