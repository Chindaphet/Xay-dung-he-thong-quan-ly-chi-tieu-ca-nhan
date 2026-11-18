
const isUUID = (value) => {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
};

// Validate budget month (YYYY-MM)
const validateBudgetMonth = (month) => {
    if (
        typeof month !== "string" ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    )
    {
        return false;
    }

    return true;
};

// Validate positive monetary amount
const validateAmount = (amount) => {
    if (
        amount === undefined ||
        amount === null ||
        amount === "" ||
        !/^\d+(\.\d{1,2})?$/.test(String(amount))
    )
    {
        return false;
    }

    return Number(amount) > 0 &&
        Number.isFinite(Number(amount));
};

// Validate budget creation data
const validateBudget = (data) => {
    const errors = [];
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Budget data must be an object."],
        };
    }

    const { month, totalAmount } = data;
    if (!validateBudgetMonth(month)) {
        errors.push(
            "Budget month must use YYYY-MM format."
        );
    }

    if (!validateAmount(totalAmount)) {
        errors.push(
            "Budget total amount must be a positive number with up to 2 decimal places."
        );
    }

    const allowedFields = ["month", "totalAmount"];
    for (const key of Object.keys(data)) {
        if (!allowedFields.includes(key)) {
            errors.push(`Field '${key}' is not allowed.`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate budget update data
const validateBudgetUpdate = (data) => {
    const errors = [];
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Budget update data must be an object."],
        };
    }

    const allowedFields = ["totalAmount"];
    const keys = Object.keys(data);
    if (keys.length === 0) {
        errors.push("At least one field must be provided.");}

    for (const key of keys) {
        if (!allowedFields.includes(key)) {
            errors.push(`Field '${key}' cannot be updated.`);
        }
    }

    if (
        data.totalAmount !== undefined &&
        !validateAmount(data.totalAmount)
    ) {
        errors.push(
            "Budget total amount must be a positive number with up to 2 decimal places."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate category budget data
const validateCategoryBudget = (data) => {
    const errors = [];
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Category budget data must be an object."],
        };
    }

    const allowedFields = ["categoryId", "amount"];
    for (const key of Object.keys(data)) {
        if (!allowedFields.includes(key)) {
            errors.push(`Field '${key}' is not allowed.`);
        }
    }

    if (!isUUID(data.categoryId)) {
        errors.push("A valid category ID is required.");
    }

    if (!validateAmount(data.amount)) {
        errors.push(
            "Category budget amount must be a positive number with up to 2 decimal places."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate category budget update data
const validateCategoryBudgetUpdate = (data) => {
    const errors = [];
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Category budget update data must be an object."],
        };
    }

    const keys = Object.keys(data);
    if (keys.length !== 1 || !keys.includes("amount")) {
        errors.push(
            "Only the amount field can be updated."
        );
    }

    if (
        data.amount !== undefined &&
        !validateAmount(data.amount)
    ) {
        errors.push(
            "Category budget amount must be a positive number with up to 2 decimal places."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate UUID
const validateBudgetId = (budgetId) => {
    return isUUID(budgetId);
};

// Validate category ID
const validateBudgetCategoryId = (categoryId) => {
    return isUUID(categoryId);
};

module.exports = {
    validateBudgetMonth,
    validateAmount,
    validateBudget,
    validateBudgetUpdate,
    validateCategoryBudget,
    validateCategoryBudgetUpdate,
    validateBudgetId,
    validateBudgetCategoryId,
};
