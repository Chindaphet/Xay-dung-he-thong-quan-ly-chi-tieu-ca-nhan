
const budgetRepository = require("../repositories/budget.repository");
const {
    validateBudgetMonth,
    validateBudget,
    validateBudgetUpdate,
    validateCategoryBudget,
    validateCategoryBudgetUpdate,
    validateBudgetId,
    validateBudgetCategoryId,
} = require("../validators/budget.validator");

// Create a standard API error
const createError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// Handle database errors
const handleDatabaseError = (error) => {
    if (error.code === "23505") {
        throw createError("A budget or category budget already exists.",409);}
    if (error.code === "23503") {
        throw createError("The referenced budget or category does not exist.",400);}
    if (error.code === "23514") {
        throw createError(
            "Budget data violates a database constraint.",
            400
        );
    }

    throw error;
};

// Validate budget ID
const validateId = (budgetId) => {
    if (!validateBudgetId(budgetId)) {
        throw createError("Invalid budget ID.");
    }
};

// Validate category ID
const validateCategoryId = (categoryId) => {
    if (!validateBudgetCategoryId(categoryId)) {
        throw createError("Invalid category ID.");
    }
};

// Find an existing budget
const getExistingBudget = async (budgetId, userId) => {
    validateId(budgetId);
    const budget = await budgetRepository.findByIdAndUserId(
        budgetId,
        userId
    );
    if (!budget) {
        throw createError("Budget not found.", 404);
    }
    return budget;
};

// Validate request data
const checkValidation = (validation, message) => {
    if (!validation.isValid) {
        const error = createError(message);
        error.details = validation.errors;
        throw error;
    }
};

// Calculate category budget summary
const calculateCategoryBudgetSummary = (categoryBudgets) => {
    const allocatedAmount = categoryBudgets.reduce(
        (total, item) => total + Number(item.budget_amount),
        0
    );
    return {
        allocatedAmount: allocatedAmount.toFixed(2),
    };
};

// Get monthly budget overview
const getBudgetOverview = async (userId, month) => {
    if (!validateBudgetMonth(month)) {
        throw createError(
            "Budget month must use YYYY-MM format."
        );
    }
    const budgetMonth = `${month}-01`;
    const budget = await budgetRepository.findByUserIdAndMonth(
        userId,
        budgetMonth
    );
    if (!budget) {
        return {
            month: budgetMonth,
            budget: null,
            categoryBudgets: [],
            categoryBudgetSummary: {
                allocatedAmount: "0.00",
                isExceeded: false,
                exceededAmount: "0.00",
            },
        };
    }
    const [
        totalSpent,
        categoryBudgets,
    ] = await Promise.all([
        budgetRepository.getTotalSpent(
            userId,
            budgetMonth
        ),

        budgetRepository.getCategoryBudgets(
            budget.budget_id,
            userId,
            budgetMonth
        ),
    ]);

    const totalAmount = Number(budget.total_amount);
    const spentAmount = Number(totalSpent.total_spent);
    const remainingAmount = totalAmount - spentAmount;
    const allocatedAmount = categoryBudgets.reduce(
        (total, item) => total + Number(item.budget_amount),0);
    const exceededAmount = Math.max( allocatedAmount - totalAmount,0);
    const formattedCategoryBudgets = categoryBudgets.map(
        (item) => {
            const categoryBudget = Number(item.budget_amount);
            const categorySpent = Number(item.total_spent);
            return {
                budgetCategoryId: item.budget_category_id,
                categoryId: item.category_id,
                categoryName: item.category_name,
                categoryColor: item.category_color,
                categoryIcon: item.category_icon,
                categoryIsActive: item.category_is_active,

                budgetAmount: item.budget_amount,
                totalSpent: item.total_spent,

                remainingAmount: (
                    categoryBudget - categorySpent
                ).toFixed(2),
            };
        }
    );

    return {
        month: budgetMonth,

        budget: {
            budgetId: budget.budget_id,
            totalAmount: budget.total_amount,
            totalSpent: totalSpent.total_spent,
            remainingAmount: remainingAmount.toFixed(2),
            isExceeded: remainingAmount < 0,
        },
        categoryBudgets: formattedCategoryBudgets,
        categoryBudgetSummary: {
            allocatedAmount: allocatedAmount.toFixed(2),
            isExceeded: exceededAmount > 0,
            exceededAmount: exceededAmount.toFixed(2),
        },
    };
};

