
const pool = require("../config/database");
// Create a new transaction and enqueue its gamification event
const createTransaction = async ({
    userId,
    categoryId,
    paymentMethodId = null,
    type,
    amount,
    description = null,
    transactionDate = null,
}) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const transactionQuery = `
            INSERT INTO transactions (
                user_id,
                category_id,
                payment_method_id,
                type,
                amount,
                description,
                transaction_date
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                COALESCE($7::DATE, CURRENT_DATE)
            )
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
            userId,
            categoryId,
            paymentMethodId,
            type,
            amount,
            description,
            transactionDate,
        ];

        const { rows } = await client.query(transactionQuery,values);
        const transaction = rows[0];
        const eventQuery = `
            INSERT INTO gamification_events (
                user_id,
                event_type,
                reference_id,
                event_key,
                payload
            )
            VALUES (
                $1,
                'transaction_created',
                $2,
                $3,
                $4::jsonb
            )
            ON CONFLICT (event_key) DO NOTHING;
        `;

        const eventKey = `transaction:${transaction.transactions_id}`;
        const eventPayload = JSON.stringify({
            transactions_id: transaction.transactions_id,
            created_at: transaction.created_at,
            type: transaction.type,
        });

        await client.query(eventQuery, [
            userId,
            transaction.transactions_id,
            eventKey,
            eventPayload,
        ]);

        await client.query("COMMIT");
        return transaction;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Find all transactions belonging to a user
const findAllByUserId = async (userId) => {
    const query = `
        SELECT
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
            updated_at
        FROM transactions
        WHERE user_id = $1
          AND deleted_at IS NULL
        ORDER BY transaction_date DESC, created_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);
    return rows;
};

// Find one transaction belonging to a user
const findByIdAndUserId = async (transactionsId, userId) => {
    const query = `
        SELECT
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
            updated_at
        FROM transactions
        WHERE transactions_id = $1
          AND user_id = $2
          AND deleted_at IS NULL
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        transactionsId,
        userId,
    ]);
    return rows[0] || null;
};

// Update an existing transaction
const updateTransaction = async (
    transactionsId,
    userId,
    {
        categoryId,
        paymentMethodId = null,
        type,
        amount,
        description = null,
        transactionDate = null,
    }
) => {
    const query = `
        UPDATE transactions
        SET
            category_id = $1,
            payment_method_id = $2,
            type = $3,
            amount = $4,
            description = $5,
            transaction_date = COALESCE($6::DATE, transaction_date),
            updated_at = CURRENT_TIMESTAMP
        WHERE transactions_id = $7
          AND user_id = $8
          AND deleted_at IS NULL
          AND recurring_id IS NULL
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
        categoryId,
        paymentMethodId,
        type,
        amount,
        description,
        transactionDate,
        transactionsId,
        userId,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
};

// Soft delete a transaction
const softDeleteTransaction = async (transactionsId, userId) => {
    const query = `
        UPDATE transactions
        SET
            deleted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE transactions_id = $1
          AND user_id = $2
          AND deleted_at IS NULL
          AND recurring_id IS NULL
        RETURNING transactions_id;
    `;

    const { rows } = await pool.query(query, [transactionsId,userId,]);
    return rows[0] || null;
};

// Find an active transaction for gamification processing
const findActiveTransactionByIdAndUserId = async (
    transactionsId,
    userId
) => {
    const query = `
        SELECT
            transactions_id,
            user_id,
            type,
            created_at
        FROM transactions
        WHERE transactions_id = $1
          AND user_id = $2
          AND deleted_at IS NULL
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        transactionsId,
        userId,
    ]);

    return rows[0] || null;
};
module.exports = {
    createTransaction,
    findAllByUserId,
    findByIdAndUserId,
    updateTransaction,
    softDeleteTransaction,
    findActiveTransactionByIdAndUserId,
};