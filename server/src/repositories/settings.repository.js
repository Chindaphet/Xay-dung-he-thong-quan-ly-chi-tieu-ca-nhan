
const pool = require("../config/database");

// Get settings by user ID
const findByUserId = async (userId) => {
    const query = `
        SELECT
            setting_id,
            user_id,
            theme,
            currency,
            number_format,
            created_at,
            updated_at
        FROM user_settings
        WHERE user_id = $1
        LIMIT 1
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows[0] || null;
};

// Create default settings for a user
const createDefault = async (userId) => {
    const query = `
        INSERT INTO user_settings (user_id)
        VALUES ($1)
        ON CONFLICT (user_id)
        DO UPDATE SET user_id = EXCLUDED.user_id
        RETURNING
            setting_id,
            user_id,
            theme,
            currency,
            number_format,
            created_at,
            updated_at
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows[0];
};

// Update user settings
const update = async (userId, settings) => {
    const query = `
        INSERT INTO user_settings (
            user_id,
            theme,
            currency,
            number_format
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET
            theme = EXCLUDED.theme,
            currency = EXCLUDED.currency,
            number_format = EXCLUDED.number_format,
            updated_at = CURRENT_TIMESTAMP
        RETURNING
            setting_id,
            user_id,
            theme,
            currency,
            number_format,
            created_at,
            updated_at
    `;

    const values = [
        userId,
        settings.theme,
        settings.currency,
        settings.numberFormat,
    ];

    const { rows } = await pool.query(query, values);

    return rows[0];
};

module.exports = {
    findByUserId,
    createDefault,
    update,
};
