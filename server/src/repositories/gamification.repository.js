
const pool = require("../config/database");
// Create gamification profile if it does not exist
const createUserGamification = async (userId) => {
    const query = `
        INSERT INTO user_gamification (
            user_id
        )
        VALUES ($1)
        ON CONFLICT (user_id)
        DO NOTHING
        RETURNING
            user_gamification_id,
            user_id,
            total_points,
            current_level,
            current_streak,
            longest_streak,
            last_activity_date,
            created_at,
            updated_at;
    `;

    const { rows } = await pool.query(query, [userId]);
    if (rows.length > 0) {return rows[0];}
    return await findUserGamification(userId);
};

// Find gamification profile by user ID
const findUserGamification = async (userId) => {
    const query = `
        SELECT
            user_gamification_id,
            user_id,
            total_points,
            current_level,
            current_streak,
            longest_streak,
            last_activity_date,
            created_at,
            updated_at
        FROM user_gamification
        WHERE user_id = $1
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
};

// Add points and record the point log atomically
const addPoints = async ({
    userId,
    points,
    eventType,
    referenceId = null,
    idempotencyKey,
    description = null,
}) => {
    if (
        typeof userId !== "string" ||
        userId.trim().length === 0
    ) {
        throw new Error("Invalid user ID.");
    }
    if (!Number.isSafeInteger(points) || points <= 0) {
        throw new Error("Points must be a positive integer.");
    }
    if (
        typeof eventType !== "string" ||
        eventType.trim().length === 0 ||
        eventType.length > 50
    ) {
        throw new Error("Invalid point event type.");
    }
    if (
        typeof idempotencyKey !== "string" ||
        idempotencyKey.trim().length === 0 ||
        idempotencyKey.length > 150
    ) {
        throw new Error("Invalid idempotency key.");
    }
    if (
        referenceId !== null &&
        (
            typeof referenceId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(referenceId)
        )
    ) {
        throw new Error("Invalid reference ID.");
    }
    if (
        description !== null &&
        typeof description !== "string"
    ) {
        throw new Error("Description must be a string or null.");
    }
    const client = await pool.connect();
    let transactionStarted = false;
    try {
        await client.query("BEGIN");
        transactionStarted = true;
        // Ensure the user has a gamification profile
        await client.query(
            `
                INSERT INTO user_gamification (user_id)
                VALUES ($1)
                ON CONFLICT (user_id)
                DO NOTHING;
            `,
            [userId]
        );

        // Record the point event
        const logQuery = `
            INSERT INTO gamification_point_logs (
                user_id,
                points_change,
                event_type,
                reference_id,
                idempotency_key,
                description
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (idempotency_key)
            DO NOTHING
            RETURNING point_log_id;
        `;
        const logResult = await client.query(logQuery, [
            userId,
            points,
            eventType,
            referenceId,
            idempotencyKey,
            description,
        ]);
        // Do not award points again for duplicate events
        if (logResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return {
                awarded: false,
                message: "Points have already been awarded.",
            };
        }
        // Update total points and level atomically
        const updateQuery = `
            UPDATE user_gamification
            SET
                total_points = total_points + $1,
                current_level = FLOOR(
                    (
                        SQRT(
                            1 + (8 * (total_points + $1)::NUMERIC / 100)
                        ) - 1
                    ) / 2
                ) + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $2
            RETURNING
                total_points,
                current_level;
        `;
        const updateResult = await client.query(updateQuery, [
            points,
            userId,
        ]);
        await client.query("COMMIT");
        transactionStarted = false;
        return {
            awarded: true,
            points,
            totalPoints: updateResult.rows[0].total_points,
            pointLogId: logResult.rows[0].point_log_id,
        };
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                 error.rollbackError = rollbackError;
            }
        }
        throw error;
    } finally {
        client.release();
    }
};

 // Find and lock pending gamification events
const findPendingGamificationEvents = async (limit = 10) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const query = `
            SELECT
                event_id,
                user_id,
                event_type,
                reference_id,
                event_key,
                payload,
                status,
                attempts,
                available_at,
                created_at
            FROM gamification_events
            WHERE status IN ('pending', 'failed')
              AND available_at <= CURRENT_TIMESTAMP
            ORDER BY created_at ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED;
        `;

        const { rows } = await client.query(query, [limit]);
        await client.query("COMMIT");
        return rows;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Claim pending events while preserving event order per user
const claimPendingGamificationEvents = async (limit = 10) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const query = `
            WITH pending_events AS (
                SELECT candidate.event_id
                FROM gamification_events AS candidate
                WHERE candidate.status = 'pending'
                  AND candidate.available_at <= CURRENT_TIMESTAMP

                  AND NOT EXISTS (
                      SELECT 1
                      FROM gamification_events AS older
                      WHERE older.user_id = candidate.user_id
                        AND older.status IN ('pending', 'processing')
                        AND (
                            older.created_at,
                            older.event_id
                        ) < (
                            candidate.created_at,
                            candidate.event_id
                        )
                  )

                ORDER BY
                    candidate.created_at ASC,
                    candidate.event_id ASC

                LIMIT $1
                FOR UPDATE OF candidate SKIP LOCKED
            )

            UPDATE gamification_events AS events
            SET
                status = 'processing',
                attempts = events.attempts + 1,
                updated_at = CURRENT_TIMESTAMP

            FROM pending_events

            WHERE events.event_id = pending_events.event_id

            RETURNING
                events.event_id,
                events.user_id,
                events.event_type,
                events.reference_id,
                events.event_key,
                events.payload,
                events.attempts,
                events.created_at;
        `;

        const { rows } = await client.query(query, [limit]);

        await client.query("COMMIT");

        return rows;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

 // Mark a gamification event as processed
const markGamificationEventProcessed = async (eventId) => {
    const query = `
        UPDATE gamification_events
        SET
            status = 'processed',
            processed_at = CURRENT_TIMESTAMP,
            last_error = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE event_id = $1
          AND status = 'processing'
        RETURNING
            event_id,
            status,
            processed_at;
    `;

    const { rows } = await pool.query(query, [eventId]);
    return rows[0] || null;
};

 // Mark a gamification event as failed and schedule retry
const markGamificationEventFailed = async (
    eventId,
    errorMessage,
    maxAttempts = 5
) => {
    const query = `
        UPDATE gamification_events
        SET
            status = CASE
                WHEN attempts >= $3 THEN 'failed'
                ELSE 'pending'
            END,
            available_at = CASE
                WHEN attempts >= $3 THEN available_at
                ELSE CURRENT_TIMESTAMP
                    + (
                        LEAST(
                            POWER(2, GREATEST(attempts - 1, 0)),
                            60
                        ) * INTERVAL '1 minute'
                    )
            END,
            last_error = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE event_id = $1
          AND status = 'processing'
        RETURNING
            event_id,
            status,
            attempts,
            available_at,
            last_error;
    `;

    const { rows } = await pool.query(query, [
        eventId,
        String(errorMessage).slice(0, 5000),
        maxAttempts,
    ]);

    return rows[0] || null;
};

 // Recover events that were left processing after a server interruption
const recoverStaleGamificationEvents = async (staleMinutes = 10) => {
    const query = `
        UPDATE gamification_events
        SET
            status = CASE
                WHEN attempts >= 5 THEN 'failed'
                ELSE 'pending'
            END,
            available_at = CURRENT_TIMESTAMP,
            last_error = 'Recovered after processing timeout.',
            updated_at = CURRENT_TIMESTAMP
        WHERE status = 'processing'
          AND updated_at <= CURRENT_TIMESTAMP
              - ($1 * INTERVAL '1 minute')
        RETURNING
            event_id,
            status,
            attempts,
            updated_at;
    `;

    const { rows } = await pool.query(query, [staleMinutes]);

    return rows;
};

const calculateLevel = (totalPoints) => {
    if (totalPoints < 0) return 1;

    return Math.floor(
        (Math.sqrt(1 + (8 * totalPoints / 100)) - 1) / 2
    ) + 1;
};

// Update user's level based on total points
const updateUserLevel = async (userId) => {
    const query = `
        UPDATE user_gamification
        SET
            current_level = FLOOR(
                (SQRT(1 + (8 * total_points::NUMERIC / 100)) - 1) / 2
            ) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING
            total_points,
            current_level;
    `;

    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
};

const updateUserStreak = async (userId, activityDate) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Ensure the user's gamification profile exists
        await client.query(
            `
                INSERT INTO user_gamification (user_id)
                VALUES ($1)
                ON CONFLICT (user_id) DO NOTHING;
            `,
            [userId]
        );

        // Lock the profile to prevent concurrent streak updates
        const profileResult = await client.query(
            `
                SELECT
                    current_streak,
                    longest_streak,
                    last_activity_date
                FROM user_gamification
                WHERE user_id = $1
                FOR UPDATE;
            `,
            [userId]
        );

        const profile = profileResult.rows[0];
        const currentDate = new Date(`${activityDate}T00:00:00Z`);
        if (Number.isNaN(currentDate.getTime()) ||
            currentDate.toISOString().slice(0, 10) !== activityDate) {
            throw new Error("Invalid activity date.");
        }

        const previousDate = profile.last_activity_date
            ? new Date(profile.last_activity_date).toISOString().slice(0, 10)
            : null;

        let currentStreak = profile.current_streak;
        let longestStreak = profile.longest_streak;
        let streakExtended = false;

        if (!previousDate) {
            currentStreak = 1;
        } else if (activityDate > previousDate) {
            const expectedPreviousDate = new Date(currentDate);
            expectedPreviousDate.setUTCDate(
                expectedPreviousDate.getUTCDate() - 1
            );

            const expectedDate = expectedPreviousDate
                .toISOString()
                .slice(0, 10);

            if (previousDate === expectedDate) {
                currentStreak += 1;
                streakExtended = true;
            } else {
                currentStreak = 1;
            }
        }

        longestStreak = Math.max(longestStreak, currentStreak);

        const lastActivityDate =
            !previousDate || activityDate > previousDate
                ? activityDate
                : previousDate;

        const updateResult = await client.query(
            `
                UPDATE user_gamification
                SET
                    current_streak = $1,
                    longest_streak = $2,
                    last_activity_date = $3::DATE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $4
                RETURNING
                    current_streak,
                    longest_streak,
                    last_activity_date;
            `,
            [
                currentStreak,
                longestStreak,
                lastActivityDate,
                userId,
            ]
        );

        await client.query("COMMIT");
        return {
            ...updateResult.rows[0],
            streakExtended,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};


const findAllAchievementsByUserId = async (userId) => {
    const query = `
        SELECT
            a.achievement_id,
            a.name,
            a.description,
            a.icon,
            a.points_reward,
            a.requirement_type,
            a.requirement_value,
            a.is_active,
            ua.unlocked_at,
            CASE
                WHEN ua.user_achievement_id IS NOT NULL
                    THEN TRUE
                ELSE FALSE
            END AS is_unlocked
        FROM achievements a
        LEFT JOIN user_achievements ua
            ON ua.achievement_id = a.achievement_id
            AND ua.user_id = $1
        WHERE a.is_active = TRUE
        ORDER BY a.requirement_value ASC, a.name ASC;
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows;
};

// Find unlocked achievements belonging to a user
const findUnlockedAchievementsByUserId = async (userId) => {
    const query = `
        SELECT
            ua.user_achievement_id,
            ua.achievement_id,
            a.name,
            a.description,
            a.icon,
            a.points_reward,
            ua.unlocked_at
        FROM user_achievements ua
        INNER JOIN achievements a
            ON a.achievement_id = ua.achievement_id
        WHERE ua.user_id = $1
        ORDER BY ua.unlocked_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows;
};

const unlockAchievement = async (userId, achievementId) => {
    const query = `
        INSERT INTO user_achievements (
            user_id,
            achievement_id
        )
        SELECT $1, achievement_id
        FROM achievements
        WHERE achievement_id = $2
          AND is_active = TRUE
        ON CONFLICT (user_id, achievement_id)
        DO NOTHING
        RETURNING
            user_achievement_id,
            user_id,
            achievement_id,
            unlocked_at;
    `;

    const { rows } = await pool.query(query, [
        userId,
        achievementId,
    ]);

    return rows[0] || null;
};

const findAllChallengesByUserId = async (userId) => {
    const query = `
        SELECT
            c.challenge_id,
            c.name,
            c.description,
            c.challenge_type,
            c.requirement_value,
            c.points_reward,
            c.start_date,
            c.end_date,
            c.is_active,
            uc.user_challenge_id,
            COALESCE(uc.current_progress, 0) AS current_progress,
            COALESCE(uc.status, 'not_started') AS status,
            uc.started_at,
            uc.completed_at
        FROM challenges c
        LEFT JOIN user_challenges uc
            ON uc.challenge_id = c.challenge_id
            AND uc.user_id = $1
        WHERE c.is_active = TRUE
          AND (
              c.start_date IS NULL
              OR c.start_date <= CURRENT_DATE
          )
          AND (
              c.end_date IS NULL
              OR c.end_date >= CURRENT_DATE
          )
        ORDER BY c.start_date ASC NULLS LAST, c.name ASC;
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows;
};

// Find one user's challenge progress
const findUserChallengeById = async (userId, challengeId) => {
    const query = `
        SELECT
            user_challenge_id,
            user_id,
            challenge_id,
            current_progress,
            status,
            started_at,
            completed_at
        FROM user_challenges
        WHERE user_id = $1
          AND challenge_id = $2
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        userId,
        challengeId,
    ]);

    return rows[0] || null;
};

const joinChallenge = async (userId, challengeId) => {
    const query = `
        INSERT INTO user_challenges (
            user_id,
            challenge_id
        )
        SELECT
            $1,
            challenge_id
        FROM challenges
        WHERE challenge_id = $2
          AND is_active = TRUE
          AND (
              start_date IS NULL
              OR start_date <= CURRENT_DATE
          )
          AND (
              end_date IS NULL
              OR end_date >= CURRENT_DATE
          )
        ON CONFLICT (user_id, challenge_id)
        DO NOTHING
        RETURNING
            user_challenge_id,
            user_id,
            challenge_id,
            current_progress,
            status,
            started_at,
            completed_at;
    `;

    const { rows } = await pool.query(query, [
        userId,
        challengeId,
    ]);

    return rows[0] || null;
};

const updateChallengeProgress = async (
    userId,
    challengeId,
    progressAmount = 1
) => {
    const query = `
        UPDATE user_challenges AS uc
        SET
            current_progress = LEAST(
                uc.current_progress + $3,
                c.requirement_value
            ),

            status = CASE
                WHEN uc.current_progress + $3 >= c.requirement_value
                    THEN 'completed'
                ELSE 'in_progress'
            END,

            completed_at = CASE
                WHEN uc.current_progress + $3 >= c.requirement_value
                    THEN CURRENT_TIMESTAMP
                ELSE NULL
            END

        FROM challenges AS c

        WHERE uc.challenge_id = c.challenge_id
          AND uc.user_id = $1
          AND uc.challenge_id = $2
          AND uc.status = 'in_progress'
          AND c.is_active = TRUE
          AND (
                c.start_date IS NULL
                OR c.start_date <= CURRENT_DATE
          )
          AND (
              c.end_date IS NULL
              OR c.end_date >= CURRENT_DATE
          )

        RETURNING
            uc.user_challenge_id,
            uc.user_id,
            uc.challenge_id,
            uc.current_progress,
            uc.status,
            uc.started_at,
            uc.completed_at;
    `;

    const { rows } = await pool.query(query, [
        userId,
        challengeId,
        progressAmount,
    ]);

    return rows[0] || null;
};

// Get transaction statistics for achievement requirements
const getTransactionStats = async (userId) => {
    const query = `
        SELECT
            COUNT(*)::INTEGER AS transactions_count,
            COUNT(*) FILTER (
                WHERE type = 'income'
            )::INTEGER AS income_count,
            COUNT(*) FILTER (
                WHERE type = 'expense'
            )::INTEGER AS expense_count
        FROM transactions
        WHERE user_id = $1
          AND deleted_at IS NULL;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
};
// Unlock achievement and award its points atomically
const unlockAchievementAndAwardPoints = async (
    userId,
    achievementId) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const unlockQuery = `
            INSERT INTO user_achievements (
                user_id,
                achievement_id
            )
            SELECT $1, achievement_id
            FROM achievements
            WHERE achievement_id = $2
              AND is_active = TRUE
            ON CONFLICT (user_id, achievement_id)
            DO NOTHING
            RETURNING
                user_achievement_id,
                user_id,
                achievement_id,
                unlocked_at;
        `;

        const unlockResult = await client.query(unlockQuery, [
            userId,
            achievementId,
        ]);

        if (unlockResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return null;
        }

        const rewardQuery = `
            SELECT name, points_reward
            FROM achievements
            WHERE achievement_id = $1;
        `;

        const rewardResult = await client.query(rewardQuery, [
            achievementId,
        ]);

        const achievement = rewardResult.rows[0];
        const points = achievement.points_reward;

        await client.query(
            `
                INSERT INTO user_gamification (user_id)
                VALUES ($1)
                ON CONFLICT (user_id)
                DO NOTHING;
            `,
            [userId]
        );
        if (points > 0) {
            const pointLogResult = await client.query(
                `
                    INSERT INTO gamification_point_logs (
                        user_id,
                        points_change,
                        event_type,
                        reference_id,
                        idempotency_key,
                        description
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (idempotency_key)
                    DO NOTHING
                    RETURNING point_log_id;
                `,
                [
                    userId,
                    points,
                    "achievement",
                    achievementId,
                    `achievement:${userId}:${achievementId}`,
                    `Unlocked achievement: ${achievement.name}`,
                ]
            );

            if (pointLogResult.rowCount > 0) {
                await client.query(
                    `
                        UPDATE user_gamification
                        SET
                            total_points = total_points + $1,
                            current_level = FLOOR(
                                (
                                    SQRT(
                                        1 + (8 * (total_points + $1)::NUMERIC / 100)
                                    ) - 1
                                ) / 2
                            ) + 1,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = $2;
                    `,
                    [points, userId]
                );
            }
        }

        await client.query("COMMIT");
        return {
            ...unlockResult.rows[0],
            name: achievement.name,
            points_reward: points,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const updateStreakAndAwardBonus = async (userId, activityDate) => {
    const client = await pool.connect();
    let transactionStarted = false;
    try {
        await client.query("BEGIN");
        transactionStarted = true;
        // Validate activity date.
        const dateValidation = await client.query(
            `SELECT
                $1::text ~ '^\\d{4}-\\d{2}-\\d{2}$'
                AND TO_CHAR($1::date, 'YYYY-MM-DD') = $1::text
                AS is_valid`,
            [activityDate]
        );

        if (!dateValidation.rows[0].is_valid) {
            throw new Error("Invalid activity date.");
        }

        // Ensure the user's gamification profile exists.
        await client.query(
            `INSERT INTO user_gamification (user_id)
             VALUES ($1)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        // Lock the profile to prevent concurrent streak updates.
        const profileResult = await client.query(
            `SELECT
                current_streak,
                longest_streak,
                last_activity_date
             FROM user_gamification
             WHERE user_id = $1
             FOR UPDATE`,
            [userId]
        );

        const profile = profileResult.rows[0];

        const dateResult = await client.query(
            `SELECT
                $1::date > $2::date AS is_newer,
                $1::date = $2::date + 1 AS is_consecutive`,
            [
                activityDate,
                profile.last_activity_date || activityDate,
            ]
        );

        let currentStreak = profile.current_streak;
        let longestStreak = profile.longest_streak;
        let streakExtended = false;

        if (!profile.last_activity_date) {
            currentStreak = 1;
        } else if (dateResult.rows[0].is_newer) {
            if (dateResult.rows[0].is_consecutive) {
                currentStreak += 1;
                streakExtended = true;
            } else {
                currentStreak = 1;
            }
        }

        const shouldUpdateDate =
            !profile.last_activity_date ||
            dateResult.rows[0].is_newer;

        if (shouldUpdateDate) {
            longestStreak = Math.max(
                longestStreak,
                currentStreak
            );

            await client.query(
                `UPDATE user_gamification
                 SET
                    current_streak = $2,
                    longest_streak = $3,
                    last_activity_date = $4::date,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1`,
                [
                    userId,
                    currentStreak,
                    longestStreak,
                    activityDate,
                ]
            );
        }

        let bonusAwarded = false;

        if (streakExtended) {
            const idempotencyKey =
                `streak:${userId}:${activityDate}`;

            const logResult = await client.query(
                `INSERT INTO gamification_point_logs (
                    user_id,
                    points_change,
                    event_type,
                    idempotency_key,
                    description
                )
                VALUES ($1, 15, 'streak_bonus', $2, $3)
                ON CONFLICT (idempotency_key) DO NOTHING
                RETURNING point_log_id`,
                [
                    userId,
                    idempotencyKey,
                    "Consecutive daily activity bonus",
                ]
            );

            if (logResult.rowCount > 0) {
                await client.query(
                    `UPDATE user_gamification
                     SET
                        total_points = total_points + 15,
                        current_level = FLOOR(
                            (
                                SQRT(
                                    1 + (
                                        8 * (total_points + 15)::NUMERIC / 100
                                    )
                                ) - 1
                            ) / 2
                        ) + 1,
                        updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1`,
                    [userId]
                );
                bonusAwarded = true;
            }
        }
        await client.query("COMMIT");
        transactionStarted = false;
        return {
            currentStreak,
            longestStreak,
            streakExtended,
            bonusAwarded,
            bonusPoints: bonusAwarded ? 15 : 0,
        };
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                error.rollbackError = rollbackError;
            }
        }

        throw error;
    } finally {
        client.release();
    }
};

const processChallengeEvent = async (
    userId,
    eventId,
    progressAmount = 1
) => {
    if (!Number.isSafeInteger(progressAmount) || progressAmount <= 0) {
        throw new Error("Progress amount must be a positive integer.");
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Find active challenges joined by the user.
        const challengeQuery = `
            SELECT
                uc.user_challenge_id,
                uc.challenge_id,
                uc.current_progress,
                c.requirement_value,
                c.points_reward,
                c.name
            FROM user_challenges AS uc
            INNER JOIN challenges AS c
                ON c.challenge_id = uc.challenge_id
            WHERE uc.user_id = $1
              AND uc.status = 'in_progress'
              AND c.is_active = TRUE
              AND (
                    c.start_date IS NULL
                    OR c.start_date <= CURRENT_DATE
              )
              AND (
                  c.end_date IS NULL
                  OR c.end_date >= CURRENT_DATE
              )
            FOR UPDATE OF uc;
        `;

        const { rows: challenges } = await client.query(
            challengeQuery,
            [userId]
        );

        const results = [];

        for (const challenge of challenges) {
            // Record this event once for this challenge.
            const eventResult = await client.query(
                `
                    INSERT INTO user_challenge_events (
                        user_challenge_id,
                        event_id,
                        progress_amount
                    )
                    VALUES ($1, $2, $3)
                    ON CONFLICT (user_challenge_id, event_id)
                    DO NOTHING
                    RETURNING user_challenge_event_id;
                `,
                [
                    challenge.user_challenge_id,
                    eventId,
                    progressAmount,
                ]
            );

            // Skip duplicate events.
            if (eventResult.rowCount === 0) {
                continue;
            }

            const newProgress = Math.min(
                challenge.current_progress + progressAmount,
                challenge.requirement_value
            );

            const isCompleted =
                newProgress >= challenge.requirement_value;

            await client.query(
                `
                    UPDATE user_challenges
                    SET
                        current_progress = $1::INTEGER,
                        status = $2::VARCHAR,
                        completed_at = CASE
                            WHEN $2::VARCHAR = 'completed'
                                THEN CURRENT_TIMESTAMP
                            ELSE NULL
                        END
                    WHERE user_challenge_id = $3::UUID;
                `,
                [
                    newProgress,
                    isCompleted ? "completed" : "in_progress",
                    challenge.user_challenge_id,
                ]
            );

            // Award challenge reward only when completed.
            if (isCompleted && challenge.points_reward > 0) {
                const rewardKey =
                    `challenge:${challenge.user_challenge_id}`;

                const rewardResult = await client.query(
                    `
                        INSERT INTO gamification_point_logs (
                            user_id,
                            points_change,
                            event_type,
                            reference_id,
                            idempotency_key,
                            description
                        )
                        VALUES ($1, $2, 'challenge', $3, $4, $5)
                        ON CONFLICT (idempotency_key)
                        DO NOTHING
                        RETURNING point_log_id;
                    `,
                    [
                        userId,
                        challenge.points_reward,
                        challenge.challenge_id,
                        rewardKey,
                        `Completed challenge: ${challenge.name}`,
                    ]
                );

                if (rewardResult.rowCount > 0) {
                    await client.query(
                        `
                            UPDATE user_gamification
                            SET
                                total_points = total_points + $1::INTEGER,
                                current_level = FLOOR(
                                    (
                                        SQRT(
                                            1 + (
                                                8 * (
                                                    total_points + $1::INTEGER
                                                )::NUMERIC / 100
                                            )
                                        ) - 1
                                    ) / 2
                                ) + 1,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = $2::UUID;
                        `,
                        [challenge.points_reward, userId]
                    );
                }
            }

            results.push({
                challengeId: challenge.challenge_id,
                challengeName: challenge.name,
                currentProgress: newProgress,
                requirementValue: challenge.requirement_value,
                status: isCompleted ? "completed" : "in_progress",
                pointsAwarded: isCompleted
                    ? challenge.points_reward
                    : 0,
            });
        }

        await client.query("COMMIT");

        return results;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createUserGamification,
    findUserGamification,
    addPoints,
    calculateLevel,
    updateUserLevel,
    updateUserStreak,
    findAllAchievementsByUserId,
    findUnlockedAchievementsByUserId,
    unlockAchievement,
    findAllChallengesByUserId,
    findUserChallengeById,
    joinChallenge,
    updateChallengeProgress,
    getTransactionStats,
    unlockAchievementAndAwardPoints,
    findPendingGamificationEvents,
    claimPendingGamificationEvents,
    markGamificationEventProcessed,
    markGamificationEventFailed,
    recoverStaleGamificationEvents,
    updateStreakAndAwardBonus,
    processChallengeEvent,
};