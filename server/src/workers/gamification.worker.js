
const gamificationRepository = require("../repositories/gamification.repository");
const gamificationService = require("../services/gamification.service");

const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 5000;
const STALE_EVENT_MINUTES = 10;
const MAX_ATTEMPTS = 5;

// Convert transaction creation time to a date in Thailand timezone.
const getThailandActivityDate = (createdAt) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {throw new Error("Invalid transaction creation date.");}
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
};

// Process one gamification event.
const processGamificationEvent = async (event) => {
    if (event.event_type !== "transaction_created") {
        throw new Error(`Unsupported event type: ${event.event_type}`);
    }

    const transactionId = event.reference_id;
    const payload = event.payload || {};

    if (!transactionId) {throw new Error("Transaction reference ID is missing.");}
    if (!payload.created_at) {throw new Error("Transaction creation timestamp is missing.");}
    const activityDate = getThailandActivityDate(payload.created_at);

    // 1. Award 10 points for creating a transaction.
    await gamificationService.awardPoints({
        userId: event.user_id,
        points: 10,
        eventType: "transaction",
        referenceId: transactionId,
        idempotencyKey: `transaction:${transactionId}`,
        description: "Created a transaction",
    });

    // 2. Update streak and award the 15-point consecutive-day bonus.
    await gamificationRepository.updateStreakAndAwardBonus(
        event.user_id,
        activityDate
    );

    // 3. Check and unlock eligible achievements.
    await gamificationService.checkAchievements(
        event.user_id
    );

    // 4. Update joined challenges and award completion rewards.
    await gamificationRepository.processChallengeEvent(
        event.user_id,
        event.event_id
    );
};

// Process pending events.
let isRunning = false;
const processPendingGamificationEvents = async () => {
    if (isRunning) {return;}
    isRunning = true;
    let processedCount = 0;

    try {
        // Recover events left processing after an interruption.
        await gamificationRepository.recoverStaleGamificationEvents(STALE_EVENT_MINUTES);
        // Claim events before processing them.
        const events =await gamificationRepository.claimPendingGamificationEvents(BATCH_SIZE);
        for (const event of events) {
            try {
                await processGamificationEvent(event);
                await gamificationRepository.markGamificationEventProcessed(
                    event.event_id,
                );
                processedCount += 1;
            } catch (error) {
                console.error(
                    `[Gamification Worker] Event ${event.event_id} failed:`,
                    error.stack || error
                );

                try {
                    await gamificationRepository.markGamificationEventFailed(
                        event.event_id,
                        error.message,
                        MAX_ATTEMPTS
                    );
                } catch (markError) {
                    console.error(
                        `[Gamification Worker] Could not update event ${event.event_id}:`,
                        markError.message
                    );
                }
            }
        }

        if (events.length > 0) {
            console.log(
                `[Gamification Worker] Successfully processed ${processedCount}/${events.length} event(s).`
            );
        }
    } catch (error) {
        console.error(
            "[Gamification Worker] Processing error:",
            error.message
        );
    } finally {
        isRunning = false;
    }
};

// Start the worker.
const startGamificationWorker = () => {
    console.log("[Gamification Worker] Started.");
    processPendingGamificationEvents();
    const interval = setInterval(processPendingGamificationEvents,POLL_INTERVAL_MS);
    return interval;
};

module.exports = {
    processPendingGamificationEvents,
    startGamificationWorker,
};
