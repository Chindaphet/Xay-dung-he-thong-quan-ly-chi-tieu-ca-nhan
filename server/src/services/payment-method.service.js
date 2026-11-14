
const paymentMethodRepository = require("../repositories/payment-method.repository");

const {
    validatePaymentMethod,
    validatePaymentMethodUpdate,
    validatePaymentMethodId,
    validatePaymentMethodStatus,
} = require("../validators/payment-method.validator");

// Create a standard API error
const createError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// Handle duplicate payment method names
const handleDatabaseError = (error) => {
    if (
        error.code === "23505" &&
        error.constraint === "uq_payment_methods_user_name"
    ) {
        throw createError(
            "A payment method with this name already exists.",
            409
        );
    }

    throw error;
};

// Validate payment method ID
const validateId = (paymentMethodId) => {
    if (!validatePaymentMethodId(paymentMethodId)) {
        throw createError("Invalid payment method ID.");
    }
};

// Find an existing payment method
const getExistingPaymentMethod = async (
    paymentMethodId,
    userId
) => {
    validateId(paymentMethodId);

    const paymentMethod =
        await paymentMethodRepository.findByIdAndUserId(
            paymentMethodId,
            userId
        );

    if (!paymentMethod) {
        throw createError("Payment method not found.", 404);
    }

    return paymentMethod;
};

// Check duplicate payment method name
const checkDuplicatePaymentMethod = async (
    userId,
    name,
    excludePaymentMethodId = null
) => {
    const paymentMethods =
        await paymentMethodRepository.findAllByUserId(
            userId,
            true
        );

    const duplicate = paymentMethods.some((paymentMethod) => {
        return (
            paymentMethod.name === name &&
            paymentMethod.payment_method_id !== excludePaymentMethodId
        );
    });

    if (duplicate) {
        throw createError(
            "A payment method with this name already exists.",
            409
        );
    }
};

// Create a new payment method
const createPaymentMethod = async (userId, data) => {
    const validation = validatePaymentMethod(data);

    if (!validation.isValid) {
        const error = createError(
            "Payment method validation failed."
        );
        error.details = validation.errors;
        throw error;
    }

    const name = data.name.trim();

    await checkDuplicatePaymentMethod(
        userId,
        name
    );

    try {
        return await paymentMethodRepository.createPaymentMethod({
            userId,
            name,
            type: data.type,
        });
    } catch (error) {
        handleDatabaseError(error);
    }
};

// Get all payment methods belonging to a user
const getAllPaymentMethods = async (
    userId,
    includeInactive = false
) => {
    if (typeof includeInactive !== "boolean") {
        throw createError(
            "includeInactive must be a boolean."
        );
    }

    return await paymentMethodRepository.findAllByUserId(
        userId,
        includeInactive
    );
};

// Get one payment method belonging to a user
const getPaymentMethodById = async (
    paymentMethodId,
    userId
) => {
    return await getExistingPaymentMethod(
        paymentMethodId,
        userId
    );
};

// Update an existing payment method
const updatePaymentMethod = async (
    paymentMethodId,
    userId,
    data
) => {
    const validation = validatePaymentMethodUpdate(data);

    if (!validation.isValid) {
        const error = createError(
            "Payment method update validation failed."
        );
        error.details = validation.errors;
        throw error;
    }

    const existingPaymentMethod =
        await getExistingPaymentMethod(
            paymentMethodId,
            userId
        );

    const updatedName =
        data.name !== undefined
            ? data.name.trim()
            : existingPaymentMethod.name;

    await checkDuplicatePaymentMethod(
        userId,
        updatedName,
        paymentMethodId
    );

    const updatedData = {
        name: updatedName,
        type:
            data.type !== undefined
                ? data.type
                : existingPaymentMethod.type,
    };

    try {
        return await paymentMethodRepository.updatePaymentMethod(
            paymentMethodId,
            userId,
            updatedData
        );
    } catch (error) {
        handleDatabaseError(error);
    }
};

// Activate or deactivate a payment method
const togglePaymentMethod = async (
    paymentMethodId,
    userId,
    isActive
) => {
    validateId(paymentMethodId);

    if (!validatePaymentMethodStatus(isActive)) {
        throw createError(
            "Payment method status must be a boolean."
        );
    }

    await getExistingPaymentMethod(
        paymentMethodId,
        userId
    );

    return await paymentMethodRepository.togglePaymentMethod(
        paymentMethodId,
        userId,
        isActive
    );
};

module.exports = {
    createPaymentMethod,
    getAllPaymentMethods,
    getPaymentMethodById,
    updatePaymentMethod,
    togglePaymentMethod,
};
