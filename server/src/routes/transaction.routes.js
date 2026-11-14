

const express = require("express");
const transactionController = require("../controllers/transaction.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

// Require authentication for all transaction routes
router.use(authMiddleware);

// Create a transaction
router.post("/", transactionController.createTransaction);

// Get all transactions
router.get("/", transactionController.getAllTransactions);

// Get a transaction by ID
router.get("/:transactionsId", transactionController.getTransactionById);

// Update a transaction
router.put("/:transactionsId", transactionController.updateTransaction);

// Soft delete a transaction
router.delete("/:transactionsId", transactionController.deleteTransaction);

module.exports = router;
