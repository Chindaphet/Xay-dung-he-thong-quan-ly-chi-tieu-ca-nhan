

const paymentMethodService = require("../services/payment-method.service");


// Create a new payment method
const createPaymentMethod = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const paymentMethod =
            await paymentMethodService.createPaymentMethod(
                userId,
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Payment method created successfully.",
            data: paymentMethod,
        });
    } catch (error) {
        next(error);
    }
};


// Get all payment methods belonging to the authenticated user
const getAllPaymentMethods = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const includeInactive =
            req.query.includeInactive === "true";

        const paymentMethods =
            await paymentMethodService.getAllPaymentMethods(
                userId,
                includeInactive
            );

        return res.status(200).json({
            success: true,
            data: paymentMethods,
        });
    } catch (error) {
        next(error);
    }
};


// Get one payment method by ID
const getPaymentMethodById = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { paymentMethodId } = req.params;

        const paymentMethod =
            await paymentMethodService.getPaymentMethodById(
                paymentMethodId,
                userId
            );

        return res.status(200).json({
            success: true,
            data: paymentMethod,
        });
    } catch (error) {
        next(error);
    }
};


// Update an existing payment method
const updatePaymentMethod = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { paymentMethodId } = req.params;

        const paymentMethod =
            await paymentMethodService.updatePaymentMethod(
                paymentMethodId,
                userId,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Payment method updated successfully.",
            data: paymentMethod,
        });
    } catch (error) {
        next(error);
    }
};


// Activate or deactivate a payment method
const togglePaymentMethod = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { paymentMethodId } = req.params;
        const { isActive } = req.body;

        const paymentMethod =
            await paymentMethodService.togglePaymentMethod(
                paymentMethodId,
                userId,
                isActive
            );

        return res.status(200).json({
            success: true,
            message: "Payment method status updated successfully.",
            data: paymentMethod,
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    createPaymentMethod,
    getAllPaymentMethods,
    getPaymentMethodById,
    updatePaymentMethod,
    togglePaymentMethod,
};
