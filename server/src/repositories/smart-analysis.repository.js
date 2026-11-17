
const pool = require("../config/database");

// Get financial summary within a date range
const getPeriodSummary = async (userId, startDate, endDate) => {
    const query = `
        SELECT
            COALESCE(
                SUM(amount) FILTER (WHERE type = 'income'),
                0
            ) AS total_income,
            COALESCE(
                SUM(amount) FILTER (WHERE type = 'expense'),
                0
            ) AS total_expenses,
            COALESCE(
                SUM(amount) FILTER (WHERE type = 'income'),
                0
            ) -
            COALESCE(
                SUM(amount) FILTER (WHERE type = 'expense'),
                0
            ) AS net_balance
        FROM transactions
        WHERE user_id = $1
          AND transaction_date >= $2::DATE
          AND transaction_date <= $3::DATE
          AND deleted_at IS NULL;
    `;

    const { rows } = await pool.query(query, [
        userId,
        startDate,
        endDate,
    ]);

    return rows[0];
};


// Get expenses grouped by category
const getExpenseByCategory = async (
    userId,
    startDate,
    endDate
) => {
    const query = `
        SELECT
            t.category_id,
            c.name AS category_name,
            c.color AS category_color,
            c.icon AS category_icon,
            SUM(t.amount) AS total_amount
        FROM transactions t
        LEFT JOIN categories c
            ON t.category_id = c.category_id
           AND t.user_id = c.user_id
        WHERE t.user_id = $1
          AND t.type = 'expense'
          AND t.transaction_date >= $2::DATE
          AND t.transaction_date <= $3::DATE
          AND t.deleted_at IS NULL
        GROUP BY
            t.category_id,
            c.name,
            c.color,
            c.icon
        ORDER BY total_amount DESC;
    `;

    const { rows } = await pool.query(query, [
        userId,
        startDate,
        endDate,
    ]);

    return rows;
};


// Get monthly income and expense trends
const getMonthlyExpenseTrend = async (
    userId,
    startDate,
    endDate
) => {
    const query = `
        SELECT
            TO_CHAR(
                DATE_TRUNC('month', transaction_date),
                'YYYY-MM'
            ) AS month,
            COALESCE(
                SUM(amount) FILTER (WHERE type = 'income'),
                0
            ) AS income,
            COALESCE(
                SUM(amount) FILTER (WHERE type = 'expense'),
                0
            ) AS expenses
        FROM transactions
        WHERE user_id = $1
          AND transaction_date >= $2::DATE
          AND transaction_date <= $3::DATE
          AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY DATE_TRUNC('month', transaction_date) ASC;
    `;

    const { rows } = await pool.query(query, [
        userId,
        startDate,
        endDate,
    ]);

    return rows;
};


// Get monthly budget
const getMonthlyBudget = async (userId, budgetMonth) => {
    const query = `
        SELECT
            budget_id,
            budget_month,
            total_amount
        FROM budgets
        WHERE user_id = $1
          AND DATE_TRUNC('month', budget_month) =
              DATE_TRUNC('month', $2::DATE)
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        userId,
        budgetMonth,
    ]);

    return rows[0] || null;
};


module.exports = {
    getPeriodSummary,
    getExpenseByCategory,
    getMonthlyExpenseTrend,
    getMonthlyBudget,
};
