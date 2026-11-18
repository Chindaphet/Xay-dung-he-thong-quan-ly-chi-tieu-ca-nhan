
const ALLOWED_THEMES = ["light", "dark", "system"];

const ALLOWED_CURRENCIES = ["VND", "USD", "THB"];

const ALLOWED_NUMBER_FORMATS = ["vi-VN", "en-US"];

const validateSettings = (data) => {
    const errors = {};

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: {
                body: "Invalid settings data.",
            },
        };
    }

    const { theme, currency, numberFormat } = data;

    if (!ALLOWED_THEMES.includes(theme)) {
        errors.theme = "Theme must be light, dark, or system.";
    }

    if (!ALLOWED_CURRENCIES.includes(currency)) {
        errors.currency = "Currency must be VND, USD, or THB.";
    }

    if (!ALLOWED_NUMBER_FORMATS.includes(numberFormat)) {
        errors.numberFormat = "Number format must be vi-VN or en-US.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

module.exports = {
    validateSettings,
};
