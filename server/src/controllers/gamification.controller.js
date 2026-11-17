
const gamificationService = require(
    "../services/gamification.service"
);

// Get gamification overview
const getGamificationOverview = async (req, res, next) => {
    try {
        const overview = await gamificationService.getGamificationOverview(
            req.user.user_id
        );

        return res.status(200).json({
            success: true,
            data: overview,
        });
    } catch (error) {
        next(error);
    }
};

// Award points
const awardPoints = async (req, res, next) => {
    try {
        const result = await gamificationService.awardPoints({
            userId: req.user.user_id,
            ...req.body,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Update user streak
const updateStreak = async (req, res, next) => {
    try {
        const { activityDate } = req.body;

        const result = await gamificationService.updateStreak(
            req.user.user_id,
            activityDate
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Get achievement progress
const getAchievementProgress = async (req, res, next) => {
    try {
        const { requirementType } = req.query;

        const progress = await gamificationService.getAchievementProgress(
            req.user.user_id,
            requirementType
        );

        return res.status(200).json({
            success: true,
            data: {
                requirementType,
                progress,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Check and unlock achievements
const checkAchievements = async (req, res, next) => {
    try {
        const achievements = await gamificationService.checkAchievements(
            req.user.user_id
        );

        return res.status(200).json({
            success: true,
            data: achievements,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getGamificationOverview,
    awardPoints,
    updateStreak,
    getAchievementProgress,
    checkAchievements,
};
