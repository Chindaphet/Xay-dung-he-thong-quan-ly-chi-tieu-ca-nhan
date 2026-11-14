

const isUUID = (value) => {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
};


// Validate payment method data
const validatePaymentMethod = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Payment method data must be an object."],
        };
    }

    const { name, type } = data;

    // Payment method name validation
    if (
        typeof name !== "string" ||
        name.trim().length === 0 ||
        name.trim().length > 100
    ) {
        errors.push(
            "Payment method name must be between 1 and 100 characters."
        );
    }

    // Payment method type validation
    const allowedTypes = [
        "cash",
        "bank_transfer",
        "credit_card",
        "debit_card",
        "e_wallet",
        "other",
    ];

    if (!allowedTypes.includes(type)) {
        errors.push(
            "Payment method type must be cash, bank_transfer, credit_card, debit_card, e_wallet, or other."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};


// Validate payment method update data
const validatePaymentMethodUpdate = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Payment method update data must be an object."],
        };
    }

    const allowedFields = ["name", "type"];
    const keys = Object.keys(data);

    if (keys.length === 0) {
        errors.push("At least one field must be provided.");
    }

    for (const key of keys) {
        if (!allowedFields.includes(key)) {
            errors.push(`Field '${key}' cannot be updated.`);
        }
    }

    if (data.name !== undefined) {
        if (
            typeof data.name !== "string" ||
            data.name.trim().length === 0 ||
            data.name.trim().length > 100
        ) {
            errors.push(
                "Payment method name must be between 1 and 100 characters."
            );
        }
    }

    const allowedTypes = [
        "cash",
        "bank_transfer",
        "credit_card",
        "debit_card",
        "e_wallet",
        "other",
    ];

    if (
        data.type !== undefined &&
        !allowedTypes.includes(data.type)
    ) {
        errors.push(
            "Payment method type must be cash, bank_transfer, credit_card, debit_card, e_wallet, or other."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};


// Validate payment method ID
const validatePaymentMethodId = (paymentMethodId) => {
    return isUUID(paymentMethodId);
};


// Validate payment method active status
const validatePaymentMethodStatus = (isActive) => {
    return typeof isActive === "boolean";
};


module.exports = {
    validatePaymentMethod,
    validatePaymentMethodUpdate,
    validatePaymentMethodId,
    validatePaymentMethodStatus,
};
