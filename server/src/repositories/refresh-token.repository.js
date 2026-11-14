
const pool = require("../config/database");

// Create a new refresh token record
const create = async (
    { userId, tokenHash, expiresAt },
    db = pool
) => {
    const query = `
        INSERT INTO refresh_tokens (
            user_id,
            token_hash,
            expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING
            refresh_token_id,
            user_id,
            expires_at,
            created_at;
    `;

    const values = [userId, tokenHash, expiresAt];
    const { rows } = await db.query(query, values);

    return rows[0];
};

// Find a valid refresh token by its hash
const findValidByHash = async (tokenHash, db = pool) => {
    const query = `
        SELECT
            refresh_token_id,
            user_id,
            token_hash,
            expires_at,
            revoked_at
        FROM refresh_tokens
        WHERE token_hash = $1
          AND expires_at > CURRENT_TIMESTAMP
          AND revoked_at IS NULL
        LIMIT 1
        FOR UPDATE;
    `;

    const { rows } = await db.query(query, [tokenHash]);

    return rows[0] || null;
};

// Revoke a refresh token
const revokeById = async (refreshTokenId, db = pool) => {
    const query = `
        UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE refresh_token_id = $1
          AND revoked_at IS NULL
        RETURNING refresh_token_id;
    `;

    const { rows } = await db.query(query, [refreshTokenId]);

    return rows[0] || null;
};

// Revoke all refresh tokens belonging to a user
const revokeAllByUserId = async (userId, db = pool) => {
    const query = `
        UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND revoked_at IS NULL
        RETURNING refresh_token_id;
    `;

    const { rows } = await db.query(query, [userId]);

    return rows;
};

module.exports = {
    create,
    findValidByHash,
    revokeById,
    revokeAllByUserId,
};
