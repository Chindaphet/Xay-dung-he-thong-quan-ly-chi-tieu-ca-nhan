
const express = require("express");

const gamificationController = require(
    "../controllers/gamification.controller"
);

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Get gamification overview
router.get(
    "/",
    authMiddleware,
    gamificationController.getGamificationOverview
);

// Get achievement progress
router.get(
    "/achievement-progress",
    authMiddleware,
    gamificationController.getAchievementProgress
);

// Check and unlock achievements
router.post(
    "/check-achievements",
    authMiddleware,
    gamificationController.checkAchievements
);

module.exports = router;
