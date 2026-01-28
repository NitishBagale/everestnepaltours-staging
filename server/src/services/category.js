const Category = require("../../models/category");

 async function createCategoryServices(categoryData) {
    try {
        // Check if category with same name already exists
        const existing = await Category.findOne({ where: { name: categoryData.name } });
        if (existing) {
            throw new Error("Category name already exists");
        }
        return await Category.create({ ...categoryData });
    } catch (error) {
        throw new Error(error.message);
    }
 }

 async function getAllCategoriesServices(){
    try {
        return await Category.findAll({});
    } catch (error) {
        throw new Error(error.message);
    }
 }

 async function getCategoryByIdService(id){
    try {
        return await Category.findByPk(id);
    } catch (error) {
        throw new Error(error.message);
    }
 }

  async function updateCategoryService(id, updateData){
    try {
        const category = await Category.findByPk(id);
        if (!category) {
            throw new Error("Category not found");
        }
        return await category.update(updateData);
    } catch (error) {
        throw new Error(error.message);
    }
}

async function deleteCategoryService(id){
    try {
        const result = await Category.destroy({ where: { id } });
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    createCategoryServices,
    getAllCategoriesServices,   
    getCategoryByIdService,
    updateCategoryService,
    deleteCategoryService
}