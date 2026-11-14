
const jwt = require("jsonwebtoken");

// Create access token
const generateAccessToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    return jwt.sign(
        {
            user_id: user.user_id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "15m",
            issuer: "personal-expense-api",
            subject: user.user_id,
        }
    );
};

// Verify access token
const verifyAccessToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "personal-expense-api",
    });
};

module.exports = {
    generateAccessToken,
    verifyAccessToken,
};
