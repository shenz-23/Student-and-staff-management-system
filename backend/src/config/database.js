
import mysql from "mysql2/promise";

const connectDB = async () => {
    try {
        const connectionInstance = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log(
            `MySQL connected successfully to database: ${connectionInstance.config.database}`
        );

        return connectionInstance;

    } catch (error) {
        console.log("MySQL connection failed:", error);
        throw error;
    }
};

export default connectDB;