// Create a monthly budget
const createBudget = async (userId, data) => {
    const validation = validateBudget(data);

    checkValidation(
        validation,
        "Budget validation failed."
    );

    const budgetMonth = `${data.month}-01`;
    try {
        const existingBudget =
            await budgetRepository.findByUserIdAndMonth(
                userId,
                budgetMonth
            );

        if (existingBudget) {
            throw createError(
                "A budget already exists for this month.",
                409
            );
        }

        return await budgetRepository.createBudget({
            userId,
            month: budgetMonth,
            totalAmount: data.totalAmount,
        });
    } catch (error) {
        if (error.status) {
            throw error;
        }

        handleDatabaseError(error);
    }
};

// Update the overall monthly budget
const updateBudget = async (budgetId,userId,data) => {
    const validation = validateBudgetUpdate(data);
    checkValidation(
        validation,
        "Budget update validation failed."
    );

    await getExistingBudget(budgetId, userId);
    try {
        return await budgetRepository.updateBudget(
            budgetId,
            userId,
            data.totalAmount
        );
    } catch (error) {
        handleDatabaseError(error);
    }
};

// Validate category for a new category budget
const validateNewCategory = async (categoryId,userId) => {
    const category = await budgetRepository.findCategoryByIdAndUserId(
        categoryId,
        userId
    );

    if (!category) {
        throw createError("Category not found.", 404);}
    if (category.type !== "expense") {
        throw createError(
            "Only expense categories can have a budget.",
            400
        );
    }

    if (!category.is_active) {
        throw createError(
            "Inactive categories cannot receive a new budget.",
            400
        );
    }

    return category;
};


// Add a category budget
const createCategoryBudget = async (budgetId,userId,data) => {
    const validation = validateCategoryBudget(data);
    checkValidation(
        validation,
        "Category budget validation failed."
    );

    await getExistingBudget(budgetId, userId);
    await validateNewCategory(data.categoryId,userId);
    try {
        return await budgetRepository.createCategoryBudget({
            budgetId,
            userId,
            categoryId: data.categoryId,
            amount: data.amount,
        });
    } catch (error) {
        handleDatabaseError(error);
    }
};

// Update a category budget
const updateCategoryBudget = async (budgetId,categoryId,userId,data) => {
    const validation = validateCategoryBudgetUpdate(data);
    checkValidation(
        validation,
        "Category budget update validation failed."
    );

    validateCategoryId(categoryId);
    await getExistingBudget(budgetId, userId);
    const existingCategoryBudget =
        await budgetRepository.findCategoryBudget(
            budgetId,
            userId,
            categoryId
        );
    if (!existingCategoryBudget) {
        throw createError(
            "Category budget not found.",
            404
        );
    }

    try {
        return await budgetRepository.updateCategoryBudget(
            budgetId,
            userId,
            categoryId,
            data.amount
        );
    } catch (error) {
        handleDatabaseError(error);
    }
};

// Delete a category budget
const deleteCategoryBudget = async (budgetId,categoryId,userId) => {
    validateId(budgetId);
    validateCategoryId(categoryId);
    await getExistingBudget(budgetId, userId);
    const deleted =
        await budgetRepository.deleteCategoryBudget(
            budgetId,
            userId,
            categoryId
        );

    if (!deleted) {
        throw createError(
            "Category budget not found.",
            404
        );
    }

    return deleted;
};

module.exports = {
    getBudgetOverview,
    createBudget,
    updateBudget,
    createCategoryBudget,
    updateCategoryBudget,
    deleteCategoryBudget,
};
