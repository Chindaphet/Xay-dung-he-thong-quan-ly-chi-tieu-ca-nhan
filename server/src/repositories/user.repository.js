
const pool = require("../config/database");

// Find a user by email
const findByEmail = async (email) => {
    const query = `
        SELECT
            user_id,
            username,
            full_name,
            email,
            password_hash,
            preferred_language,
            created_at,
            updated_at
        FROM users
        WHERE email = $1
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [email]);

    return rows[0] || null;
};

// Find a user by username
const findByUsername = async (username) => {
    const query = `
        SELECT
            user_id,
            username,
            full_name,
            email,
            password_hash,
            preferred_language,
            created_at,
            updated_at
        FROM users
        WHERE username = $1
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [username]);

    return rows[0] || null;
};
// Find a user by ID
const findById = async (userId) => {
    const query = `
        SELECT
            user_id,
            username,
            full_name,
            email,
            preferred_language,
            created_at,
            updated_at
        FROM users
        WHERE user_id = $1
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows[0] || null;
};

// Create a new user
const createUser = async ({
    username,
    fullName,
    email,
    passwordHash,
    preferredLanguage = "vi",
}) => {
    const query = `
        INSERT INTO users (
            username,
            full_name,
            email,
            password_hash,
            preferred_language
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            user_id,
            username,
            full_name,
            email,
            preferred_language,
            created_at,
            updated_at;
    `;

    const values = [
        username,
        fullName,
        email,
        passwordHash,
        preferredLanguage,
    ];

    const { rows } = await pool.query(query, values);

    return rows[0];
};

// Update user password
// Optional client allows this query to participate in a DB transaction.
const updatePasswordByUserId = async (
    userId,
    passwordHash,
    client = pool
) => {
    const query = `
        UPDATE users
        SET
            password_hash = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING
            user_id,
            updated_at;
    `;

    const values = [
        passwordHash,
        userId,
    ];

    const { rows } = await client.query(query, values);

    return rows[0] || null;
};

// Update user profile
const updateProfileByUserId = async (
    userId,
    fullName,
    email
) => {
    const query = `
        UPDATE users
        SET
            full_name = $1,
            email = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
        RETURNING
            user_id,
            username,
            full_name,
            email,
            preferred_language,
            created_at,
            updated_at;
    `;

    const values = [
        fullName,
        email,
        userId,
    ];

    const { rows } = await pool.query(query, values);

    return rows[0] || null;
};
module.exports = {
    findByEmail,
    findByUsername,
    findById,
    createUser,
    updatePasswordByUserId,
    updateProfileByUserId,
};