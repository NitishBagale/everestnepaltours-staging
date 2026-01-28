const { Op } = require("sequelize");
const SEO = require("../../models/seo");

async function createSeoMetaDataServices(seoData) {
  try {
    const seo = await SEO.create(seoData);
    return seo;
  } catch (error) {
    throw new Error("Error creating SEO metadata: " + error.message);
  }
}

async function getSeoMetaDataByIdService(id) {
  try {
    const seo = await SEO.findByPk(id);
    return seo;
  } catch (error) {
    throw new Error("Error retrieving SEO metadata: " + error.message);
  }
}

async function updateSeoMetaDataService(id, updatedData) {
  try {
    const seo = await SEO.findByPk(id);
    if (!seo) {
      throw new Error("SEO metadata not found");
    }
    await seo.update(updatedData);
    return seo;
  } catch (error) {
    throw new Error("Error updating SEO metadata: " + error.message);
  }
}

async function getAllSeoMetaDataServices() {
  try {
    const seos = await SEO.findAll();
    return seos;
  } catch (error) {
    throw new Error("Error retrieving all SEO metadata: " + error.message);
  }
}

async function deleteSeoMetaDataService(id) {
  try {
    const seo = await SEO.findByPk(id);
    if (!seo) {
      throw new Error("SEO metadata not found");
    }
    await seo.destroy();
    return;
  } catch (error) {
    throw new Error("Error deleting SEO metadata: " + error.message);
  }
}

async function getSeoMetaDataByTagService(tag) {
  try {
    const seo = await SEO.findOne({ where: { tags:{
        [Op.contains]: [tag]
    } } });
    return seo;
  } catch (error) {
    throw new Error("Error retrieving SEO metadata by tag: " + error.message);
  }
}

async function getSeoMetaDataByPageService(page) {  
  try {
    const seo = await SEO.findOne({ where: { page:page } });

    return seo;
  } catch (error) {
    throw new Error("Error retrieving SEO metadata by page: " + error.message);
  }
}

module.exports = {
  createSeoMetaDataServices,
  getSeoMetaDataByIdService,
  updateSeoMetaDataService,
  getAllSeoMetaDataServices,
  deleteSeoMetaDataService,
  getSeoMetaDataByTagService,
  getSeoMetaDataByPageService,
};
