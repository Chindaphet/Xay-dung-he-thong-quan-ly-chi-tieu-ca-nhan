
const categoryService = require("../services/category.service");

// Create a new category
const createCategory = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const category = await categoryService.createCategory(userId,req.body);
        return res.status(201).json({
            success: true,
            message: "Category created successfully.",
            data: category,
        });
    } catch (error) {next(error);}
};

// Get all categories belonging to the authenticated user
const getAllCategories = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const includeInactive =req.query.includeInactive === "true";
        const categories = await categoryService.getAllCategories(userId,includeInactive);
        return res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error) {next(error);}
};

// Get one category by ID
const getCategoryById = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { categoryId } = req.params;
        const category = await categoryService.getCategoryById(categoryId,userId);
        return res.status(200).json({success: true,data: category, 
        });
    } catch (error) {next(error);}
};

// Update an existing category
const updateCategory = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { categoryId } = req.params;
        const category = await categoryService.updateCategory(
            categoryId,
            userId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Category updated successfully.",
            data: category,
        });
    } catch (error) {
        next(error);
    }
};


// Activate or deactivate a category
const toggleCategory = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { categoryId } = req.params;
        const { isActive } = req.body;

        const category = await categoryService.toggleCategory(
            categoryId,
            userId,
            isActive
        );

        return res.status(200).json({
            success: true,
            message: "Category status updated successfully.",
            data: category,
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    toggleCategory,
};
