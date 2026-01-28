const { createCategoryServices, getAllCategoriesServices, getCategoryByIdService, deleteCategoryService, updateCategoryService } = require("../services/category");


exports.createCategory =  async (req,res,next) =>{
    try {
        const categoryData = req.body;
        if (!categoryData.name || categoryData.name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }
        const result = await createCategoryServices(categoryData);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.getAllCategories = async (req,res,next) =>{
    try {
        const categories = await getAllCategoriesServices();
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.getCategoryById = async (req,res,next) =>{
    try {
        const id = req.params.id;
        const category = await getCategoryByIdService(id);
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.updateCategory = async (req,res,next) =>{
    try {
        const id = req.params.id;   
        const updateData = req.body;
        const updatedCategory = await updateCategoryService(id, updateData);
        res.status(200).json({
            success: true,
            data: updatedCategory
        });
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.deleteCategory = async (req,res,next) =>{
    try {
        const id = req.params.id;
        const deletedCategory = await deleteCategoryService(id);
        res.status(200).json({
            success: true,
            data: deletedCategory
        });
    } catch (error) {
        throw new Error(error.message);
    }
}