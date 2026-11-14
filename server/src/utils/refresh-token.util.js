

const crypto = require("crypto");

// Generate a cryptographically secure refresh token
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};

// Hash a refresh token using SHA-256
const hashRefreshToken = (token) => {
    if (typeof token !== "string" || !token) {
        throw new Error("Refresh token is required.");
    }

    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

module.exports = {
    generateRefreshToken,
    hashRefreshToken,
};
