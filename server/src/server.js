
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from project root.
dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
});

const app = require("./app");
const pool = require("./config/database");
const { startRecurringJob } = require("./jobs/recurring.job");
const { startGamificationWorker } = require("./workers/gamification.worker");

// Server configuration.
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "localhost";

// Start HTTP server.
const server = app.listen(PORT, HOST, () => {
    console.log("----------------------------------------");
    console.log("Personal Expense Management API");
    console.log(`Server running at: http://${HOST}:${PORT}`);
    console.log(`Health check: http://${HOST}:${PORT}/api/health`);
    console.log("----------------------------------------");
});

// Start recurring transaction scheduler.
const recurringJob = startRecurringJob();

// Start Gamification Worker when enabled.
let gamificationWorker = null;

if (process.env.GAMIFICATION_WORKER_ENABLED !== "false") {
    gamificationWorker = startGamificationWorker();
} else {
    console.log("[Gamification Worker] Disabled by environment variable.");
}

// Handle server errors.
server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error("Server startup error:", error.message);
    }

    process.exit(1);
});

// Close HTTP server and wait for active requests.
const closeHttpServer = () => {
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }

            console.log("[Server] HTTP server closed.");
            resolve();
        });

        // Close idle keep-alive connections.
        server.closeIdleConnections();
    });
};

// Graceful shutdown.
let isShuttingDown = false;

const shutdown = async (signal) => {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(`\n${signal} received. Shutting down server...`);

    try {
        // Stop accepting new HTTP requests immediately.
        const httpClosePromise = closeHttpServer();

        // Stop the recurring scheduler and wait for its active job.
        await recurringJob.stop();

        // Stop the Gamification Worker.
        if (gamificationWorker) {
            try {
                await gamificationWorker.stop();
            } catch (error) {
                console.error(
                    "[Server] Gamification Worker shutdown warning:",
                    error.message
                );

                // A timeout does not cancel the active batch.
                console.log(
                    "[Server] Waiting for the active Gamification batch to finish..."
                );

                await gamificationWorker.waitForCurrentBatch();
            }
        }

        // Wait for all active HTTP requests to finish.
        await httpClosePromise;

        // Close PostgreSQL only after all work has finished.
        await pool.closeDatabase();

        console.log("[Server] PostgreSQL connection pool closed.");
        console.log("[Server] Graceful shutdown completed.");

        process.exitCode = 0;
    } catch (error) {
        console.error(
            "[Server] Graceful shutdown error:",
            error.stack || error
        );

        process.exitCode = 1;
    }
};

// Handle termination signals.
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
