
const SUPPORTED_LANGUAGES = ["vi", "en", "th", "lo"];

// Validate registration data
const validateRegister = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Registration data must be an object."],
        };
    }

    const {
        username,
        full_name,
        email,
        password,
        preferred_language = "vi",
    } = data;

    // Username validation
    if (typeof username !== "string" || !username.trim()) {
        errors.push("Username is required.");
    } else if (
        username.trim().length < 3 ||
        username.trim().length > 50
    ) {
        errors.push("Username must be between 3 and 50 characters.");
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        errors.push("Username can contain only letters, numbers, and underscores.");
    }

    // Full name validation
    if (typeof full_name !== "string" || !full_name.trim()) {
        errors.push("Full name is required.");
    } else if (full_name.trim().length > 100) {
        errors.push("Full name must not exceed 100 characters.");
    }

    // Email validation
    if (typeof email !== "string" || !email.trim()) {
        errors.push("Email is required.");
    } else if (
        email.trim().length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        errors.push("Please enter a valid email address.");
    }

    // Password validation
    if (typeof password !== "string" || !password) {
        errors.push("Password is required.");
    } else if (password.length < 8 || password.length > 72) {
        errors.push("Password must be between 8 and 72 characters.");
    }

    // Preferred language validation
    if (
        typeof preferred_language !== "string" ||
        !SUPPORTED_LANGUAGES.includes(preferred_language)
    ) {
        errors.push("Unsupported preferred language.");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate login data
const validateLogin = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Login data must be an object."],
        };
    }

    const { identifier, password } = data;

    // Email or username validation
    if (typeof identifier !== "string" || !identifier.trim()) {
        errors.push("Email or username is required.");
    } else if (identifier.trim().length > 255) {
        errors.push("Email or username is too long.");
    }

    // Password validation
    if (typeof password !== "string" || !password) {
        errors.push("Password is required.");
    } else if (password.length > 72) {
        errors.push("Password must not exceed 72 characters.");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate forgot password request
const validateForgotPassword = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Request data must be an object."],
        };
    }

    const { email } = data;

    if (typeof email !== "string" || !email.trim()) {
        errors.push("Email is required.");
    } else if (
        email.trim().length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        errors.push("Please enter a valid email address.");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate reset password request
const validateResetPassword = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Request data must be an object."],
        };
    }

    const { token, password } = data;

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
        errors.push("A valid reset token is required.");
    }

    if (typeof password !== "string" || !password) {
        errors.push("Password is required.");
    } else if (password.length < 8 || password.length > 72) {
        errors.push("Password must be between 8 and 72 characters.");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate change password request
const validateChangePassword = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Change password data must be an object."],
        };
    }

    const {
        currentPassword,
        newPassword,
        confirmPassword,
    } = data;

    if (typeof currentPassword !== "string" || !currentPassword) {
        errors.push("Current password is required.");
    } else if (currentPassword.length > 72) {
        errors.push("Current password must not exceed 72 characters.");
    }

    if (typeof newPassword !== "string" || !newPassword) {
        errors.push("New password is required.");
    } else if (newPassword.length < 8 || newPassword.length > 72) {
        errors.push("New password must be between 8 and 72 characters.");
    }

    if (typeof confirmPassword !== "string" || !confirmPassword) {
        errors.push("Password confirmation is required.");
    } else if (
        typeof newPassword === "string" &&
        newPassword !== confirmPassword
    ) {
        errors.push("New password and confirmation do not match.");
    }

    if (
        typeof currentPassword === "string" &&
        typeof newPassword === "string" &&
        currentPassword === newPassword
    ) {
        errors.push("New password must be different from current password.");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword,
};
