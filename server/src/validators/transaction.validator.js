
const isUUID = (value) => {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
};

// Validate transaction data
const validateTransaction = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Transaction data must be an object."],
        };
    }

    const {
        categoryId,
        paymentMethodId,
        type,
        amount,
        description,
        transactionDate,
        recurringId,
        recurringOccurrenceDate,
    } = data;

    // Category validation
    if (!categoryId) {
        errors.push("Category is required.");
    } else if (!isUUID(categoryId)) {
        errors.push("Category ID must be a valid UUID.");
    }

    // Transaction type validation
    if (!["income", "expense"].includes(type)) {
        errors.push("Transaction type must be income or expense.");
    }

    // Amount validation
    const amountString = String(amount);

    if (
        amount === undefined ||
        amount === null ||
        typeof amount === "boolean" ||
        typeof amount === "object" ||
        !/^\d+(\.\d{1,2})?$/.test(amountString) ||
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0 ||
        Number(amount) >= 10000000000000
    ) {
        errors.push(
            "Amount must be greater than 0 with at most 2 decimal places."
        );
    }

    // Payment method validation
    if (
        paymentMethodId !== undefined &&
        paymentMethodId !== null &&
        !isUUID(paymentMethodId)
    ) {
        errors.push("Payment method ID must be a valid UUID.");
    }

    // Description validation
    if (
        description !== undefined &&
        description !== null &&
        (typeof description !== "string" || description.length > 1000)
    ) {
        errors.push("Description must not exceed 1000 characters.");
    }

    // Transaction date validation
    if (transactionDate !== undefined) {
        const validDate =
            typeof transactionDate === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(transactionDate) &&
            !Number.isNaN(Date.parse(`${transactionDate}T00:00:00Z`)) &&
            new Date(`${transactionDate}T00:00:00Z`)
                .toISOString()
                .slice(0, 10) === transactionDate;

        if (!validDate) {
            errors.push(
                "Transaction date must be a valid YYYY-MM-DD date."
            );
        }
    }

    // Recurring transactions must be created by the recurring scheduler
    if (recurringId !== undefined && recurringId !== null) {
        errors.push("Recurring transactions cannot be created directly.");
    }

    if (
        recurringOccurrenceDate !== undefined &&
        recurringOccurrenceDate !== null
    ) {
        errors.push(
            "Recurring occurrence date cannot be provided directly."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateTransaction,
};
