
const express = require("express");

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/refresh
router.post("/refresh", authController.refresh);

// POST /api/auth/forgot-password
router.post("/forgot-password", authController.forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", authController.resetPassword);

// GET /api/auth/me (Protected Route)
router.get("/me", authMiddleware, authController.getMe);
// Update current user profile
router.put("/me", authMiddleware, authController.updateMe);
// PUT /api/auth/change-password (Protected Route)
router.put("/change-password",authMiddleware,authController.changePassword);
// POST /api/auth/logout
router.post("/logout", authController.logout);

module.exports = router;
