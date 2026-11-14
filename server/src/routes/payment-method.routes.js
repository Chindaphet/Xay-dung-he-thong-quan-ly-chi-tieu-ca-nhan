

const express = require("express");

const paymentMethodController = require("../controllers/payment-method.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// All payment method routes require authentication
router.use(authMiddleware);

// Create a payment method
router.post("/", paymentMethodController.createPaymentMethod);

// Get all payment methods
router.get("/", paymentMethodController.getAllPaymentMethods);

// Get a payment method by ID
router.get("/:paymentMethodId", paymentMethodController.getPaymentMethodById);

// Update a payment method
router.put("/:paymentMethodId", paymentMethodController.updatePaymentMethod);

// Activate or deactivate a payment method
router.patch(
    "/:paymentMethodId/status",
    paymentMethodController.togglePaymentMethod
);

module.exports = router;
