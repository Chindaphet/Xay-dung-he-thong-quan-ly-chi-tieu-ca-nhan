
const express = require("express");

const settingsController = require("../controllers/settings.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// All settings routes require authentication
router.use(authMiddleware);

// Get user settings
router.get("/", settingsController.getSettings);

// Update user settings
router.put("/", settingsController.updateSettings);

module.exports = router;
