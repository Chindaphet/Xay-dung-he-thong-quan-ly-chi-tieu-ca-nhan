
const authService = require("../services/auth.service");
const userRepository = require("../repositories/user.repository");

// Register controller
const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

// Login controller
const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Get authenticated user information
const getMe = async (req, res, next) => {
    try {
        const user = await userRepository.findById(
            req.user.user_id
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User information retrieved successfully.",
            data: {
                user,
            },
        });
    } catch (error) {
        next(error);
    }
};
// Update current user profile
const updateMe = async (req, res, next) => {
    try {
        const user = await authService.updateProfile(
            req.user.user_id,
            {
                username: req.body.username,
                fullName: req.body.full_name,
                email: req.body.email,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: {
                user,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Refresh token controller
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body || {};

        const result = await authService.refreshAccessToken(
            refreshToken
        );

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Logout controller
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body || {};

        await authService.logout(refreshToken);

        return res.status(200).json({
            success: true,
            message: "Logout successful.",
        });
    } catch (error) {
        next(error);
    }
};

// Request password reset controller
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body || {};

        const result = await authService.requestPasswordReset(email);

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

// Reset password controller
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body || {};

        const result = await authService.resetPassword(
            token,
            password
        );

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

// Change password controller
const changePassword = async (req, res, next) => {
    try {
        const result = await authService.changePassword(
            req.user.user_id,
            {
                currentPassword: req.body.currentPassword,
                newPassword: req.body.newPassword,
                confirmPassword: req.body.confirmPassword,
            }
        );

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateMe,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
};
