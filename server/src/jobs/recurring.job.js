const cron = require("node-cron");
const recurringService = require("../services/recurring.service");

const TIMEZONE = process.env.APP_TIMEZONE || "Asia/Ho_Chi_Minh";

// Get current date in the configured timezone
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

// Process all recurring transactions that are due
const runRecurringJob = async () => {
    try {
        const currentDate = getCurrentDate();

        console.log(
            `[Recurring Job] Started processing: ${currentDate}`
        );

        const result = await recurringService.processDueRecurring(
            currentDate
        );

        console.log("[Recurring Job] Processing completed:", result);
    } catch (error) {
        console.error(
            "[Recurring Job] Processing failed:",
            error.message
        );
    }
};

// Start the automatic scheduler
const startRecurringJob = () => {
    console.log("[Recurring Job] Scheduler started.");
    console.log(`[Recurring Job] Timezone: ${TIMEZONE}`);

    // Run once when the server starts
    runRecurringJob();

    // Run every day at 00:05
    const task = cron.schedule(
        "5 0 * * *",
        runRecurringJob,
        {
            timezone: TIMEZONE,
        }
    );

    return task;
};

module.exports = {
    startRecurringJob,
    runRecurringJob,
};