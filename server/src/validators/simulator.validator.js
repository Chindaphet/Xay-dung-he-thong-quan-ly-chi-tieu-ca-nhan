
const isUUID = (value) => {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
};

// Validate month (YYYY-MM)
const validateSimulatorMonth = (month) => {
    if (
        typeof month !== "string" ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ) {
        return false;
    }

    return true;
};

// Validate a non-negative monetary amount
const validateNonNegativeAmount = (amount) => {
    if (
        amount === undefined ||
        amount === null ||
        amount === "" ||
        !/^\d+(\.\d{1,2})?$/.test(String(amount))
    ) {
        return false;
    }

    return (
        Number.isFinite(Number(amount)) &&
        Number(amount) >= 0
    );
};

// Validate expense reduction percentage
const validateReductionPercentage = (percentage) => {
    if (
        percentage === undefined ||
        percentage === null ||
        percentage === "" ||
        !/^\d+(\.\d{1,2})?$/.test(String(percentage))
    ) {
        return false;
    }

    return (
        Number.isFinite(Number(percentage)) &&
        Number(percentage) >= 0 &&
        Number(percentage) <= 100
    );
};

// Validate expense reduction item
const validateExpenseReduction = (item) => {
    if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
    ) {
        return false;
    }

    const allowedFields = [
        "categoryId",
        "reductionPercentage",
    ];

    if (
        Object.keys(item).some(
            (key) => !allowedFields.includes(key)
        )
    ) {
        return false;
    }

    return (
        isUUID(item.categoryId) &&
        validateReductionPercentage(
            item.reductionPercentage
        )
    );
};

// Validate category budget adjustment item
const validateCategoryBudgetAdjustment = (item) => {
    if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
    ) {
        return false;
    }

    const allowedFields = [
        "categoryId",
        "amount",
    ];

    if (
        Object.keys(item).some(
            (key) => !allowedFields.includes(key)
        )
    ) {
        return false;
    }

    return (
        isUUID(item.categoryId) &&
        validateNonNegativeAmount(item.amount)
    );
};

// Validate What-if Simulator request
const validateSimulator = (data) => {
    const errors = [];

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return {
            isValid: false,
            errors: [
                "Simulator data must be an object.",
            ],
        };
    }

    const allowedFields = [
        "month",
        "expenseReductions",
        "budgetAdjustment",
        "monthlySavingsTarget",
    ];

    for (const key of Object.keys(data)) {
        if (!allowedFields.includes(key)) {
            errors.push(
                `Field '${key}' is not allowed.`
            );
        }
    }

    if (!validateSimulatorMonth(data.month)) {
        errors.push(
            "Month must use YYYY-MM format."
        );
    }

    if (
        data.expenseReductions !== undefined
    ) {
        if (!Array.isArray(data.expenseReductions)) {
            errors.push(
                "Expense reductions must be an array."
            );
        } else {
            const categoryIds = new Set();

            data.expenseReductions.forEach(
                (item, index) => {
                    if (!validateExpenseReduction(item)) {
                        errors.push(
                            `Expense reduction at index ${index} is invalid.`
                        );
                        return;
                    }

                    if (categoryIds.has(item.categoryId)) {
                        errors.push(
                            `Duplicate expense reduction category at index ${index}.`
                        );
                    }

                    categoryIds.add(item.categoryId);
                }
            );
        }
    }

    if (data.budgetAdjustment !== undefined) {
        const adjustment = data.budgetAdjustment;

        if (
            !adjustment ||
            typeof adjustment !== "object" ||
            Array.isArray(adjustment)
        ) {
            errors.push(
                "Budget adjustment must be an object."
            );
        } else {
            const allowedBudgetFields = [
                "totalAmount",
                "categoryBudgets",
            ];

            for (const key of Object.keys(adjustment)) {
                if (!allowedBudgetFields.includes(key)) {
                    errors.push(
                        `Budget adjustment field '${key}' is not allowed.`
                    );
                }
            }

            if (
                adjustment.totalAmount !== undefined &&
                !validateNonNegativeAmount(
                    adjustment.totalAmount
                )
            ) {
                errors.push(
                    "Total budget must be a non-negative number with up to 2 decimal places."
                );
            }

            if (
                adjustment.categoryBudgets !== undefined
            ) {
                if (
                    !Array.isArray(
                        adjustment.categoryBudgets
                    )
                ) {
                    errors.push(
                        "Category budgets must be an array."
                    );
                } else {
                    const categoryIds = new Set();

                    adjustment.categoryBudgets.forEach(
                        (item, index) => {
                            if (
                                !validateCategoryBudgetAdjustment(
                                    item
                                )
                            ) {
                                errors.push(
                                    `Category budget at index ${index} is invalid.`
                                );
                                return;
                            }

                            if (categoryIds.has(item.categoryId)) {
                                errors.push(
                                    `Duplicate category budget at index ${index}.`
                                );
                            }

                            categoryIds.add(item.categoryId);
                        }
                    );
                }
            }
        }
    }

    if (
        data.monthlySavingsTarget !== undefined &&
        !validateNonNegativeAmount(
            data.monthlySavingsTarget
        )
    ) {
        errors.push(
            "Monthly savings target must be a non-negative number with up to 2 decimal places."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    isUUID,
    validateSimulatorMonth,
    validateNonNegativeAmount,
    validateReductionPercentage,
    validateSimulator,
};
