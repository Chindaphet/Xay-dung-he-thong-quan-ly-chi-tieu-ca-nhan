
const pool = require("../config/database");
const recurringRepository = require("../repositories/recurring.repository");
const categoryRepository = require("../repositories/category.repository");
const paymentMethodRepository = require("../repositories/payment-method.repository");
const {getNextDueDate,} = require("../utils/recurring-date.util");
const {
    validateRecurring,
    validateRecurringUpdate,
    validateRecurringId,
    validateRecurringStatus,
} = require("../validators/recurring.validator");
// Maximum occurrences processed per recurring transaction per run
const MAX_OCCURRENCES = 1000;
// Create a standard API error
const createError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};
// Handle database errors
const handleDatabaseError = (error) => {
    if (error.code === "23505") {
        throw createError("A recurring transaction already exists.",409);
    }
    if (error.code === "23503") {
        throw createError("The referenced category or payment method does not exist.",400);
    }

    if (error.code === "23514") {
        throw createError("Recurring transaction data violates a database constraint.",400);
    }
    throw error;
};

// Validate YYYY-MM-DD
const validateCurrentDate = (dateString) => {
    if (
        typeof dateString !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {
        throw new Error(
            "Current date must use YYYY-MM-DD format."
        );
    }
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(
        Date.UTC(year, month - 1, day));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new Error("Invalid current date.");
    }
};

// Get today's date using the application timezone
const getCurrentDate = () => {
    const timeZone =process.env.APP_TIMEZONE || "Asia/Ho_Chi_Minh";
    const parts = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).formatToParts(new Date());
    const values = {};
    for (const part of parts) {values[part.type] = part.value;}
    return `${values.year}-${values.month}-${values.day}`;
};

// Validate request data
const checkValidation = (validation, message) => {
    if (!validation.isValid) {
        const error = createError(message);
        error.details = validation.errors;
        throw error;
    }
};

// Validate recurring ID
const validateId = (recurringId) => {
    if (!validateRecurringId(recurringId)) {
        throw createError("Invalid recurring transaction ID.");
    }
};

// Find an existing recurring transaction
const getExistingRecurring = async (recurringId,userId) => {
    validateId(recurringId);
    const recurring =
        await recurringRepository.findByIdAndUserId(recurringId,userId);
    if (!recurring) {
        throw createError("Recurring transaction not found.",404);
    }
    return recurring;
};

// Validate category and payment method for CRUD
const validateActiveReferences = async (userId,data) => {
    const category =
        await categoryRepository.findActiveByIdAndUserId(
            data.categoryId,
            userId
        );

    if (!category) {
        throw createError("Category not found or inactive.",404);
    }
    if (category.type !== data.type) {
        throw createError("Category type must match recurring transaction type.");
    }
    // Payment method is optional
    if (data.paymentMethodId === null) {
        return;
    }
    const paymentMethod =
        await paymentMethodRepository.findActiveByIdAndUserId(
            data.paymentMethodId,
            userId
        );
    if (!paymentMethod) {
        throw createError("Payment method not found or inactive.",404);
    }
};

// Convert database fields to validator fields
const mapRecurringToData = (recurring) => ({
    categoryId: recurring.category_id,
    paymentMethodId: recurring.payment_method_id,
    type: recurring.type,
    amount: recurring.amount,
    description: recurring.description,
    frequency: recurring.frequency,
    startDate: recurring.start_date,
    endDate: recurring.end_date,
});

// Find the first occurrence that has not passed
const getFirstUpcomingDate = (startDate,frequency,currentDate) => {
    let nextDate = startDate;
    let iterations = 0;
    const MAX_ITERATIONS = 100000;
    while (nextDate < currentDate) {
        nextDate = getNextDueDate(startDate,nextDate,frequency);
        iterations++;
        if (iterations >= MAX_ITERATIONS) {
            throw createError(
                "Unable to calculate the next recurring date."
            );
        }
    }
    return nextDate;
};

// Check whether a future occurrence remains
const hasRemainingOccurrence = (nextDueDate,endDate) => {
    if (!endDate) {
        return true;
    }
    return nextDueDate <= endDate;
};

// Get all recurring transactions
const getAllRecurring = async (userId) => {
    return await recurringRepository.findAllByUserId(
        userId
    );
};

// Get one recurring transaction
const getRecurringById = async (recurringId,userId) => {
    return await getExistingRecurring(
        recurringId,
        userId
    );
};

