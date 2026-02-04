const Category = require("../../models/category");
const { generateUniqueSlug } = require("../utils/slugGenerator");

 async function createCategoryServices(categoryData) {
    try {
        // Check if category with same name already exists
        const existing = await Category.findOne({ where: { name: categoryData.name } });
        if (existing) {
            throw new Error("Category name already exists");
        }
        const slugSource = categoryData.slug || categoryData.name;
        const slug = await generateUniqueSlug(slugSource, Category);
        return await Category.create({ ...categoryData, slug });
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
        if (updateData.slug || updateData.name) {
            const slugSource = updateData.slug || updateData.name;
            updateData.slug = await generateUniqueSlug(slugSource, Category, id);
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
