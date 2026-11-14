

const isUUID = (value) => {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
};

// Validate category data
const validateCategory = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Category data must be an object."],
        };
    }

    const {
        name,
        type,
        color,
        icon,
        isDefault,
    } = data;

    // Category name validation
    if (
        typeof name !== "string" ||
        name.trim().length === 0 ||
        name.trim().length > 100
    ) {
        errors.push(
            "Category name must be between 1 and 100 characters."
        );
    }

    // Category type validation
    if (!["income", "expense"].includes(type)) {
        errors.push(
            "Category type must be income or expense."
        );
    }

    // Category color validation
    if (
        color !== undefined &&
        color !== null &&
        (
            typeof color !== "string" ||
            !/^#[0-9a-fA-F]{6}$/.test(color)
        )
    ) {
        errors.push(
            "Category color must be a valid HEX color (e.g. #FF5733)."
        );
    }

    // Category icon validation
    if (
        icon !== undefined &&
        icon !== null &&
        (
            typeof icon !== "string" ||
            icon.trim().length === 0 ||
            icon.length > 50
        )
    ) {
        errors.push(
            "Category icon must not exceed 50 characters."
        );
    }

    // Users cannot create default categories
    if (isDefault !== undefined) {
        errors.push(
            "Default category status cannot be provided directly."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};


// Validate category update data
const validateCategoryUpdate = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Category update data must be an object."],
        };
    }

    const allowedFields = ["name", "color", "icon"];

    const keys = Object.keys(data);

    if (keys.length === 0) {
        errors.push("At least one field must be provided.");
    }

    for (const key of keys) {
        if (!allowedFields.includes(key)) {
            errors.push(`Field '${key}' cannot be updated.`);
        }
    }

    if (data.name !== undefined) {
        if (
            typeof data.name !== "string" ||
            data.name.trim().length === 0 ||
            data.name.trim().length > 100
        ) {
            errors.push(
                "Category name must be between 1 and 100 characters."
            );
        }
    }

    if (
        data.color !== undefined &&
        data.color !== null &&
        (
            typeof data.color !== "string" ||
            !/^#[0-9a-fA-F]{6}$/.test(data.color)
        )
    ) {
        errors.push(
            "Category color must be a valid HEX color (e.g. #FF5733)."
        );
    }

    if (
        data.icon !== undefined &&
        data.icon !== null &&
        (
            typeof data.icon !== "string" ||
            data.icon.trim().length === 0 ||
            data.icon.length > 50
        )
    ) {
        errors.push(
            "Category icon must not exceed 50 characters."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};


// Validate category ID
const validateCategoryId = (categoryId) => {
    return isUUID(categoryId);
};


// Validate category active status
const validateCategoryStatus = (isActive) => {
    return typeof isActive === "boolean";
};

module.exports = {
    validateCategory,
    validateCategoryUpdate,
    validateCategoryId,
    validateCategoryStatus,
};