// Create a recurring transaction
const createRecurring = async (userId, data) => {
    const validation = validateRecurring(data);
    checkValidation(validation, "Recurring transaction validation failed.");
    await validateActiveReferences(userId, data);
    const currentDate = getCurrentDate();
    const nextDueDate = getFirstUpcomingDate(
        data.startDate,
        data.frequency,
        currentDate
    );
    const shouldDeactivate = !hasRemainingOccurrence(nextDueDate,data.endDate);
    const client = await pool.connect();
    let transactionStarted = false;
    try {
        await client.query("BEGIN");
        transactionStarted = true;
        const created = await recurringRepository.createRecurring({
            userId,
            categoryId: data.categoryId,
            paymentMethodId: data.paymentMethodId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            frequency: data.frequency,
            startDate: data.startDate,
            endDate: data.endDate,
            nextDueDate,
        }, client);
        let result = created;
        if (shouldDeactivate) {
            const deactivated = await recurringRepository.toggleRecurring(
                created.recurring_id,
                userId,
                false,
                client
            );
            if (!deactivated) {
                throw new Error(
                    "Failed to deactivate completed recurring transaction."
                );
            }
            result = {
                ...created,
                is_active: false,
            };
        }
        await client.query("COMMIT");
        transactionStarted = false;
        return result;
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                error.rollbackError = rollbackError;
            }
        }
        if (error.status) {
            throw error;
        }
        handleDatabaseError(error);
    } finally {
        client.release();
    }
};

// Update a recurring transaction
const updateRecurring = async (recurringId,userId,data) => {
    const validation = validateRecurringUpdate(data);
    checkValidation(validation,"Recurring transaction update validation failed.");
    const existing = await getExistingRecurring(recurringId,userId);
    // Merge existing values with the updated values
    const updatedData = {
        ...mapRecurringToData(existing),
        ...data,
    };
    // Validate the complete merged data
    const fullValidation = validateRecurring(updatedData);
    checkValidation(fullValidation,"Recurring transaction data is invalid.");
    await validateActiveReferences(userId,updatedData);
    // Recalculate only when the schedule changes
    const scheduleChanged =
        updatedData.frequency !== existing.frequency ||
        updatedData.startDate !== existing.start_date;
    let nextDueDate = existing.next_due_date;
    if (scheduleChanged) {
        nextDueDate = getFirstUpcomingDate(
            updatedData.startDate,
            updatedData.frequency,
            getCurrentDate()
        );
    }
    const shouldDeactivate = !hasRemainingOccurrence(
        nextDueDate,
        updatedData.endDate
    );
    const client = await pool.connect();
    let transactionStarted = false;
    try {
        await client.query("BEGIN");
        transactionStarted = true;
        const updated =
            await recurringRepository.updateRecurring(
                recurringId,
                userId,
                {
                    categoryId: updatedData.categoryId,
                    paymentMethodId: updatedData.paymentMethodId,
                    type: updatedData.type,
                    amount: updatedData.amount,
                    description: updatedData.description,
                    frequency: updatedData.frequency,
                    startDate: updatedData.startDate,
                    endDate: updatedData.endDate,
                    nextDueDate,
                },
                client
            );
        if (!updated) {
            throw createError(
                "Recurring transaction not found.",
                404
            );
        }
        let result = updated;
        // Deactivate if no occurrence remains
        if (shouldDeactivate) {
            const deactivated =
                await recurringRepository.toggleRecurring(
                    recurringId,
                    userId,
                    false,
                    client
                );
            if (!deactivated) {
                throw new Error(
                    "Failed to deactivate recurring transaction."
                );
            }
            result = {
                ...updated,
                is_active: false,
            };
        }
        await client.query("COMMIT");
        transactionStarted = false;
        return result;
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                error.rollbackError = rollbackError;
            }
        }
        throw error;
    } finally {
        client.release();
    }
};

// Activate or deactivate a recurring transaction
const toggleRecurring = async (recurringId,userId,isActive) => {
    validateId(recurringId);
    if (!validateRecurringStatus(isActive)) {
        throw createError("Recurring status must be a boolean value.");
    }
    const existing = await getExistingRecurring(
        recurringId,
        userId
    );
    if (
        isActive &&
        !hasRemainingOccurrence(
            existing.next_due_date,
            existing.end_date
        )
    ) {
        throw createError("Cannot activate a recurring transaction with no remaining occurrences.");
    }
    const updated =
        await recurringRepository.toggleRecurring(
            recurringId,
            userId,
            isActive
        );
    if (!updated) {
        throw createError(
            "Failed to update recurring transaction status.",
            404
        );
    }
    return updated;
};

// Check whether category and payment method are active
const validateRecurringReferences = async (client,recurring) => {
    const categoryQuery = `
        SELECT
            type,
            is_active
        FROM categories
        WHERE category_id = $1
          AND user_id = $2
        FOR SHARE;
    `;
    const { rows: categoryRows } = await client.query(
        categoryQuery,
        [
            recurring.category_id,
            recurring.user_id,
        ]
    );
    const category = categoryRows[0];
    if (!category || !category.is_active) {
        return {
            isValid: false,
            reason: "category_inactive",
        };
    }
    if (category.type !== recurring.type) {
        return {
            isValid: false,
            reason: "category_type_mismatch",
        };
    }
    // Payment method is optional
    if (recurring.payment_method_id === null) {
        return {
            isValid: true,
            reason: null,
        };
    }
    const paymentMethodQuery = `
        SELECT
            is_active
        FROM payment_methods
        WHERE payment_method_id = $1
          AND user_id = $2
        FOR SHARE;
    `;
    const { rows: paymentMethodRows } = await client.query(
        paymentMethodQuery,
        [
            recurring.payment_method_id,
            recurring.user_id,
        ]
    );
    const paymentMethod = paymentMethodRows[0];
    if (!paymentMethod || !paymentMethod.is_active) {
        return {
            isValid: false,
            reason: "payment_method_inactive",
        };
    }
    return {
        isValid: true,
        reason: null,
    };
};

