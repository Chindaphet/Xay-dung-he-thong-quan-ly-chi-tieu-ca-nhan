
const pool = require("../config/database");

// Get monthly income and expense summary
const getMonthlyFinancialSummary = async (userId, month) => {
    const query = `
        SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'income' THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS total_income,

            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'expense' THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS total_expenses

        FROM transactions
        WHERE user_id = $1
          AND transaction_date >= $2::DATE
          AND transaction_date < (
              $2::DATE + INTERVAL '1 month'
          )
          AND deleted_at IS NULL;
    `;

    const { rows } = await pool.query(query, [
        userId,
        `${month}-01`,
    ]);

    return rows[0];
};

// Get all monthly expense categories and their actual spending
const getMonthlyExpenseByCategory = async (
    userId,
    month
) => {
    const query = `
        SELECT
            c.category_id,
            c.name AS category_name,
            c.color AS category_color,
            c.icon AS category_icon,

            COALESCE(
                SUM(t.amount),
                0
            ) AS total_spent

        FROM categories c

        LEFT JOIN transactions t
            ON t.category_id = c.category_id
           AND t.user_id = c.user_id
           AND t.type = 'expense'
           AND t.transaction_date >= $2::DATE
           AND t.transaction_date < (
               $2::DATE + INTERVAL '1 month'
           )
           AND t.deleted_at IS NULL

        WHERE c.user_id = $1
          AND c.type = 'expense'

        GROUP BY
            c.category_id,
            c.name,
            c.color,
            c.icon

        ORDER BY c.name ASC;
    `;

    const { rows } = await pool.query(query, [
        userId,
        `${month}-01`,
    ]);

    return rows;
};

// Get monthly budget and category budget allocations
const getMonthlyBudget = async (userId, month) => {
    const query = `
        SELECT
            b.budget_id,
            b.total_amount,

            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'categoryId', bc.category_id,
                            'amount', bc.amount
                        )
                        ORDER BY bc.category_id
                    )
                    FROM budget_categories bc
                    WHERE bc.budget_id = b.budget_id
                      AND bc.user_id = b.user_id
                ),
                '[]'::JSON
            ) AS category_budgets

        FROM budgets b

        WHERE b.user_id = $1
          AND b.budget_month = $2::DATE

        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        userId,
        `${month}-01`,
    ]);

    return rows[0] || null;
};

module.exports = {
    getMonthlyFinancialSummary,
    getMonthlyExpenseByCategory,
    getMonthlyBudget,
};
