
const pool = require("../config/database");

// Invalidate all unused password reset tokens for a user
const invalidateUnusedTokensByUserId = async (
    userId,
    client = pool
) => {
    const query = `
        UPDATE password_reset_tokens
        SET used_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND used_at IS NULL;
    `;

    const { rowCount } = await client.query(query, [userId]);

    return rowCount;
};

// Create a password reset token
const createPasswordResetToken = async ({
    userId,
    tokenHash,
    expiresAt,
    client = pool,
}) => {
    const query = `
        INSERT INTO password_reset_tokens (
            user_id,
            token_hash,
            expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING
            password_reset_token_id,
            user_id,
            expires_at,
            created_at;
    `;

    const values = [
        userId,
        tokenHash,
        expiresAt,
    ];

    const { rows } = await client.query(query, values);

    return rows[0];
};

// Find a valid token and lock its row during a transaction
const findValidTokenForUpdate = async (
    tokenHash,
    client
) => {
    const query = `
        SELECT
            password_reset_token_id,
            user_id,
            token_hash,
            expires_at,
            used_at
        FROM password_reset_tokens
        WHERE token_hash = $1
          AND expires_at > CURRENT_TIMESTAMP
          AND used_at IS NULL
        LIMIT 1
        FOR UPDATE;
    `;

    const { rows } = await client.query(query, [tokenHash]);

    return rows[0] || null;
};

// Mark a password reset token as used
const markTokenAsUsed = async (
    tokenId,
    client
) => {
    const query = `
        UPDATE password_reset_tokens
        SET used_at = CURRENT_TIMESTAMP
        WHERE password_reset_token_id = $1
          AND used_at IS NULL
        RETURNING password_reset_token_id;
    `;

    const { rows } = await client.query(query, [tokenId]);

    return rows[0] || null;
};

module.exports = {
    invalidateUnusedTokensByUserId,
    createPasswordResetToken,
    findValidTokenForUpdate,
    markTokenAsUsed,
};
