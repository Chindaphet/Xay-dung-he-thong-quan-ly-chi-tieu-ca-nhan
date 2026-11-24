
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
const HOST = process.env.HOST || "0.0.0.0";

// Background job references.
let recurringJob = null;
let gamificationWorker = null;

// Prevent duplicate shutdown operations.
let shutdownPromise = null;
let isShuttingDown = false;
let httpServerClosePromise = null;
let httpServerStartupPromise = null;
// Start HTTP server.
const server = app.listen(PORT, HOST);
// Track HTTP server startup.
httpServerStartupPromise = new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
});
server.on("listening", () => {
    console.log("----------------------------------------");
    console.log("Personal Expense Management API");
    console.log(`Server running at: http://${HOST}:${PORT}`);
    console.log(`Health check: http://${HOST}:${PORT}/api/health`);
    console.log("----------------------------------------");
    if (isShuttingDown) {
        closeHttpServer();
        return;
    }
    try {
        recurringJob = startRecurringJob();
        if (process.env.GAMIFICATION_WORKER_ENABLED !== "false") {
            gamificationWorker = startGamificationWorker();
        } else {
            console.log(
                "[Gamification Worker] Disabled by environment variable."
            );
        }
    } catch (error) {
        console.error(
            "[Server] Background job startup failed:",
            error.stack || error
        );
        shutdown("STARTUP_ERROR");
    }
});

// Handle server errors.
server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error("Server startup error:", error.message);
    }

    shutdown("STARTUP_ERROR");
});

// Close HTTP server and wait for active requests.
const closeHttpServer = () => {
    if (httpServerClosePromise) {
        return httpServerClosePromise;
    }
    httpServerClosePromise = (async () => {
        // Wait until the HTTP server finishes starting.
        try {
            await httpServerStartupPromise;
        } catch (error) {
            // The server failed to start, so there is nothing to close.
            console.error(
                "[Server] HTTP server did not start:",
                error.message
            );
            return;
        }
        // Close the HTTP server and wait for active requests.
        await new Promise((resolve, reject) => {
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
    })();

    return httpServerClosePromise;
};

// Stop a background task and wait for its active work.
const stopBackgroundTask = async (
    name,
    task,
    waitForCurrentWork
) => {
    if (!task) {
        return;
    }
    try {
        await task.stop();
    } catch (error) {
        console.error(
            `[Server] ${name} shutdown warning:`,
            error.message
        );
        // A timeout does not cancel the active work.
        console.log(
            `[Server] Waiting for the active ${name} to finish...`
        );

        await waitForCurrentWork();
    }
};

// Graceful shutdown.
const shutdown = (signal) => {
    if (shutdownPromise) {
        return shutdownPromise;
    }
    isShuttingDown = true;
    shutdownPromise = (async () => {
        console.log(
            `\n${signal} received. Shutting down server...`
        );
        const shutdownErrors = [];
        // Stop accepting new HTTP requests immediately.
        const httpClosePromise = closeHttpServer();
        // Stop the recurring scheduler.
        try {
            await stopBackgroundTask(
                "Recurring Job",
                recurringJob,
                () => recurringJob.waitForCurrentJob()
            );
        } catch (error) {
            shutdownErrors.push(error);
            console.error(
                "[Server] Recurring Job could not finish:",
                error.stack || error
            );
        }

        // Stop the Gamification Worker.
        try {
            await stopBackgroundTask(
                "Gamification Worker",
                gamificationWorker,
                () => gamificationWorker.waitForCurrentBatch()
            );
        } catch (error) {
            shutdownErrors.push(error);
            console.error(
                "[Server] Gamification Worker could not finish:",
                error.stack || error
            );
        }

        // Wait for all active HTTP requests to finish.
        let httpClosed = false;

        try {
            await httpClosePromise;
            httpClosed = true;
        } catch (error) {
            shutdownErrors.push(error);
            console.error(
                "[Server] HTTP server shutdown failed:",
                error.stack || error
            );
        }

        // Close PostgreSQL only when HTTP and background work have finished.
        if (
            httpClosed &&
            shutdownErrors.length === 0
        ) {
            try {
                await pool.closeDatabase();

                console.log(
                    "[Server] PostgreSQL connection pool closed."
                );
            } catch (error) {
                shutdownErrors.push(error);
                console.error(
                    "[Server] PostgreSQL shutdown failed:",
                    error.stack || error
                );
            }
        } else {
            console.error(
                "[Server] PostgreSQL pool was not closed because shutdown was incomplete."
            );
        }
        if (
            shutdownErrors.length === 0 &&
            signal !== "STARTUP_ERROR"
        ) {
            console.log(
                "[Server] Graceful shutdown completed."
            );
            process.exitCode = 0;
        } else {
            if (signal === "STARTUP_ERROR") {
                console.error(
                    "[Server] Startup failed. Shutdown finished with exit code 1."
                );
            } else {
                console.error(
                    `[Server] Shutdown completed with ${shutdownErrors.length} error(s).`
                );
            }
            process.exitCode = 1;
        }
    })();
    return shutdownPromise;
};

// Handle termination signals.
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
