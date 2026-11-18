
const settingsService = require("../services/settings.service");
const { validateSettings } = require("../validators/settings.validator");

// GET /api/settings
const getSettings = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const settings = await settingsService.getSettings(userId);

        return res.status(200).json({
            success: true,
            message: "Settings retrieved successfully.",
            data: {
                settings,
            },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const validation = validateSettings(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid settings data.",
                details: validation.errors,
            });
        }

        const settings = await settingsService.updateSettings(
            userId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Settings updated successfully.",
            data: {
                settings,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettings,
    updateSettings,
};
