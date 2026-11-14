
const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from project root
dotenv.config({
    path: path.resolve(__dirname, "../../../.env"),
});

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Handle unexpected database errors
pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error.message);
});

module.exports = pool;