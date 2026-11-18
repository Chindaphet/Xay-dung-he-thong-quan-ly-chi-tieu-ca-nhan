
const express = require("express");

const budgetController = require("../controllers/budget.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

// All budget routes require authentication
router.use(authMiddleware);

// Get monthly budget overview
router.get("/", budgetController.getBudgetOverview);

// Create a monthly budget
router.post("/", budgetController.createBudget);

// Update the overall monthly budget
router.put("/:budgetId", budgetController.updateBudget);

// Add a category budget
router.post("/:budgetId/categories",budgetController.createCategoryBudget);

// Update a category budget
router.put("/:budgetId/categories/:categoryId",budgetController.updateCategoryBudget);

// Delete a category budget
router.delete("/:budgetId/categories/:categoryId",budgetController.deleteCategoryBudget);

module.exports = router;
