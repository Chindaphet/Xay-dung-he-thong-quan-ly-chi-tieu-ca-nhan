
const pool = require("../config/database");

// Find a budget belonging to a user by month
const findByUserIdAndMonth = async (userId, month) => {
    const query = `
        SELECT
            budget_id,
            user_id,
            TO_CHAR(budget_month, 'YYYY-MM-DD') AS budget_month,
            total_amount,
            created_at,
            updated_at
        FROM budgets
        WHERE user_id = $1
          AND budget_month = $2::DATE
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        userId,
        month,
    ]);

    return rows[0] || null;
};

// Find a budget by ID and user ID
const findByIdAndUserId = async (budgetId, userId) => {
    const query = `
        SELECT
            budget_id,
            user_id,
            TO_CHAR(budget_month, 'YYYY-MM-DD') AS budget_month,
            total_amount,
            created_at,
            updated_at
        FROM budgets
        WHERE budget_id = $1
          AND user_id = $2
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        budgetId,
        userId,
    ]);

    return rows[0] || null;
};

// Create a monthly budget
const createBudget = async ({
    userId,
    month,
    totalAmount,
}) => {
    const query = `
        INSERT INTO budgets (
            user_id,
            budget_month,
            total_amount
        )
        VALUES (
            $1,
            $2::DATE,
            $3
        )
        RETURNING
            budget_id,
            user_id,
            TO_CHAR(budget_month, 'YYYY-MM-DD') AS budget_month,
            total_amount,
            created_at,
            updated_at;
    `;

    const { rows } = await pool.query(query, [
        userId,
        month,
        totalAmount,
    ]);

    return rows[0];
};

// Update the overall monthly budget
const updateBudget = async (
    budgetId,
    userId,
    totalAmount
) => {
    const query = `
        UPDATE budgets
        SET
            total_amount = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE budget_id = $2
          AND user_id = $3
        RETURNING
            budget_id,
            user_id,
            TO_CHAR(budget_month, 'YYYY-MM-DD') AS budget_month,
            total_amount,
            created_at,
            updated_at;
    `;

    const { rows } = await pool.query(query, [
        totalAmount,
        budgetId,
        userId,
    ]);

    return rows[0] || null;
};

// Get overall spending for a budget month
const getTotalSpent = async (
    userId,
    month
) => {
    const query = `
        SELECT
            COALESCE(SUM(amount), 0) AS total_spent
        FROM transactions
        WHERE user_id = $1
          AND type = 'expense'
          AND transaction_date >= $2::DATE
          AND transaction_date < (
              $2::DATE + INTERVAL '1 month'
          )
          AND deleted_at IS NULL;
    `;

    const { rows } = await pool.query(query, [
        userId,
        month,
    ]);

    return rows[0];
};


// Get category budgets and actual spending
const getCategoryBudgets = async (
    budgetId,
    userId,
    month
) => {
    const query = `
        SELECT
            bc.budget_category_id,
            bc.budget_id,
            bc.category_id,
            bc.amount AS budget_amount,

            c.name AS category_name,
            c.color AS category_color,
            c.icon AS category_icon,
            c.is_active AS category_is_active,

            COALESCE(spent.total_spent, 0) AS total_spent,

            bc.amount -
            COALESCE(spent.total_spent, 0)
                AS remaining_amount

        FROM budget_categories bc

        INNER JOIN categories c
            ON bc.category_id = c.category_id
           AND bc.user_id = c.user_id

        LEFT JOIN LATERAL (
            SELECT
                SUM(t.amount) AS total_spent
            FROM transactions t
            WHERE t.user_id = bc.user_id
              AND t.category_id = bc.category_id
              AND t.type = 'expense'
              AND t.transaction_date >= $3::DATE
              AND t.transaction_date < (
                  $3::DATE + INTERVAL '1 month'
              )
              AND t.deleted_at IS NULL
        ) spent ON TRUE

        WHERE bc.budget_id = $1
          AND bc.user_id = $2

        ORDER BY c.name ASC;
    `;

    const { rows } = await pool.query(query, [
        budgetId,
        userId,
        month,
    ]);

    return rows;
};


// Find a category budget by budget ID and category ID
const findCategoryBudget = async (
    budgetId,
    userId,
    categoryId
) => {
    const query = `
        SELECT
            budget_category_id,
            budget_id,
            user_id,
            category_id,
            amount
        FROM budget_categories
        WHERE budget_id = $1
          AND user_id = $2
          AND category_id = $3
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        budgetId,
        userId,
        categoryId,
    ]);

    return rows[0] || null;
};


// Find a category belonging to a user
const findCategoryByIdAndUserId = async (
    categoryId,
    userId
) => {
    const query = `
        SELECT
            category_id,
            user_id,
            name,
            type,
            is_active
        FROM categories
        WHERE category_id = $1
          AND user_id = $2
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        categoryId,
        userId,
    ]);

    return rows[0] || null;
};


// Create a category budget
const createCategoryBudget = async ({
    budgetId,
    userId,
    categoryId,
    amount,
}) => {
    const query = `
        INSERT INTO budget_categories (
            budget_id,
            user_id,
            category_id,
            amount
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            budget_category_id,
            budget_id,
            user_id,
            category_id,
            amount,
            created_at,
            updated_at;
    `;

    const { rows } = await pool.query(query, [
        budgetId,
        userId,
        categoryId,
        amount,
    ]);

    return rows[0];
};


// Update a category budget
const updateCategoryBudget = async (
    budgetId,
    userId,
    categoryId,
    amount
) => {
    const query = `
        UPDATE budget_categories
        SET
            amount = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE budget_id = $2
          AND user_id = $3
          AND category_id = $4
        RETURNING
            budget_category_id,
            budget_id,
            user_id,
            category_id,
            amount,
            created_at,
            updated_at;
    `;

    const { rows } = await pool.query(query, [
        amount,
        budgetId,
        userId,
        categoryId,
    ]);

    return rows[0] || null;
};


// Delete a category budget
const deleteCategoryBudget = async (
    budgetId,
    userId,
    categoryId
) => {
    const query = `
        DELETE FROM budget_categories
        WHERE budget_id = $1
          AND user_id = $2
          AND category_id = $3
        RETURNING budget_category_id;
    `;

    const { rows } = await pool.query(query, [
        budgetId,
        userId,
        categoryId,
    ]);

    return rows[0] || null;
};


module.exports = {
    findByUserIdAndMonth,
    findByIdAndUserId,
    createBudget,
    updateBudget,
    getTotalSpent,
    getCategoryBudgets,
    findCategoryBudget,
    findCategoryByIdAndUserId,
    createCategoryBudget,
    updateCategoryBudget,
    deleteCategoryBudget,
};
