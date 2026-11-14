
const pool = require("../config/database");

// Find an active payment method belonging to a specific user
const findActiveByIdAndUserId = async (paymentMethodId, userId) => {
    const query = `
        SELECT
            payment_method_id,
            user_id,
            name,
            type,
            is_active
        FROM payment_methods
        WHERE payment_method_id = $1
          AND user_id = $2
          AND is_active = TRUE
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        paymentMethodId,
        userId,
    ]);

    return rows[0] || null;
};

// Create a new payment method
const createPaymentMethod = async ({
    userId,
    name,
    type,
}) => {
    const query = `
        INSERT INTO payment_methods (
            user_id,
            name,
            type
        )
        VALUES ($1, $2, $3)
        RETURNING
            payment_method_id,
            user_id,
            name,
            type,
            is_active,
            created_at;
    `;

    const { rows } = await pool.query(query, [
        userId,
        name,
        type,
    ]);

    return rows[0];
};

// Find all payment methods belonging to a specific user
const findAllByUserId = async (userId, includeInactive = false) => {
    const query = `
        SELECT
            payment_method_id,
            user_id,
            name,
            type,
            is_active,
            created_at
        FROM payment_methods
        WHERE user_id = $1
          AND ($2::BOOLEAN = TRUE OR is_active = TRUE)
        ORDER BY
            is_active DESC,
            name ASC;
    `;
    const { rows } = await pool.query(query, [
        userId,
        includeInactive,
    ]);

    return rows;
};

// Find a payment method belonging to a specific user
const findByIdAndUserId = async (paymentMethodId, userId) => {
    const query = `
        SELECT
            payment_method_id,
            user_id,
            name,
            type,
            is_active,
            created_at
        FROM payment_methods
        WHERE payment_method_id = $1
          AND user_id = $2
        LIMIT 1;
    `;
    const { rows } = await pool.query(query, [
        paymentMethodId,
        userId,
    ]);

    return rows[0] || null;
};

// Update a payment method
const updatePaymentMethod = async (
    paymentMethodId,
    userId,
    {
        name,
        type,
    }
) => {
    const query = `
        UPDATE payment_methods
        SET
            name = $1,
            type = $2
        WHERE payment_method_id = $3
          AND user_id = $4
        RETURNING
            payment_method_id,
            user_id,
            name,
            type,
            is_active,
            created_at;
    `;

    const { rows } = await pool.query(query, [
        name,
        type,
        paymentMethodId,
        userId,
    ]);

    return rows[0] || null;
};

// Activate or deactivate a payment method
const togglePaymentMethod = async (
    paymentMethodId,
    userId,
    isActive
) => {
    const query = `
        UPDATE payment_methods
        SET is_active = $1
        WHERE payment_method_id = $2
          AND user_id = $3
        RETURNING
            payment_method_id,
            user_id,
            name,
            type,
            is_active;
    `;

    const { rows } = await pool.query(query, [
        isActive,
        paymentMethodId,
        userId,
    ]);

    return rows[0] || null;
};

module.exports = {
    findActiveByIdAndUserId,
    createPaymentMethod,
    findAllByUserId,
    findByIdAndUserId,
    updatePaymentMethod,
    togglePaymentMethod,
};
