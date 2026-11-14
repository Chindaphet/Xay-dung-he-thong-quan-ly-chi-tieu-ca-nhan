
const pool = require("../config/database");

// Create a recurring transaction
const createRecurring = async ({
    userId,
    categoryId,
    paymentMethodId = null,
    type,
    amount,
    description = null,
    frequency,
    startDate,
    endDate = null,
    nextDueDate,
}) => {
    const query = `
        INSERT INTO recurring_transactions (
            user_id,
            category_id,
            payment_method_id,
            type,
            amount,
            description,
            frequency,
            start_date,
            end_date,
            next_due_date
        )
        VALUES ($1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10)
        RETURNING
            recurring_id,
            user_id,
            category_id,
            payment_method_id,
            type,
            amount,
            description,
            frequency,
            start_date,
            end_date,
            next_due_date,
            is_active,
            created_at;
    `;

    const values = [
        userId,
        categoryId,
        paymentMethodId,
        type,
        amount,
        description,
        frequency,
        startDate,
        endDate,
        nextDueDate,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// Find all recurring transactions belonging to a user
const findAllByUserId = async (userId) => {
    const query = `
        SELECT
            recurring_id,
            user_id,
            category_id,
            payment_method_id,
            type,
            amount,
            description,
            frequency,
            start_date,
            end_date,
            next_due_date,
            is_active,
            created_at
        FROM recurring_transactions
        WHERE user_id = $1
        ORDER BY next_due_date ASC, created_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);
    return rows;
};

// Find one recurring transaction belonging to a user
const findByIdAndUserId = async (recurringId, userId) => {
    const query = `
        SELECT
            recurring_id,
            user_id,
            category_id,
            payment_method_id,
            type,
            amount,
            description,
            frequency,
            start_date,
            end_date,
            next_due_date,
            is_active,
            created_at
        FROM recurring_transactions
        WHERE recurring_id = $1
          AND user_id = $2
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        recurringId,
        userId,
    ]);

    return rows[0] || null;
};


// Update a recurring transaction
const updateRecurring = async (
    recurringId,
    userId,
    {
        categoryId,
        paymentMethodId = null,
        type,
        amount,
        description = null,
        frequency,
        startDate,
        endDate = null,
        nextDueDate,
    }
) => {
    const query = `
        UPDATE recurring_transactions
        SET
            category_id = $1,
            payment_method_id = $2,
            type = $3,
            amount = $4,
            description = $5,
            frequency = $6,
            start_date = $7,
            end_date = $8,
            next_due_date = $9
        WHERE recurring_id = $10
          AND user_id = $11
        RETURNING
            recurring_id,
            user_id,
            category_id,
            payment_method_id,
            type,
            amount,
            description,
            frequency,
            start_date,
            end_date,
            next_due_date,
            is_active,
            created_at;
    `;

    const values = [
        categoryId,
        paymentMethodId,
        type,
        amount,
        description,
        frequency,
        startDate,
        endDate,
        nextDueDate,
        recurringId,
        userId,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
};


// Activate or deactivate a recurring transaction
const toggleRecurring = async (recurringId, userId, isActive) => {
    const query = `
        UPDATE recurring_transactions
        SET is_active = $1
        WHERE recurring_id = $2
          AND user_id = $3
        RETURNING
            recurring_id,
            user_id,
            is_active,
            next_due_date;
    `;

    const { rows } = await pool.query(query, [
        isActive,
        recurringId,
        userId,
    ]);

    return rows[0] || null;
};

// Find due recurring transactions
const findDueRecurring = async (
    client,
    currentDate,
    limit = 50,
    recurringId = null
) => {
    const query = `
        SELECT
            recurring_id,
            user_id,
            category_id,
            payment_method_id,
            type,
            amount,
            description,
            frequency,
            TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
            TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
            TO_CHAR(next_due_date, 'YYYY-MM-DD') AS next_due_date,
            is_active
        FROM recurring_transactions
        WHERE is_active = TRUE
          AND start_date <= $1::DATE
          AND next_due_date <= $1::DATE
          AND ($3::UUID IS NULL OR recurring_id = $3::UUID)
        ORDER BY next_due_date ASC
        LIMIT $2;
    `;

    const { rows } = await client.query(query, [
        currentDate,
        limit,
        recurringId,
    ]);

    return rows;
};



// Find and lock one due recurring transaction

const findDueRecurringForUpdate = async (
    client,
    recurringId,
    currentDate
) => {
    const query = `
        SELECT
            recurring_id,
            user_id,
            category_id,
            payment_method_id,
            type,
            amount,
            description,
            frequency,
            TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
            TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
            TO_CHAR(next_due_date, 'YYYY-MM-DD') AS next_due_date,
            is_active
        FROM recurring_transactions
        WHERE recurring_id = $1
          AND is_active = TRUE
          AND start_date <= $2::DATE
          AND next_due_date <= $2::DATE
        FOR UPDATE SKIP LOCKED;
    `;

    const { rows } = await client.query(query, [
        recurringId,
        currentDate,
    ]);

    return rows[0] || null;
};


// Create a transaction generated from a recurring schedule
const createRecurringOccurrence = async (
    client,
    recurring
) => {
    const query = `
        INSERT INTO transactions (
            user_id,
            category_id,
            payment_method_id,
            type,
            amount,
            description,
            transaction_date,
            recurring_id,
            recurring_occurrence_date
        )
        VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9
        )
        ON CONFLICT (
            recurring_id,
            recurring_occurrence_date
        )
        DO NOTHING
        RETURNING
            transactions_id,
            user_id,
            category_id,
            payment_method_id,
            type,
            amount,
            description,
            transaction_date,
            recurring_id,
            recurring_occurrence_date,
            created_at,
            updated_at;
    `;

    const values = [
        recurring.user_id,
        recurring.category_id,
        recurring.payment_method_id,
        recurring.type,
        recurring.amount,
        recurring.description,
        recurring.next_due_date,
        recurring.recurring_id,
        recurring.next_due_date,
    ];

    const { rows } = await client.query(query, values);
    return rows[0] || null;
};

// Update the next due date
const updateNextDueDate = async (
    client,
    recurringId,
    nextDueDate
) => {
    const query = `
        UPDATE recurring_transactions
        SET next_due_date = $1::DATE
        WHERE recurring_id = $2
        RETURNING
            recurring_id,
            next_due_date;
    `;

    const { rows } = await client.query(query, [
        nextDueDate,
        recurringId,
    ]);

    return rows[0] || null;
};

// Deactivate a completed recurring transaction
const deactivateRecurring = async (client, recurringId) => {
    const query = `
        UPDATE recurring_transactions
        SET is_active = FALSE
        WHERE recurring_id = $1
          AND is_active = TRUE
        RETURNING recurring_id, is_active;
    `;

    const { rows } = await client.query(query, [
        recurringId,
    ]);

    return rows[0] || null;
};

module.exports = {
    createRecurring,
    findAllByUserId,
    findByIdAndUserId,
    updateRecurring,
    toggleRecurring,
    findDueRecurring,
    findDueRecurringForUpdate,
    createRecurringOccurrence,
    updateNextDueDate,
    deactivateRecurring,
};
