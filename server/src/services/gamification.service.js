
const gamificationRepository = require("../repositories/gamification.repository");

// Create a standard service error
const createError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// Validate user ID
const validateUserId = (userId) => {
    if (
        typeof userId !== "string" ||
        userId.trim().length === 0
    ) {
        throw createError("Invalid user ID.");
    }
};

// Get or create user's gamification profile
const getUserGamification = async (userId) => {
    validateUserId(userId);

    return await gamificationRepository.createUserGamification(
        userId
    );
};

// Get user's gamification overview
const getGamificationOverview = async (userId) => {
    validateUserId(userId);
    const profile =await gamificationRepository.createUserGamification(userId);
    return {
        profile,
        nextLevelPoints: getNextLevelPoints(
            profile.total_points
        ),
    };
};

// Calculate points required for the next level
const getNextLevelPoints = (totalPoints) => {
    const currentLevel =gamificationRepository.calculateLevel(Number(totalPoints));
    const nextLevel = currentLevel + 1;
    return {
        currentLevel,
        nextLevel,
        pointsRequired: 100 * currentLevel * (currentLevel + 1) / 2,
    };
};

const awardPoints = async ({
    userId,
    points,
    eventType,
    referenceId = null,
    idempotencyKey,
    description = null, }) => {
    validateUserId(userId);
    if (!Number.isSafeInteger(points) || points <= 0) { throw createError("Points must be a positive integer."); }
    if (typeof eventType !== "string" ||
        eventType.trim().length === 0 ||
        eventType.length > 50) { throw createError("Invalid point event type."); }
    if (
        typeof idempotencyKey !== "string" ||
        idempotencyKey.trim().length === 0 ||
        idempotencyKey.length > 150) { throw createError("Invalid idempotency key."); }
    const result = await gamificationRepository.addPoints({
        userId,
        points,
        eventType,
        referenceId,
        idempotencyKey,
        description,
    });

    return result;
};

// Get current progress for an achievement requirement
const getAchievementProgress = async (userId, requirementType) => {
    validateUserId(userId);

    const profile =
        await gamificationRepository.createUserGamification(userId);

    const transactionStats =
        await gamificationRepository.getTransactionStats(userId);

    switch (requirementType) {
        case "transactions_count":
            return transactionStats.transactions_count;

        case "income_count":
            return transactionStats.income_count;

        case "expense_count":
            return transactionStats.expense_count;

        case "total_points":
            return profile.total_points;

        case "current_streak":
            return profile.current_streak;

        default:
            throw createError(
                "Unsupported achievement requirement type."
            );
    }
};
// Check and unlock eligible achievements
const checkAchievements = async (userId) => {
    validateUserId(userId);

    const achievements =
        await gamificationRepository.findAllAchievementsByUserId(userId);

    const unlockedAchievements = [];

    for (const achievement of achievements) {
        if (achievement.is_unlocked) {
            continue;
        }

        const progress = await getAchievementProgress(
            userId,
            achievement.requirement_type
        );

        if (progress >= achievement.requirement_value) {
            const unlocked =
                await gamificationRepository.unlockAchievementAndAwardPoints(
                    userId,
                    achievement.achievement_id
                );

            if (unlocked) {
                unlockedAchievements.push({
                    ...unlocked,
                    name: achievement.name,
                    points_reward: achievement.points_reward,
                });
            }
        }
    }

    return unlockedAchievements;
};

module.exports = {
    getUserGamification,
    getGamificationOverview,
    awardPoints,
    getAchievementProgress,
    checkAchievements,
};