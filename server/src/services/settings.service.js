
const settingsRepository = require("../repositories/settings.repository");

const getSettings = async (userId) => {
    let settings = await settingsRepository.findByUserId(userId);

    if (!settings) {
        settings = await settingsRepository.createDefault(userId);
    }

    return settings;
};

const updateSettings = async (userId, settingsData) => {
    // Ensure settings exist before updating
    await getSettings(userId);

    const updatedSettings = await settingsRepository.update(
        userId,
        settingsData
    );

    return updatedSettings;
};

module.exports = {
    getSettings,
    updateSettings,
};
