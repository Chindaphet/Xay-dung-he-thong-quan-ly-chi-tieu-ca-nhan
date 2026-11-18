
const simulatorRepository = require("../repositories/simulator.repository");
const categoryRepository = require("../repositories/category.repository");
const {
    validateSimulator,
} = require("../validators/simulator.validator");

// Create a standard API error
const createError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// Validate request data
const checkValidation = (validation) => {
    if (!validation.isValid) {
        const error = createError("Simulator validation failed.");
        error.details = validation.errors;
        throw error;
    }
};

// Convert database numeric values safely
const toAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
};

// Format amounts to two decimal places
const formatAmount = (value) => Number(value.toFixed(2)).toFixed(2);

// Simulate monthly financial changes without modifying real data
const simulate = async (userId, data) => {
    const validation = validateSimulator(data);
    checkValidation(validation);

    const {
        month,
        expenseReductions = [],
        budgetAdjustment = {},
        monthlySavingsTarget = 0,
    } = data;

    // Read actual monthly financial data
    const [
        financialSummary,
        expenseCategories,
        monthlyBudget,
    ] = await Promise.all([
        simulatorRepository.getMonthlyFinancialSummary(
            userId,
            month
        ),
        simulatorRepository.getMonthlyExpenseByCategory(
            userId,
            month
        ),
        simulatorRepository.getMonthlyBudget(
            userId,
            month
        ),
    ]);

    const totalIncome = toAmount(financialSummary.total_income);
    const totalExpenses = toAmount(financialSummary.total_expenses);

    // Validate and calculate expense reductions
    const reductionMap = new Map();

    for (const reduction of expenseReductions) {
        const category = await categoryRepository.findActiveByIdAndUserId(
            reduction.categoryId,
            userId
        );

        if (!category) {
            throw createError(
                "Expense category not found or inactive.",
                404
            );
        }

        if (category.type !== "expense") {
            throw createError(
                "Only expense categories can be reduced."
            );
        }

        const actualCategory = expenseCategories.find(
            (item) => item.category_id === reduction.categoryId
        );

        const actualSpent = actualCategory
            ? toAmount(actualCategory.total_spent)
            : 0;

        const percentage = Number(reduction.reductionPercentage);
        const reductionAmount = actualSpent * percentage / 100;

        reductionMap.set(reduction.categoryId, {
            categoryId: category.category_id,
            categoryName: category.name,
            actualSpent,
            reductionPercentage: percentage,
            reductionAmount,
            projectedSpent: actualSpent - reductionAmount,
        });
    }

    const reductionDetails = Array.from(
        reductionMap.values()
    );

    const totalExpenseReduction = reductionDetails.reduce(
        (total, item) => total + item.reductionAmount,
        0
    );

    const projectedExpenses = Math.max(
        totalExpenses - totalExpenseReduction,
        0
    );

    // Read and simulate budget adjustments
    const originalTotalBudget = monthlyBudget
        ? toAmount(monthlyBudget.total_amount)
        : 0;

    const adjustedTotalBudget =
        budgetAdjustment.totalAmount !== undefined
            ? Number(budgetAdjustment.totalAmount)
            : originalTotalBudget;

    const originalCategoryBudgets = monthlyBudget
        ? monthlyBudget.category_budgets
        : [];

    const categoryBudgetMap = new Map(
        originalCategoryBudgets.map((item) => [
            item.categoryId,
            toAmount(item.amount),
        ])
    );

    const categoryBudgetAdjustments =
        budgetAdjustment.categoryBudgets || [];

    for (const adjustment of categoryBudgetAdjustments) {
        const category = await categoryRepository.findActiveByIdAndUserId(
            adjustment.categoryId,
            userId
        );

        if (!category) {
            throw createError(
                "Budget category not found or inactive.",
                404
            );
        }

        if (category.type !== "expense") {
            throw createError(
                "Only expense categories can have a simulated budget."
            );
        }

        categoryBudgetMap.set(
            adjustment.categoryId,
            Number(adjustment.amount)
        );
    }

    const adjustedCategoryBudgets = Array.from(
        categoryBudgetMap,
        ([categoryId, amount]) => ({
            categoryId,
            amount,
        })
    );

    const originalAllocatedBudget = originalCategoryBudgets.reduce(
        (total, item) => total + toAmount(item.amount),
        0
    );

    const adjustedAllocatedBudget = adjustedCategoryBudgets.reduce(
        (total, item) => total + item.amount,
        0
    );

    // Compare financial results
    const baselineBalance = totalIncome - totalExpenses;
    const projectedBalance = totalIncome - projectedExpenses;

    const balanceAfterSavings =
        projectedBalance - Number(monthlySavingsTarget);

    return {
        month,

        actual: {
            totalIncome: formatAmount(totalIncome),
            totalExpenses: formatAmount(totalExpenses),
            netBalance: formatAmount(baselineBalance),
            totalBudget: formatAmount(originalTotalBudget),
            allocatedCategoryBudget: formatAmount(
                originalAllocatedBudget
            ),
        },

        simulation: {
            totalIncome: formatAmount(totalIncome),
            totalExpenseReduction: formatAmount(
                totalExpenseReduction
            ),
            projectedExpenses: formatAmount(projectedExpenses),
            projectedBalance: formatAmount(projectedBalance),
            totalBudget: formatAmount(adjustedTotalBudget),
            allocatedCategoryBudget: formatAmount(
                adjustedAllocatedBudget
            ),
            monthlySavingsTarget: formatAmount(
                Number(monthlySavingsTarget)
            ),
            balanceAfterSavings: formatAmount(
                balanceAfterSavings
            ),
            canReachSavingsGoal: balanceAfterSavings >= 0,
        },

        expenseReductions: reductionDetails.map((item) => ({
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            actualSpent: formatAmount(item.actualSpent),
            reductionPercentage: item.reductionPercentage,
            reductionAmount: formatAmount(item.reductionAmount),
            projectedSpent: formatAmount(item.projectedSpent),
        })),

        budgetComparison: {
            originalTotalBudget: formatAmount(originalTotalBudget),
            adjustedTotalBudget: formatAmount(adjustedTotalBudget),
            originalAllocatedBudget: formatAmount(
                originalAllocatedBudget
            ),
            adjustedAllocatedBudget: formatAmount(
                adjustedAllocatedBudget
            ),
            isTotalBudgetExceeded:
                adjustedAllocatedBudget > adjustedTotalBudget,
        },
    };
};

module.exports = {
    simulate,
};
