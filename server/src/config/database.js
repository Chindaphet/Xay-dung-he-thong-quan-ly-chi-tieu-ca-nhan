const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from project root.
dotenv.config({
    path: path.resolve(__dirname, "../../../.env"),
});

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Enable SSL only when connecting to a cloud database.
    ssl:
        process.env.DB_SSL === "true"
            ? { rejectUnauthorized: true }
            : false,
});

// Handle unexpected database errors
pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error.message);
});

// Close PostgreSQL connection pool gracefully.
let closeDatabasePromise = null;

const closeDatabase = () => {
    if (!closeDatabasePromise) {
        closeDatabasePromise = pool.end();
    }

    return closeDatabasePromise;
};

module.exports = pool;
module.exports.closeDatabase = closeDatabase;