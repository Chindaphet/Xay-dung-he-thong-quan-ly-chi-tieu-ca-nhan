

const categoryRepository = require("../repositories/category.repository");

const {
    validateCategory,
    validateCategoryUpdate,
    validateCategoryId,
    validateCategoryStatus,
} = require("../validators/category.validator");


// Create a standard API error
const createError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};


// Handle duplicate category names
const handleDatabaseError = (error) => {
    if (error.code === "23505") {
        throw createError(
            "A category with this name and type already exists.",
            409
        );
    }

    throw error;
};


// Validate category ID
const validateId = (categoryId) => {
    if (!validateCategoryId(categoryId)) {
        throw createError("Invalid category ID.");
    }
};


// Find an existing category
const getExistingCategory = async (categoryId, userId) => {
    validateId(categoryId);

    const category = await categoryRepository.findByIdAndUserId(
        categoryId,
        userId
    );

    if (!category) {
        throw createError("Category not found.", 404);
    }

    return category;
};


// Check duplicate category name and type
const checkDuplicateCategory = async (
    userId,
    name,
    type,
    excludeCategoryId = null
) => {
    const categories = await categoryRepository.findAllByUserId(
        userId,
        true
    );

    const duplicate = categories.some((category) => {
        return (
            category.name === name &&
            category.type === type &&
            category.category_id !== excludeCategoryId
        );
    });

    if (duplicate) {
        throw createError(
            "A category with this name and type already exists.",
            409
        );
    }
};


// Create a new category
const createCategory = async (userId, data) => {
    const validation = validateCategory(data);

    if (!validation.isValid) {
        const error = createError("Category validation failed.");
        error.details = validation.errors;
        throw error;
    }

    const name = data.name.trim();

    await checkDuplicateCategory(
        userId,
        name,
        data.type
    );

    try {
        return await categoryRepository.createCategory({
            userId,
            name,
            type: data.type,
            color: data.color ?? null,
            icon: data.icon ?? null,
            isDefault: false,
        });
    } catch (error) {
        handleDatabaseError(error);
    }
};

// Get all categories belonging to a user
const getAllCategories = async (
    userId,
    includeInactive = false
) => {
    if (typeof includeInactive !== "boolean") {
        throw createError(
            "includeInactive must be a boolean."
        );
    }
    return await categoryRepository.findAllByUserId(
        userId,
        includeInactive
    );
};

// Get one category belonging to a user
const getCategoryById = async (categoryId, userId) => {
    return await getExistingCategory(categoryId, userId);
};

// Update an existing category
const updateCategory = async (
    categoryId,
    userId,
    data
) => {
    const validation = validateCategoryUpdate(data);

    if (!validation.isValid) {
        const error = createError(
            "Category update validation failed."
        );
        error.details = validation.errors;
        throw error;
    }

    const existingCategory = await getExistingCategory(
        categoryId,
        userId
    );

    if (existingCategory.is_default) {
        throw createError(
            "Default categories cannot be modified.",
            403
        );
    }

    const updatedName =
        data.name !== undefined
            ? data.name.trim()
            : existingCategory.name;

    await checkDuplicateCategory(
        userId,
        updatedName,
        existingCategory.type,
        categoryId
    );

    const updatedData = {
        name: updatedName,
        color:
            data.color !== undefined
                ? data.color
                : existingCategory.color,
        icon:
            data.icon !== undefined
                ? data.icon
                : existingCategory.icon,
    };

    try {
        return await categoryRepository.updateCategory(
            categoryId,
            userId,
            updatedData
        );
    } catch (error) {
        handleDatabaseError(error);
    }
};


// Activate or deactivate a category
const toggleCategory = async (
    categoryId,
    userId,
    isActive
) => {
    validateId(categoryId);

    if (!validateCategoryStatus(isActive)) {
        throw createError(
            "Category status must be a boolean."
        );
    }

    const existingCategory = await getExistingCategory(
        categoryId,
        userId
    );

    if (existingCategory.is_default) {
        throw createError(
            "Default categories cannot be deactivated or activated.",
            403
        );
    }

    return await categoryRepository.toggleCategory(
        categoryId,
        userId,
        isActive
    );
};


module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    toggleCategory,
};
