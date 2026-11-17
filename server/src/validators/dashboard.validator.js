
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Check whether a date is a real calendar date
const isValidDate = (value) => {
    if (typeof value !== "string") {
        return false;
    }

    if (!DATE_REGEX.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

// Validate dashboard date range
const validateDashboardDateRange = (data) => {
    const errors = [];
    const { startDate, endDate } = data;
    if (!startDate) {
        errors.push({
            field: "startDate",
            message: "Start date is required.",
        });
    } else if (!isValidDate(startDate)) {
        errors.push({
            field: "startDate",
            message: "Start date must be a valid date in YYYY-MM-DD format.",
        });
    }

    if (!endDate) {
        errors.push({
            field: "endDate",
            message: "End date is required.",
        });
    } else if (!isValidDate(endDate)) {
        errors.push({
            field: "endDate",
            message: "End date must be a valid date in YYYY-MM-DD format.",
        });
    }

    if (
        isValidDate(startDate) &&
        isValidDate(endDate) &&
        endDate < startDate
    ) {
        errors.push({
            field: "endDate",
            message: "End date must be on or after start date.",
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateDashboardDateRange,
};
