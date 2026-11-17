
const express = require("express");
const smartAnalysisController = require("../controllers/smart-analysis.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

// Get smart analysis overview
router.get(
    "/",
    authMiddleware,
    smartAnalysisController.getSmartAnalysis
);

module.exports = router;
