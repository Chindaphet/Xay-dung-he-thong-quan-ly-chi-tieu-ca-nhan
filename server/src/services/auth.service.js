
const bcrypt = require("bcrypt");
const pool = require("../config/database");

const userRepository = require("../repositories/user.repository");
const refreshTokenRepository = require("../repositories/refresh-token.repository");
const passwordResetRepository = require("../repositories/password-reset.repository");

const {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
} = require("../validators/auth.validator");

const { generateAccessToken } = require("../utils/token.util");

const {
    generateRefreshToken,
    hashRefreshToken,
} = require("../utils/refresh-token.util");

const {
    generatePasswordResetToken,
    hashPasswordResetToken,
} = require("../utils/password-reset.util");

const { sendEmail } = require("./email.service");

// Refresh token lifetime: 7 days
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

// Access token lifetime: 15 minutes
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 900;

// Password reset token lifetime: 30 minutes
const PASSWORD_RESET_EXPIRES_IN_MINUTES = 30;

// Generic response to prevent account enumeration
const PASSWORD_RESET_MESSAGE =
    "If the email address is registered, a password reset link will be sent.";

// Calculate refresh token expiration date
const getRefreshTokenExpiration = () => {
    return new Date(
        Date.now() +
        REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
    );
};

// Escape HTML content
const escapeHtml = (value) => {
    return String(value || "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[character];
    });
};

