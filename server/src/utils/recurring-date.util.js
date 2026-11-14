
/**
 * Recurring Date Utility
 *
 * Calculate the next occurrence date for recurring transactions.
 * Monthly and yearly schedules follow the Anchor Day rule.
 */
const getDaysInMonth = (year, month) => {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
};
// Format a UTC date as YYYY-MM-DD
const formatDate = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// Validate YYYY-MM-DD without relying on local timezone
const parseDate = (dateString) => {
    if (
        typeof dateString !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {
        throw new Error("Date must use YYYY-MM-DD format.");
    }

    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new Error("Invalid calendar date.");
    }

    return date;
};

// Calculate the next recurring date
const getNextDueDate = (startDate, currentDate, frequency) => {
    const start = parseDate(startDate);
    const current = parseDate(currentDate);

    let nextDate;

    switch (frequency) {
        case "daily": {
            nextDate = new Date(current);
            nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            break;
        }

        case "weekly": {
            nextDate = new Date(current);
            nextDate.setUTCDate(nextDate.getUTCDate() + 7);
            break;
        }

        case "monthly": {
            const year = current.getUTCFullYear();
            const month = current.getUTCMonth() + 1;

            const targetYear = year + Math.floor(month / 12);
            const targetMonth = month % 12;

            const anchorDay = start.getUTCDate();
            const lastDay = getDaysInMonth(targetYear, targetMonth);
            const targetDay = Math.min(anchorDay, lastDay);

            nextDate = new Date(
                Date.UTC(targetYear, targetMonth, targetDay)
            );
            break;
        }

        case "yearly": {
            const targetYear = current.getUTCFullYear() + 1;
            const targetMonth = start.getUTCMonth();
            const anchorDay = start.getUTCDate();

            const lastDay = getDaysInMonth(targetYear, targetMonth);
            const targetDay = Math.min(anchorDay, lastDay);

            nextDate = new Date(
                Date.UTC(targetYear, targetMonth, targetDay)
            );
            break;
        }

        default:
            throw new Error("Unsupported recurring frequency.");
    }

    return formatDate(nextDate);
};

module.exports = {
    getNextDueDate,
};
