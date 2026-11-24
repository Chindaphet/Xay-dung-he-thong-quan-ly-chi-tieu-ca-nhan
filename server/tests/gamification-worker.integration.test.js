
const { test } = require("node:test");
const assert = require("node:assert/strict");

const integrationEnabled =
    process.env.NODE_ENV === "test" &&
    process.env.RUN_GAMIFICATION_INTEGRATION_TESTS === "1" &&
    process.env.DB_NAME === "personal_expense_test";

test(
    "Gamification Worker processes a transaction and prevents duplicate points",
    { skip: !integrationEnabled },
    async () => {
        // Verify the test environment before loading database modules.
        assert.equal(process.env.NODE_ENV, "test");
        assert.equal(process.env.RUN_GAMIFICATION_INTEGRATION_TESTS, "1");
        assert.equal(process.env.DB_NAME, "personal_expense_test");

        const { randomUUID } = require("node:crypto");
        const pool = require("../src/config/database");
        const transactionService = require("../src/services/transaction.service");

        const {
            processPendingGamificationEvents,
            processGamificationEvent,
        } = require("../src/workers/gamification.worker");

        const userId = randomUUID();

        try {
            await pool.query(
                `INSERT INTO users (
                    user_id, username, full_name,
                    email, password_hash
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    userId,
                    `worker_test_${userId}`,
                    "Gamification Worker Test",
                    `${userId}@example.test`,
                    "test-only-password-hash",
                ]
            );

            const categoryResult = await pool.query(
                `INSERT INTO categories (user_id, name, type)
                 VALUES ($1, $2, 'expense')
                 RETURNING category_id`,
                [userId, `Test Category ${userId}`]
            );

            const categoryId = categoryResult.rows[0].category_id;

            const transaction = await transactionService.createTransaction(
                userId,
                {
                    categoryId,
                    type: "expense",
                    amount: 100,
                    description: "Gamification integration test",
                }
            );

            const transactionId = transaction.transactions_id;

            assert.ok(transactionId);

            const eventResult = await pool.query(
                `SELECT *
                 FROM gamification_events
                 WHERE reference_id = $1
                   AND user_id = $2`,
                [transactionId, userId]
            );

            assert.equal(eventResult.rowCount, 1);

            const event = eventResult.rows[0];

            assert.equal(event.status, "pending");

            await processPendingGamificationEvents();

            const processedResult = await pool.query(
                `SELECT status, processed_at, last_error
                 FROM gamification_events
                 WHERE event_id = $1`,
                [event.event_id]
            );

            assert.equal(processedResult.rows[0].status, "processed");
            assert.ok(processedResult.rows[0].processed_at);
            assert.equal(processedResult.rows[0].last_error, null);

            const pointsResult = await pool.query(
                `SELECT points_change, event_type
                 FROM gamification_point_logs
                 WHERE user_id = $1
                   AND idempotency_key = $2`,
                [userId, `transaction:${transactionId}`]
            );

            assert.equal(pointsResult.rowCount, 1);
            assert.equal(pointsResult.rows[0].points_change, 10);
            assert.equal(pointsResult.rows[0].event_type, "transaction");

            const profileResult = await pool.query(
                `SELECT total_points
                 FROM user_gamification
                 WHERE user_id = $1`,
                [userId]
            );

            assert.equal(profileResult.rows[0].total_points, 10);

            // Process the same event again to verify reward idempotency.
            await processGamificationEvent(event);

            const duplicatePointsResult = await pool.query(
                `SELECT COUNT(*)::INTEGER AS count
                 FROM gamification_point_logs
                 WHERE user_id = $1
                   AND idempotency_key = $2`,
                [userId, `transaction:${transactionId}`]
            );

            assert.equal(duplicatePointsResult.rows[0].count, 1);

            const finalProfileResult = await pool.query(
                `SELECT total_points
                 FROM user_gamification
                 WHERE user_id = $1`,
                [userId]
            );

            assert.equal(finalProfileResult.rows[0].total_points, 10);
        } finally {
            try {
                await pool.query(
                    "DELETE FROM transactions WHERE user_id = $1",
                    [userId]
                );
                await pool.query(
                    "DELETE FROM categories WHERE user_id = $1",
                    [userId]
                );
                // Production gamification_events FK does not cascade on user deletion.
                await pool.query(
                    "DELETE FROM gamification_events WHERE user_id = $1",
                    [userId]
                );
                await pool.query(
                    "DELETE FROM users WHERE user_id = $1",
                    [userId]
                );
            } finally {
                await pool.closeDatabase();
            }
        }
    }
);
