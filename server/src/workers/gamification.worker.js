
const gamificationRepository = require("../repositories/gamification.repository");
const gamificationService = require("../services/gamification.service");
const transactionRepository = require("../repositories/transaction.repository");

const BATCH_SIZE = 1;
const POLL_INTERVAL_MS = 5000;
const STALE_EVENT_MINUTES = 10;
const LEASE_RENEW_INTERVAL_MS = 2 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SHUTDOWN_TIMEOUT_MS = 30 * 1000;

// Convert transaction creation time to a date in Thailand timezone.
const getThailandActivityDate = (createdAt) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid transaction creation date.");
    }
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: process.env.APP_TIMEZONE || "Asia/Ho_Chi_Minh",
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
    if (!transactionId) {
        throw new Error("Transaction reference ID is missing.");
    }

    // Verify that the transaction exists, belongs to the event owner,
    // and has not been deleted.
    const transaction =
        await transactionRepository.findActiveTransactionByIdAndUserId(
            transactionId,
            event.user_id
        );

    // Skip deleted or missing transactions without awarding rewards.
    if (!transaction) {
        console.warn(
            `[Gamification Worker] Skipping event ${event.event_id}: transaction not found or already deleted.`
        );
        return;
    }

    // Use the actual creation timestamp from the database.
    const activityDate = getThailandActivityDate(
        transaction.created_at
    );

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
// Process an event while maintaining its ownership lease.

const processEventWithLease = async (event) => {
    let leaseOwnershipUncertain = false;
    let renewalPromise = null;
    let processingError = null;

    const renewalInterval = setInterval(() => {
        if (leaseOwnershipUncertain || renewalPromise) {
            return;
        }
        renewalPromise = (async () => {
            try {
                const renewed =
                    await gamificationRepository.renewGamificationEventLease(
                        event.event_id,
                        event.lease_token
                    );

                if (!renewed) {
                    leaseOwnershipUncertain = true;

                    console.error(
                        `[Gamification Worker] Lease lost for event ${event.event_id}.`
                    );
                }
            } catch (error) {
                leaseOwnershipUncertain = true;

                console.error(
                    `[Gamification Worker] Could not verify lease renewal for event ${event.event_id}:`,
                    error.message
                );
            } finally {
                renewalPromise = null;
            }
        })();
    }, LEASE_RENEW_INTERVAL_MS);

    try {
        await processGamificationEvent(event);
    } catch (error) {
        processingError = error;
    } finally {
        clearInterval(renewalInterval);

        if (renewalPromise) {
            await renewalPromise;
        }
    }

    return {
        leaseOwnershipUncertain,
        processingError,
    };
};

// Process pending events.
let isRunning = false;
const processPendingGamificationEvents = async () => {
    if (isRunning) {
        return;
    }
    isRunning = true;
    let processedCount = 0;
    try {
        // Recover events left processing after an interruption.
        await gamificationRepository.recoverStaleGamificationEvents(STALE_EVENT_MINUTES);
        // Claim events before processing them.
        const events =await gamificationRepository.claimPendingGamificationEvents(
            BATCH_SIZE
        );
        for (const event of events) {
            try {
                const {
                    leaseOwnershipUncertain,
                    processingError,
                } = await processEventWithLease(event);
                if (leaseOwnershipUncertain) {
                    console.error(
                        `[Gamification Worker] Skipping event ${event.event_id}: lease ownership could not be verified.`
                    );
                    continue;
                }
                if (processingError) {
                    throw processingError;
                }
                const processedEvent =
                    await gamificationRepository.markGamificationEventProcessed(
                        event.event_id,
                        event.lease_token
                    );

                if (!processedEvent) {
                    console.error(
                        `[Gamification Worker] Could not mark event ${event.event_id} as processed: event status may have changed.`
                    );
                    continue;
                }

                processedCount += 1;

            } catch (error) {
                console.error(
                    `[Gamification Worker] Event ${event.event_id} failed:`,
                    error.stack || error
                );

                try {
                    const failedEvent =
                        await gamificationRepository.markGamificationEventFailed(
                            event.event_id,
                            event.lease_token,
                            error.message,
                            MAX_ATTEMPTS
                        );

                    if (!failedEvent) {
                        console.error(
                            `[Gamification Worker] Could not mark event ${event.event_id} as failed: event status may have changed.`
                        );
                    }

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
            error.stack || error
        );
    } finally {
        isRunning = false;
    }
};
// Start the worker.
const startGamificationWorker = ({
    batchProcessor = processPendingGamificationEvents,
    pollIntervalMs = POLL_INTERVAL_MS,
} = {}) => {
    console.log("[Gamification Worker] Started.");

    let isStopped = false;
    let currentBatch = null;
    let stopPromise = null;

    const runBatch = () => {
        if (isStopped || currentBatch) {
            return currentBatch;
        }

        currentBatch = Promise.resolve()
            .then(() => batchProcessor())
            .catch((error) => {
                console.error(
                    "[Gamification Worker] Batch processing failed:",
                    error.stack || error
                );
            })
            .finally(() => {
                currentBatch = null;
            });

        return currentBatch;
    };

    // Process pending events immediately.
    runBatch();

    // Continue polling at the configured interval.
    const interval = setInterval(runBatch, pollIntervalMs);

    // Wait for the currently active batch without a timeout.
    const waitForCurrentBatch = async () => {
        while (currentBatch) {
            const batch = currentBatch;
            await batch;
        }
    };

    // Stop polling and wait for the active batch with a timeout.
    const stop = () => {
        if (stopPromise) {
            return stopPromise;
        }

        isStopped = true;
        clearInterval(interval);

        stopPromise = (async () => {
            let timeoutId;

            try {
                await Promise.race([
                    waitForCurrentBatch(),
                    new Promise((_, reject) => {
                        timeoutId = setTimeout(() => {
                            reject(
                                new Error(
                                    `[Gamification Worker] Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS / 1000} seconds.`
                                )
                            );
                        }, SHUTDOWN_TIMEOUT_MS);
                    }),
                ]);

                console.log("[Gamification Worker] Stopped.");
            } finally {
                clearTimeout(timeoutId);
            }
        })();

        return stopPromise;
    };

    return {
        stop,
        waitForCurrentBatch,
    };
};

module.exports = {
    processGamificationEvent,
    processPendingGamificationEvents,
    startGamificationWorker,
};
