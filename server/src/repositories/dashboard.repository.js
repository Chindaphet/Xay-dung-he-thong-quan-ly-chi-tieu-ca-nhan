
const pool = require("../config/database");
// Get financial summary within a date range
const getFinancialSummary = async (userId, startDate, endDate) => {
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

// Get income and expense trend by date
const getIncomeExpenseTrend = async (userId,startDate,endDate) => {
    const query = `
        SELECT
            TO_CHAR(transaction_date, 'YYYY-MM-DD') AS transaction_date,
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
        GROUP BY transaction_date
        ORDER BY transaction_date ASC;
    `;

    const { rows } = await pool.query(query, [
        userId,
        startDate,
        endDate,
    ]);

    return rows;
};

// Get expenses grouped by category
const getExpenseByCategory = async (userId,startDate,endDate) => {
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

// Get recent transactions
const getRecentTransactions = async (userId,startDate,endDate,limit = 10) => {
    const query = `
        SELECT
            t.transactions_id,
            t.category_id,
            c.name AS category_name,
            c.color AS category_color,
            c.icon AS category_icon,
            t.payment_method_id,
            pm.name AS payment_method_name,
            t.type,
            t.amount,
            t.description,
            TO_CHAR(t.transaction_date, 'YYYY-MM-DD') AS transaction_date,
            t.created_at
        FROM transactions t
        LEFT JOIN categories c
            ON t.category_id = c.category_id
           AND t.user_id = c.user_id
        LEFT JOIN payment_methods pm
            ON t.payment_method_id = pm.payment_method_id
           AND t.user_id = pm.user_id
        WHERE t.user_id = $1
          AND t.transaction_date >= $2::DATE
          AND t.transaction_date <= $3::DATE
          AND t.deleted_at IS NULL
        ORDER BY
            t.transaction_date DESC,
            t.created_at DESC
        LIMIT $4;
    `;
    
    const { rows } = await pool.query(query, [
        userId,
        startDate,
        endDate,
        limit,
    ]);

    return rows;
};

module.exports = {
    getFinancialSummary,
    getIncomeExpenseTrend,
    getExpenseByCategory,
    getRecentTransactions,
};
