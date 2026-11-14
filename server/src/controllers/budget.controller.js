
const budgetService = require("../services/budget.service");


// Get monthly budget overview
const getBudgetOverview = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { month } = req.query;

        const budget = await budgetService.getBudgetOverview(
            userId,
            month
        );

        return res.status(200).json({
            success: true,
            data: budget,
        });
    } catch (error) {
        next(error);
    }
};


// Create a monthly budget
const createBudget = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const budget = await budgetService.createBudget(
            userId,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Budget created successfully.",
            data: budget,
        });
    } catch (error) {
        next(error);
    }
};


// Update the overall monthly budget
const updateBudget = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { budgetId } = req.params;

        const budget = await budgetService.updateBudget(
            budgetId,
            userId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Budget updated successfully.",
            data: budget,
        });
    } catch (error) {
        next(error);
    }
};


// Add a category budget
const createCategoryBudget = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { budgetId } = req.params;

        const categoryBudget =
            await budgetService.createCategoryBudget(
                budgetId,
                userId,
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Category budget created successfully.",
            data: categoryBudget,
        });
    } catch (error) {
        next(error);
    }
};


// Update a category budget
const updateCategoryBudget = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { budgetId, categoryId } = req.params;

        const categoryBudget =
            await budgetService.updateCategoryBudget(
                budgetId,
                categoryId,
                userId,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Category budget updated successfully.",
            data: categoryBudget,
        });
    } catch (error) {
        next(error);
    }
};


// Delete a category budget
const deleteCategoryBudget = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { budgetId, categoryId } = req.params;

        await budgetService.deleteCategoryBudget(
            budgetId,
            categoryId,
            userId
        );

        return res.status(200).json({
            success: true,
            message: "Category budget deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBudgetOverview,
    createBudget,
    updateBudget,
    createCategoryBudget,
    updateCategoryBudget,
    deleteCategoryBudget,
};
