
const pool = require("../config/database");

// Find an active category belonging to a specific user
const findActiveByIdAndUserId = async (categoryId, userId) => {
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
          AND is_active = TRUE
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [
        categoryId,
        userId,
    ]);

    return rows[0] || null;
};

// Create a new category
const createCategory = async ({userId, name,type,color = null,icon = null,isDefault = false,}) => {
    const query = `
        INSERT INTO categories (
            user_id,
            name,
            type,
            color,
            icon,
            is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            category_id,
            user_id,
            name,
            type,
            color,
            icon,
            is_default,
            is_active,
            created_at;
    `;

    const { rows } = await pool.query(query, [
        userId,
        name,
        type,
        color,
        icon,
        isDefault,
    ]);

    return rows[0];
};

// Find all categories belonging to a specific user
const findAllByUserId = async (userId, includeInactive = false) => {
    const query = `
        SELECT
            category_id,
            user_id,
            name,
            type,
            color,
            icon,
            is_default,
            is_active,
            created_at
        FROM categories
        WHERE user_id = $1
          AND ($2::BOOLEAN = TRUE OR is_active = TRUE)
        ORDER BY
            type ASC,
            is_default DESC,
            name ASC;
    `;

    const { rows } = await pool.query(query, [
        userId,
        includeInactive,
    ]);

    return rows;
};

// Find a category belonging to a specific user
const findByIdAndUserId = async (categoryId, userId) => {
    const query = `
        SELECT
            category_id,
            user_id,
            name,
            type,
            color,
            icon,
            is_default,
            is_active,
            created_at
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

// Update a category
const updateCategory = async (categoryId,userId,{name,color,icon,}) => {
    const query = `
        UPDATE categories
        SET
            name = $1,
            color = $2,
            icon = $3
        WHERE category_id = $4
          AND user_id = $5
          AND is_default = FALSE
        RETURNING
            category_id,
            user_id,
            name,
            type,
            color,
            icon,
            is_default,
            is_active,
            created_at;
    `;

    const { rows } = await pool.query(query, [
        name,
        color,
        icon,
        categoryId,
        userId,
    ]);
    return rows[0] || null;
};

// Activate or deactivate a category
const toggleCategory = async (categoryId,userId,isActive) => {
    const query = `
        UPDATE categories
        SET is_active = $1
        WHERE category_id = $2
          AND user_id = $3
          AND is_default = FALSE
        RETURNING
            category_id,
            user_id,
            name,
            type,
            is_active;
    `;

    const { rows } = await pool.query(query, [
        isActive,
        categoryId,
        userId,
    ]);

    return rows[0] || null;
};
// Delete a category
const deleteCategory = async (categoryId, userId) => {
    const query = `
        DELETE FROM categories
        WHERE category_id = $1
          AND user_id = $2
          AND is_default = FALSE
        RETURNING category_id;
    `;

    const { rows } = await pool.query(query, [
        categoryId,
        userId,
    ]);

    return rows[0] || null;
};
module.exports = {
    findActiveByIdAndUserId,
    createCategory,
    findAllByUserId,
    findByIdAndUserId,
    updateCategory,
    toggleCategory,
    deleteCategory,
};
