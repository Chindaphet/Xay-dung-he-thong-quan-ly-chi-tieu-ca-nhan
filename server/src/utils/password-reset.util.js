
const crypto = require("crypto");

// Generate a cryptographically secure password reset token
const generatePasswordResetToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

// Hash password reset token using SHA-256
const hashPasswordResetToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

module.exports = {
    generatePasswordResetToken,
    hashPasswordResetToken,
};
