
const express = require("express");

const dashboardController = require("../controllers/dashboard.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Require authentication for all dashboard routes
router.use(authMiddleware);

// Get dashboard overview
router.get("/overview", dashboardController.getDashboardOverview);

module.exports = router;