// Process one recurring transaction
const processOneRecurring = async (recurringId,currentDate) => {
    const client = await pool.connect();
    let transactionStarted = false;
    try {
        await client.query("BEGIN");
        transactionStarted = true;
        const recurring =
            await recurringRepository.findDueRecurringForUpdate(
                client,
                recurringId,
                currentDate
            );
        if (!recurring) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return {
                status: "skipped",
                recurringId,
                createdOccurrences: 0,
                duplicateOccurrences: 0,
                skippedOccurrences: 0,
            };
        }
        const referenceValidation =
            await validateRecurringReferences(
                client,
                recurring
            );
        let nextDueDate = recurring.next_due_date;
        let createdOccurrences = 0;
        let duplicateOccurrences = 0;
        let skippedOccurrences = 0;
        let occurrenceCount = 0;
        // Catch up missed occurrences
        while (
            nextDueDate <= currentDate &&
            occurrenceCount < MAX_OCCURRENCES
        ) {
            if (
                recurring.end_date &&
                nextDueDate > recurring.end_date
            ) {
                break;
            }

            if (!referenceValidation.isValid) {
                skippedOccurrences++;
            } else {
                const occurrence =
                    await recurringRepository.createRecurringOccurrence(
                        client,
                        {
                            ...recurring,
                            next_due_date: nextDueDate,
                        }
                    );

                if (occurrence) {
                    createdOccurrences++;
                } else {
                    duplicateOccurrences++;
                }
            }
            occurrenceCount++;
            nextDueDate = getNextDueDate(
                recurring.start_date,
                nextDueDate,
                recurring.frequency
            );
        }
        let isCompleted = false;
        if (
            recurring.end_date &&
            nextDueDate > recurring.end_date
        ) {
            const deactivated =
                await recurringRepository.deactivateRecurring(
                    client,
                    recurring.recurring_id
                );

            if (!deactivated) {
                throw new Error(
                    "Failed to deactivate completed recurring transaction."
                );
            }
            isCompleted = true;
        } else {
            const updated =
                await recurringRepository.updateNextDueDate(
                    client,
                    recurring.recurring_id,
                    nextDueDate
                );
            if (!updated) {
                throw new Error(
                    "Failed to update the next recurring due date."
                );
            }
        }
        await client.query("COMMIT");
        transactionStarted = false;
        return {
            status: "processed",
            recurringId,
            createdOccurrences,
            duplicateOccurrences,
            skippedOccurrences,
            skipReason: referenceValidation.reason,
            nextDueDate,
            isCompleted,
            reachedBatchLimit:
                occurrenceCount === MAX_OCCURRENCES &&
                nextDueDate <= currentDate,
        };
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                error.rollbackError = rollbackError;
            }
        }
        throw error;
    } finally {
        client.release();
    }
};

// Process all due recurring transactions
const processDueRecurring = async (currentDate,limit = 50,recurringId = null) => {
    validateCurrentDate(currentDate);
    if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 1000
    ) {
        throw new Error("Limit must be an integer between 1 and 1000.");
    }
    const dueRecurring =
        await recurringRepository.findDueRecurring(
            pool,
            currentDate,
            limit,
            recurringId
        );
    const summary = {
        currentDate,
        totalFound: dueRecurring.length,
        processedRecurring: 0,
        skippedRecurring: 0,
        failedRecurring: 0,
        createdOccurrences: 0,
        duplicateOccurrences: 0,
        skippedOccurrences: 0,
        completedRecurring: 0,
        results: [],
    };
    for (const recurring of dueRecurring) {
        try {
            const result = await processOneRecurring(
                recurring.recurring_id,
                currentDate
            );
            if (result.status === "processed") {
                summary.processedRecurring++;

                if (result.isCompleted) {
                    summary.completedRecurring++;
                }
            } else {
                summary.skippedRecurring++;
            }
            summary.createdOccurrences +=
                result.createdOccurrences;

            summary.duplicateOccurrences +=
                result.duplicateOccurrences;

            summary.skippedOccurrences +=
                result.skippedOccurrences;

            summary.results.push(result);
        } catch (error) {
            summary.failedRecurring++;

            summary.results.push({
                status: "failed",
                recurringId: recurring.recurring_id,
                message: error.message,
            });
        }
    }
    return summary;
};

module.exports = {
    getAllRecurring,
    getRecurringById,
    createRecurring,
    updateRecurring,
    toggleRecurring,
    processDueRecurring,
};
