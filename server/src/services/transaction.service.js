
const transactionRepository = require("../repositories/transaction.repository");
const categoryRepository = require("../repositories/category.repository");
const paymentMethodRepository = require("../repositories/payment-method.repository");
const { validateTransaction } = require("../validators/transaction.validator");

// Validate transaction input
const validateInput = (data) => {
    const validation = validateTransaction(data);

    if (!validation.isValid) {
        const error = new Error("Transaction validation failed.");
        error.status = 400;
        error.details = validation.errors;
        throw error;
    }
};

// Validate category ownership, status, and type
const validateCategory = async (categoryId, userId, type) => {
    const category =
        await categoryRepository.findActiveByIdAndUserId(
            categoryId,
            userId
        );
    if (!category) {
        const error = new Error("Category not found or inactive.");
        error.status = 400;
        throw error;}
    if (category.type !== type) {
        const error = new Error(
            "Category type does not match transaction type."
        );
        error.status = 400;
        throw error;}
    return category;
};

// Validate payment method ownership and status
const validatePaymentMethod = async (paymentMethodId, userId) => {
    // Payment method is optional
    if (paymentMethodId === undefined || paymentMethodId === null) {
        return null;}

    const paymentMethod =
        await paymentMethodRepository.findActiveByIdAndUserId(
            paymentMethodId,
            userId);

    if (!paymentMethod) {
        const error = new Error(
            "Payment method not found or inactive.");
        error.status = 400;
        throw error;}
    return paymentMethod;
};

// Create a new transaction
const createTransaction = async (userId, data) => {
    validateInput(data);

    const {
        categoryId,
        paymentMethodId = null,
        type,
        amount,
        description = null,
        transactionDate = null,
    } = data;

    await validateCategory(categoryId, userId, type);

    await validatePaymentMethod(paymentMethodId, userId);

    return await transactionRepository.createTransaction({
        userId,
        categoryId,
        paymentMethodId,
        type,
        amount,
        description,
        transactionDate,
    });
};

// Get all transactions belonging to a user
const getAllTransactions = async (userId) => {
    return await transactionRepository.findAllByUserId(userId);
};

// Get one transaction belonging to a user
const getTransactionById = async (transactionsId, userId) => {
    const transaction =
        await transactionRepository.findByIdAndUserId(
            transactionsId,
            userId
        );

    if (!transaction) {
        const error = new Error("Transaction not found.");
        error.status = 404;
        throw error;
    }

    return transaction;
};

// Update an existing transaction
const updateTransaction = async (transactionsId, userId, data) => {
    const existingTransaction =
        await transactionRepository.findByIdAndUserId(
            transactionsId,
            userId
        );

    if (!existingTransaction) {
        const error = new Error("Transaction not found.");
        error.status = 404;
        throw error;
    }

    if (existingTransaction.recurring_id !== null) {
        const error = new Error(
            "Recurring transactions cannot be edited directly."
        );
        error.status = 400;
        throw error;
    }

    validateInput(data);

    await validateCategory(data.categoryId, userId, data.type);

    await validatePaymentMethod(
        data.paymentMethodId,
        userId
    );

    const updatedTransaction =
        await transactionRepository.updateTransaction(
            transactionsId,
            userId,
            data
        );

    return updatedTransaction;
};

// Soft delete a transaction
const deleteTransaction = async (transactionsId, userId) => {
    const existingTransaction =
        await transactionRepository.findByIdAndUserId(
            transactionsId,
            userId
        );

    if (!existingTransaction) {
        const error = new Error("Transaction not found.");
        error.status = 404;
        throw error;
    }

    if (existingTransaction.recurring_id !== null) {
        const error = new Error(
            "Recurring transactions cannot be deleted directly."
        );
        error.status = 400;
        throw error;
    }

    await transactionRepository.softDeleteTransaction(
        transactionsId,
        userId
    );

    return {
        message: "Transaction deleted successfully.",
    };
};

module.exports = {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
};
