
const isUUID = (value) => {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
};


// Validate positive monetary amount
const validateAmount = (amount) => {
    if (
        amount === undefined ||
        amount === null ||
        typeof amount === "boolean" ||
        typeof amount === "object" ||
        amount === "" ||
        !/^\d+(\.\d{1,2})?$/.test(String(amount))
    ) {
        return false;
    }

    return (
        Number.isFinite(Number(amount)) &&
        Number(amount) > 0 &&
        Number(amount) < 10000000000000
    );
};


// Validate YYYY-MM-DD
const validateDate = (dateString) => {
    if (
        typeof dateString !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {
        return false;
    }

    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};


// Validate recurring data
const validateRecurring = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Recurring data must be an object."],
        };
    }

    const {
        categoryId,
        paymentMethodId,
        type,
        amount,
        description,
        frequency,
        startDate,
        endDate,
    } = data;

    const allowedFields = [
        "categoryId",
        "paymentMethodId",
        "type",
        "amount",
        "description",
        "frequency",
        "startDate",
        "endDate",
    ];

    for (const key of Object.keys(data)) {
        if (!allowedFields.includes(key)) {
            errors.push(`Field '${key}' is not allowed.`);
        }
    }

    if (!isUUID(categoryId)) {
        errors.push("A valid category ID is required.");
    }

    if (
        paymentMethodId !== undefined &&
        paymentMethodId !== null &&
        !isUUID(paymentMethodId)
    ) {
        errors.push("Payment method ID must be a valid UUID.");
    }

    if (!["income", "expense"].includes(type)) {
        errors.push("Transaction type must be income or expense.");
    }

    if (!validateAmount(amount)) {
        errors.push(
            "Amount must be greater than 0 with at most 2 decimal places."
        );
    }

    if (
        description !== undefined &&
        description !== null &&
        (
            typeof description !== "string" ||
            description.length > 1000
        )
    ) {
        errors.push(
            "Description must not exceed 1000 characters."
        );
    }

    if (!["daily", "weekly", "monthly", "yearly"].includes(frequency)) {
        errors.push(
            "Frequency must be daily, weekly, monthly, or yearly."
        );
    }

    if (!validateDate(startDate)) {
        errors.push(
            "Start date must be a valid YYYY-MM-DD date."
        );
    }

    if (
        endDate !== undefined &&
        endDate !== null &&
        !validateDate(endDate)
    ) {
        errors.push(
            "End date must be a valid YYYY-MM-DD date or null."
        );
    }

    if (
        validateDate(startDate) &&
        endDate !== undefined &&
        endDate !== null &&
        validateDate(endDate) &&
        endDate < startDate
    ) {
        errors.push(
            "End date cannot be earlier than start date."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};


// Validate recurring update data
const validateRecurringUpdate = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Recurring update data must be an object."],
        };
    }

    const allowedFields = [
        "categoryId",
        "paymentMethodId",
        "type",
        "amount",
        "description",
        "frequency",
        "startDate",
        "endDate",
    ];

    const keys = Object.keys(data);

    if (keys.length === 0) {
        errors.push("At least one field must be provided.");
    }

    for (const key of keys) {
        if (!allowedFields.includes(key)) {
            errors.push(`Field '${key}' cannot be updated.`);
        }
    }

    if (
        data.categoryId !== undefined &&
        !isUUID(data.categoryId)
    ) {
        errors.push("A valid category ID is required.");
    }

    if (
        data.paymentMethodId !== undefined &&
        data.paymentMethodId !== null &&
        !isUUID(data.paymentMethodId)
    ) {
        errors.push("Payment method ID must be a valid UUID.");
    }

    if (
        data.type !== undefined &&
        !["income", "expense"].includes(data.type)
    ) {
        errors.push("Transaction type must be income or expense.");
    }

    if (
        data.amount !== undefined &&
        !validateAmount(data.amount)
    ) {
        errors.push(
            "Amount must be greater than 0 with at most 2 decimal places."
        );
    }

    if (
        data.description !== undefined &&
        data.description !== null &&
        (
            typeof data.description !== "string" ||
            data.description.length > 1000
        )
    ) {
        errors.push(
            "Description must not exceed 1000 characters."
        );
    }

    if (
        data.frequency !== undefined &&
        !["daily", "weekly", "monthly", "yearly"].includes(data.frequency)
    ) {
        errors.push(
            "Frequency must be daily, weekly, monthly, or yearly."
        );
    }

    if (
        data.startDate !== undefined &&
        !validateDate(data.startDate)
    ) {
        errors.push(
            "Start date must be a valid YYYY-MM-DD date."
        );
    }

    if (
        data.endDate !== undefined &&
        data.endDate !== null &&
        !validateDate(data.endDate)
    ) {
        errors.push(
            "End date must be a valid YYYY-MM-DD date or null."
        );
    }

    if (
        data.startDate !== undefined &&
        data.endDate !== undefined &&
        data.endDate !== null &&
        validateDate(data.startDate) &&
        validateDate(data.endDate) &&
        data.endDate < data.startDate
    ) {
        errors.push(
            "End date cannot be earlier than start date."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};


// Validate recurring ID
const validateRecurringId = (recurringId) => {
    return isUUID(recurringId);
};


// Validate recurring active status
const validateRecurringStatus = (isActive) => {
    return typeof isActive === "boolean";
};


module.exports = {
    validateRecurring,
    validateRecurringUpdate,


    
    validateRecurringId,
    validateRecurringStatus,
};
