
const smartAnalysisRepository = require(
    "../repositories/smart-analysis.repository"
);

const {
    validateDashboardDateRange,
} = require("../validators/dashboard.validator");


// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) {
        return current === 0 ? 0 : null;
    }

    return Number(
        (((current - previous) / previous) * 100).toFixed(2)
    );
};


// Get smart analysis overview
const getSmartAnalysis = async (userId, startDate, endDate) => {
    const validation = validateDashboardDateRange({
        startDate,
        endDate,
    });

    if (!validation.isValid) {
        const error = new Error(
            "Smart analysis date range validation failed."
        );
        error.status = 400;
        error.details = validation.errors;
        throw error;
    }

    // Calculate previous period with the same number of days
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);

    const periodDays = Math.round(
        (end.getTime() - start.getTime()) / 86400000
    ) + 1;

    const previousEnd = new Date(start);
    previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);

    const previousStart = new Date(previousEnd);
    previousStart.setUTCDate(
        previousStart.getUTCDate() - periodDays + 1
    );

    const formatDate = (date) =>
        date.toISOString().slice(0, 10);

    const previousStartDate = formatDate(previousStart);
    const previousEndDate = formatDate(previousEnd);

    // Get current and previous period data
    const [
        summary,
        expenseByCategory,
        monthlyTrend,
        previousSummary,
    ] = await Promise.all([
        smartAnalysisRepository.getPeriodSummary(
            userId,
            startDate,
            endDate
        ),
        smartAnalysisRepository.getExpenseByCategory(
            userId,
            startDate,
            endDate
        ),
        smartAnalysisRepository.getMonthlyExpenseTrend(
            userId,
            startDate,
            endDate
        ),
        smartAnalysisRepository.getPeriodSummary(
            userId,
            previousStartDate,
            previousEndDate
        ),
    ]);

    const totalExpenses = Number(summary.total_expenses);
    const previousExpenses = Number(
        previousSummary.total_expenses
    );

    // Calculate category spending percentages
    const categoryAnalysis = expenseByCategory.map((category) => {
        const amount = Number(category.total_amount);

        return {
            ...category,
            total_amount: amount,
            percentage: totalExpenses > 0
                ? Number(
                    ((amount / totalExpenses) * 100).toFixed(2)
                )
                : 0,
        };
    });

    // Analyze spending changes
    const expenseChange = calculatePercentageChange(
        totalExpenses,
        previousExpenses
    );

    const insights = [];

    if (previousExpenses === 0 && totalExpenses > 0) {
        insights.push({
            type: "expense_no_previous_data",
            message: "You had no expenses in the previous period, so a percentage comparison is unavailable.",
            percentage: null,
        });
    } else if (totalExpenses > previousExpenses) {
        insights.push({
            type: "expense_increase",
            message: "Your expenses increased compared to the previous period.",
            percentage: expenseChange,
        });
    } else if (totalExpenses < previousExpenses) {
        insights.push({
            type: "expense_decrease",
            message: "Your expenses decreased compared to the previous period.",
            percentage: Math.abs(expenseChange),
        });
    } else {
        insights.push({
            type: "expense_stable",
            message: "Your expenses remained unchanged compared to the previous period.",
            percentage: 0,
        });
    }

    // Analyze highest spending category
    if (categoryAnalysis.length > 0) {
        const highestCategory = categoryAnalysis[0];

        insights.push({
            type: "highest_spending_category",
            category_name: highestCategory.category_name,
            total_amount: highestCategory.total_amount,
            percentage: highestCategory.percentage,
        });
    }

    // Get monthly budget
    const budgetMonth = `${endDate.slice(0, 7)}-01`;
    const startMonth = startDate.slice(0, 7);
    const endMonth = endDate.slice(0, 7);
    const isFullMonth =
        startMonth === endMonth &&
        startDate === budgetMonth &&
        endDate === new Date(
            Date.UTC(
                Number(endDate.slice(0, 4)),
                Number(endDate.slice(5, 7)),
                0
            )
        ).toISOString().slice(0, 10);
    const monthlyBudget = isFullMonth
        ? await smartAnalysisRepository.getMonthlyBudget(userId, budgetMonth)
        : null;

    let budgetAnalysis = null;
    const recommendations = [];

    if (monthlyBudget) {
        const budgetAmount = Number(monthlyBudget.total_amount);
        const remainingBudget = budgetAmount - totalExpenses;
        budgetAnalysis = {
            budget_amount: budgetAmount,
            total_expenses: totalExpenses,
            remaining_budget: remainingBudget,
            usage_percentage: budgetAmount > 0
                ? Number(
                    ((totalExpenses / budgetAmount) * 100).toFixed(2)
                )
                : 0,
        };

        if (remainingBudget < 0) {
            recommendations.push({
                type: "budget_exceeded",
                message: "You have exceeded your monthly budget. Consider reducing non-essential expenses.",
            });
        } else if (
            budgetAnalysis.usage_percentage >= 80
        ) {
            recommendations.push({
                type: "budget_warning",
                message: "You have used at least 80% of your monthly budget. Monitor your spending carefully.",
            });
        } else {
            recommendations.push({
                type: "budget_healthy",
                message: "Your spending is currently within your monthly budget.",
            });
        }
    } else {
        recommendations.push({
            type: "no_budget",
            message: "Set a monthly budget to better manage your expenses.",
        });
    }

    return {
        period: {
            start_date: startDate,
            end_date: endDate,
        },
        previous_period: {
            start_date: previousStartDate,
            end_date: previousEndDate,
        },
        summary,
        expense_comparison: {
            current_expenses: totalExpenses,
            previous_expenses: previousExpenses,
            percentage_change: expenseChange,
        },
        category_analysis: categoryAnalysis,
        monthly_trend: monthlyTrend,
        budget_analysis: budgetAnalysis,
        insights,
        recommendations,
    };
};

module.exports = {
    getSmartAnalysis,
};