// Register a new user
const register = async (data) => {
    const validation = validateRegister(data);

    if (!validation.isValid) {
        const error = new Error("Invalid registration data.");
        error.status = 400;
        error.details = validation.errors;
        throw error;
    }

    const username = data.username.trim().toLowerCase();
    const fullName = data.full_name.trim();
    const email = data.email.trim().toLowerCase();
    const preferredLanguage = (data.preferred_language || "vi").trim();

    const existingUsername = await userRepository.findByUsername(username);

    if (existingUsername) {
        const error = new Error("Username is already taken.");
        error.status = 409;
        throw error;
    }

    const existingEmail = await userRepository.findByEmail(email);

    if (existingEmail) {
        const error = new Error("Email is already registered.");
        error.status = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await userRepository.createUser({
        username,
        fullName,
        email,
        passwordHash,
        preferredLanguage,
    });

    return user;
};

// Login an existing user
const login = async (data) => {
    const validation = validateLogin(data);

    if (!validation.isValid) {
        const error = new Error("Invalid login data.");
        error.status = 400;
        error.details = validation.errors;
        throw error;
    }

    const identifier = data.identifier.trim().toLowerCase();

    const user = identifier.includes("@")
        ? await userRepository.findByEmail(identifier)
        : await userRepository.findByUsername(identifier);

    if (!user) {
        const error = new Error("Invalid email/username or password.");
        error.status = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password_hash
    );

    if (!isPasswordValid) {
        const error = new Error("Invalid email/username or password.");
        error.status = 401;
        throw error;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = getRefreshTokenExpiration();

    await refreshTokenRepository.create({
        userId: user.user_id,
        tokenHash,
        expiresAt,
    });

    return {
        user: {
            user_id: user.user_id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            preferred_language: user.preferred_language,
        },
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
        refreshTokenExpiresIn:
            REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60,
    };
};

// Refresh access token and rotate refresh token
const refreshAccessToken = async (refreshToken) => {
    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
        const error = new Error("Refresh token is required.");
        error.status = 400;
        throw error;
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const storedToken = await refreshTokenRepository.findValidByHash(
            tokenHash,
            client
        );

        if (!storedToken) {
            const error = new Error("Invalid or expired refresh token.");
            error.status = 401;
            throw error;
        }

        const userResult = await client.query(
            `
                SELECT
                    user_id,
                    username
                FROM users
                WHERE user_id = $1
                LIMIT 1;
            `,
            [storedToken.user_id]
        );

        const user = userResult.rows[0];

        if (!user) {
            const error = new Error("User account not found.");
            error.status = 401;
            throw error;
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken();
        const newTokenHash = hashRefreshToken(newRefreshToken);
        const newExpiresAt = getRefreshTokenExpiration();

        const revokedToken = await refreshTokenRepository.revokeById(
            storedToken.refresh_token_id,
            client
        );

        if (!revokedToken) {
            const error = new Error("Refresh token has already been used.");
            error.status = 401;
            throw error;
        }

        await refreshTokenRepository.create(
            {
                userId: user.user_id,
                tokenHash: newTokenHash,
                expiresAt: newExpiresAt,
            },
            client
        );

        await client.query("COMMIT");

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            tokenType: "Bearer",
            expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
            refreshTokenExpiresIn:
                REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Logout user by revoking the refresh token
const logout = async (refreshToken) => {
    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
        const error = new Error("Refresh token is required.");
        error.status = 400;
        throw error;
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const storedToken = await refreshTokenRepository.findValidByHash(
        tokenHash
    );

    if (!storedToken) {
        const error = new Error("Invalid or expired refresh token.");
        error.status = 401;
        throw error;
    }

    await refreshTokenRepository.revokeById(
        storedToken.refresh_token_id
    );

    return {
        message: "Logout successful.",
    };
};

// Request a password reset email
const requestPasswordReset = async (email) => {
    const validation = validateForgotPassword({ email });

    if (!validation.isValid) {
        const error = new Error("Invalid password reset request.");
        error.status = 400;
        error.details = validation.errors;
        throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    // Always return the same message if the account does not exist
    if (!user) {
        return {
            message: PASSWORD_RESET_MESSAGE,
        };
    }

    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);

    const expiresAt = new Date(
        Date.now() +
        PASSWORD_RESET_EXPIRES_IN_MINUTES * 60 * 1000
    );

    const client = await pool.connect();
    let resetTokenRecord;

    try {
        await client.query("BEGIN");

        // Invalidate previous unused reset tokens
        await passwordResetRepository.invalidateUnusedTokensByUserId(
            user.user_id,
            client
        );

        // Store only the hashed token
        resetTokenRecord =
            await passwordResetRepository.createPasswordResetToken({
                userId: user.user_id,
                tokenHash,
                expiresAt,
                client,
            });

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    const clientUrl = process.env.CLIENT_URL;

    if (!clientUrl) {
        console.error("Password reset email could not be sent: CLIENT_URL is missing.");

        await pool.query(
            `
                UPDATE password_reset_tokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE password_reset_token_id = $1
                  AND used_at IS NULL;
            `,
            [resetTokenRecord.password_reset_token_id]
        );

        return {
            message: PASSWORD_RESET_MESSAGE,
        };
    }

    const resetUrl = new URL("/", clientUrl);
    resetUrl.searchParams.set("token", rawToken);

    const safeName = escapeHtml(user.full_name || user.username);

    const subject = "Reset Your Devo Password";

    const text = `
Hello ${user.full_name || user.username},

We received a request to reset your Devo Personal Expense password.

Open the following link to reset your password:

${resetUrl.toString()}

This link expires in ${PASSWORD_RESET_EXPIRES_IN_MINUTES} minutes.

If you did not request this change, you can ignore this email.

Devo Personal Expense
    `.trim();

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Password Reset Request</h2>

            <p>Hello ${safeName},</p>

            <p>
                We received a request to reset your
                Devo Personal Expense password.
            </p>

            <p>
                <a
                    href="${resetUrl.toString()}"
                    style="
                        display: inline-block;
                        padding: 12px 20px;
                        background-color: #7c3aed;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 6px;
                    "
                >
                    Reset Password
                </a>
            </p>

            <p>
                This link expires in
                ${PASSWORD_RESET_EXPIRES_IN_MINUTES} minutes.
            </p>

            <p>
                If you did not request this change,
                you can safely ignore this email.
            </p>

            <p>Devo Personal Expense</p>
        </div>
    `;

    try {
        await sendEmail({
            to: normalizedEmail,
            subject,
            text,
            html,
        });
    } catch (error) {
        console.error(
            "Password reset email delivery failed:",
            error.message
        );

        // Invalidate the token if email delivery fails
        await pool.query(
            `
                UPDATE password_reset_tokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE password_reset_token_id = $1
                  AND used_at IS NULL;
            `,
            [resetTokenRecord.password_reset_token_id]
        );
    }

    return {
        message: PASSWORD_RESET_MESSAGE,
    };
};

// Reset user password using a valid reset token
const resetPassword = async (token, password) => {
    const validation = validateResetPassword({
        token,
        password,
    });

    if (!validation.isValid) {
        const error = new Error("Invalid password reset data.");
        error.status = 400;
        error.details = validation.errors;
        throw error;
    }

    const tokenHash = hashPasswordResetToken(token);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Find and lock the valid reset token
        const storedToken =
            await passwordResetRepository.findValidTokenForUpdate(
                tokenHash,
                client
            );

        if (!storedToken) {
            const error = new Error(
                "Invalid, expired, or already used password reset token."
            );
            error.status = 400;
            throw error;
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(password, 12);

        // Update the user's password
        const updatedUser = await userRepository.updatePasswordByUserId(
            storedToken.user_id,
            passwordHash,
            client
        );

        if (!updatedUser) {
            const error = new Error("Unable to reset password.");
            error.status = 400;
            throw error;
        }

        // Mark the current token as used
        const usedToken = await passwordResetRepository.markTokenAsUsed(
            storedToken.password_reset_token_id,
            client
        );

        if (!usedToken) {
            const error = new Error("Password reset token has already been used.");
            error.status = 400;
            throw error;
        }

        // Invalidate any other unused reset tokens
        await passwordResetRepository.invalidateUnusedTokensByUserId(
            storedToken.user_id,
            client
        );

        // Revoke all existing refresh tokens
        await refreshTokenRepository.revokeAllByUserId(
            storedToken.user_id,
            client
        );

        await client.query("COMMIT");

        return {
            message: "Password has been reset successfully. Please log in again.",
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
// Update user profile
const updateProfile = async (userId, data) => {
    const fullName = data.fullName?.trim();
    const email = data.email?.trim().toLowerCase();

    if (!fullName || !email) {
        throw new Error("Full name and email are required.");
    }

    if (fullName.length > 100) {
        throw new Error("Full name must not exceed 100 characters.");
    }

    const existingUser = await userRepository.findByEmail(email);

    if (
        existingUser &&
        existingUser.user_id !== userId
    ) {
        throw new Error("Email is already in use.");
    }

    const updatedUser = await userRepository.updateProfileByUserId(
        userId,
        fullName,
        email
    );

    if (!updatedUser) {
        throw new Error("User not found.");
    }

    return updatedUser;
};

module.exports = {
    register,
    login,
    refreshAccessToken,
    logout,
    requestPasswordReset,
    resetPassword,
    updateProfile,
};