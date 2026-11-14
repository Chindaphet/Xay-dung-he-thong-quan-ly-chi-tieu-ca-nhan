
const express = require("express");
const recurringController = require("../controllers/recurring.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

// All recurring routes require authentication
router.use(authMiddleware);

// Get all recurring transactions
router.get("/",recurringController.getAllRecurring);

// Get one recurring transaction
router.get("/:recurringId",recurringController.getRecurringById);

// Create a recurring transaction
router.post("/",recurringController.createRecurring);

// Update a recurring transaction
router.put("/:recurringId",recurringController.updateRecurring);

// Activate or deactivate a recurring transaction
router.patch("/:recurringId/status",recurringController.toggleRecurring);

module.exports = router;
