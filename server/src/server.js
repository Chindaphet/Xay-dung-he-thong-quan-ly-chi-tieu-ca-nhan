
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from project root
dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
});

const app = require("./app");
const { startRecurringJob } = require("./jobs/recurring.job");

// Server configuration
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "localhost";

// Start server
const server = app.listen(PORT, HOST, () => {
    console.log("----------------------------------------");
    console.log("Personal Expense Management API");
    console.log(`Server running at: http://${HOST}:${PORT}`);
    console.log(`Health check: http://${HOST}:${PORT}/api/health`);
    console.log("----------------------------------------");
});
// Start recurring transaction scheduler
const recurringJob = startRecurringJob();
// Handle server errors
server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error("Server startup error:", error.message);
    }

    process.exit(1);
});

// Graceful shutdown
const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down server...`);
    recurringJob.stop();
    server.close(() => {
        console.log("Server closed successfully.");
        process.exit(0);
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));