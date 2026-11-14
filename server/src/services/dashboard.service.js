
const dashboardRepository = require("../repositories/dashboard.repository");
const {
    validateDashboardDateRange,
} = require("../validators/dashboard.validator");

// Get dashboard overview
const getDashboardOverview = async (
    userId,
    startDate,
    endDate
) => {
    // Validate date range
    const validation = validateDashboardDateRange({
        startDate,
        endDate,
    });

    if (!validation.isValid) {
        const error = new Error(
            "Dashboard date range validation failed."
        );

        error.status = 400;
        error.details = validation.errors;

        throw error;
    }

    // Fetch dashboard data
    const [
        summary,
        incomeExpenseTrend,
        expenseByCategory,
        recentTransactions,
    ] = await Promise.all([
        dashboardRepository.getFinancialSummary(
            userId,
            startDate,
            endDate
        ),

        dashboardRepository.getIncomeExpenseTrend(
            userId,
            startDate,
            endDate
        ),

        dashboardRepository.getExpenseByCategory(
            userId,
            startDate,
            endDate
        ),

        dashboardRepository.getRecentTransactions(
            userId,
            startDate,
            endDate,
            10
        ),
    ]);

    return {
        period: {
            startDate,
            endDate,
        },

        summary,

        incomeExpenseTrend,

        expenseByCategory,

        recentTransactions,
    };
};


module.exports = {
    getDashboardOverview,
};
