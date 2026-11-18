
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const simulatorController = require("../controllers/simulator.controller");

// All simulator routes require authentication
router.use(authMiddleware);

// Run financial simulation
router.post("/", simulatorController.simulate);

module.exports = router;
