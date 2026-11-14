
const recurringService = require("../services/recurring.service");


// Get all recurring transactions
const getAllRecurring = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const recurring =
            await recurringService.getAllRecurring(userId);

        return res.status(200).json({
            success: true,
            data: recurring,
        });

    } catch (error) {
        next(error);
    }
};


// Get one recurring transaction
const getRecurringById = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { recurringId } = req.params;

        const recurring =
            await recurringService.getRecurringById(
                recurringId,
                userId
            );

        return res.status(200).json({
            success: true,
            data: recurring,
        });

    } catch (error) {
        next(error);
    }
};


// Create a recurring transaction
const createRecurring = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const recurring =
            await recurringService.createRecurring(
                userId,
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Recurring transaction created successfully.",
            data: recurring,
        });

    } catch (error) {
        next(error);
    }
};


// Update a recurring transaction
const updateRecurring = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { recurringId } = req.params;

        const recurring =
            await recurringService.updateRecurring(
                recurringId,
                userId,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Recurring transaction updated successfully.",
            data: recurring,
        });

    } catch (error) {
        next(error);
    }
};


// Activate or deactivate a recurring transaction
const toggleRecurring = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { recurringId } = req.params;
        const { isActive } = req.body;

        const recurring =
            await recurringService.toggleRecurring(
                recurringId,
                userId,
                isActive
            );

        return res.status(200).json({
            success: true,
            message: "Recurring transaction status updated successfully.",
            data: recurring,
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    getAllRecurring,
    getRecurringById,
    createRecurring,
    updateRecurring,
    toggleRecurring,
};
