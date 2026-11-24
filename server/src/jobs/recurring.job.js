
const cron = require("node-cron");
const recurringService = require("../services/recurring.service");
const TIMEZONE = process.env.APP_TIMEZONE || "Asia/Ho_Chi_Minh";
const SHUTDOWN_TIMEOUT_MS = 30 * 1000;
// Get current date in the configured timezone.
const getCurrentDate = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const dateParts = Object.fromEntries(
        parts.map(({ type, value }) => [type, value])
    );

    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

// Process all recurring transactions that are due.
const runRecurringJob = async () => {
    try {
        const currentDate = getCurrentDate();
        console.log(`[Recurring Job] Started processing: ${currentDate}`);
        const result = await recurringService.processDueRecurring(
            currentDate
        );
        console.log("[Recurring Job] Processing completed:", result);
    } catch (error) {
        console.error(
            "[Recurring Job] Processing failed:",
            error.stack || error
        );
    }
};

// Start the automatic scheduler.
const startRecurringJob = () => {
    console.log("[Recurring Job] Scheduler started.");
    console.log(`[Recurring Job] Timezone: ${TIMEZONE}`);

    let isStopped = false;
    let currentJob = null;
    let stopPromise = null;
    // Prevent overlapping jobs.
    const executeJob = () => {
        if (isStopped || currentJob) {
            return currentJob;
        }
        currentJob = Promise.resolve()
            .then(() => runRecurringJob())
            .finally(() => {
                currentJob = null;
            });
        return currentJob;
    };

    // Run once when the server starts.
    executeJob();
    // Run every day at 00:05.
    const task = cron.schedule(
        "5 0 * * *",
        executeJob,
        {
            timezone: TIMEZONE,
        }
    );
    // Wait for the currently active recurring job.
    const waitForCurrentJob = async () => {
        while (currentJob) {
            const job = currentJob;
            await job;
        }
    };
    // Stop the scheduler and wait for the active job.
    const stop = () => {
        if (stopPromise) {
            return stopPromise;
        }

        isStopped = true;
        task.stop();

        stopPromise = (async () => {
            let timeoutId;

            try {
                await Promise.race([
                    waitForCurrentJob(),
                    new Promise((_, reject) => {
                        timeoutId = setTimeout(() => {
                            reject(
                                new Error(
                                    `[Recurring Job] Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS / 1000} seconds.`
                                )
                            );
                        }, SHUTDOWN_TIMEOUT_MS);
                    }),
                ]);

                console.log("[Recurring Job] Scheduler stopped.");
            } finally {
                clearTimeout(timeoutId);
            }
        })();

        return stopPromise;
    };
     return {
        stop,
        waitForCurrentJob,
    };
};

module.exports = {
    startRecurringJob,
    runRecurringJob,
};
