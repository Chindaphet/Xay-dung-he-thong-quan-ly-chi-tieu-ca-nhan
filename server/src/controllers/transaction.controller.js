

const transactionService = require("../services/transaction.service");

// Create a new transaction
const createTransaction = async (req, res, next) => {
    try {
        const transaction = await transactionService.createTransaction(
            req.user.user_id,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Transaction created successfully.",
            data: { transaction },
        });
    } catch (error) {
        next(error);
    }
};

// Get all transactions
const getAllTransactions = async (req, res, next) => {
    try {
        const transactions =
            await transactionService.getAllTransactions(
                req.user.user_id
            );

        return res.status(200).json({
            success: true,
            message: "Transactions retrieved successfully.",
            data: { transactions },
        });
    } catch (error) {
        next(error);
    }
};

// Get one transaction by ID
const getTransactionById = async (req, res, next) => {
    try {
        const transaction =
            await transactionService.getTransactionById(
                req.params.transactionsId,
                req.user.user_id
            );

        return res.status(200).json({
            success: true,
            message: "Transaction retrieved successfully.",
            data: { transaction },
        });
    } catch (error) {
        next(error);
    }
};

// Update a transaction
const updateTransaction = async (req, res, next) => {
    try {
        const transaction =
            await transactionService.updateTransaction(
                req.params.transactionsId,
                req.user.user_id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Transaction updated successfully.",
            data: { transaction },
        });
    } catch (error) {
        next(error);
    }
};

// Delete a transaction
const deleteTransaction = async (req, res, next) => {
    try {
        const result =
            await transactionService.deleteTransaction(
                req.params.transactionsId,
                req.user.user_id
            );

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
};
