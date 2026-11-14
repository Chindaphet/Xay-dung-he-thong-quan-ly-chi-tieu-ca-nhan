

const express = require("express");
const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

// All category routes require authentication
router.use(authMiddleware);

// Create a category
router.post("/", categoryController.createCategory);

// Get all categories
router.get("/", categoryController.getAllCategories);

// Get a category by ID
router.get("/:categoryId", categoryController.getCategoryById);

// Update a category
router.put("/:categoryId", categoryController.updateCategory);

// Activate or deactivate a category
router.patch("/:categoryId/status",categoryController.toggleCategory);

module.exports = router;
