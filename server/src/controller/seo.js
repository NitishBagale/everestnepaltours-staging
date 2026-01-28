const {
  createSeoMetaDataServices,
  getSeoMetaDataByIdService,
  updateSeoMetaDataService,
  getAllSeoMetaDataServices,
  deleteSeoMetaDataService,
  getSeoMetaDataByTagService,
  getSeoMetaDataByPageService,
} = require("../services/seo");

exports.createSeoMetaData = async (req, res) => {
  try {
    const seoData = req.body;
    const seo = await createSeoMetaDataServices(seoData);
    res.status(201).json({
      message: "SEO metadata created successfully",
      data: seo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating SEO metadata",
      error: error.message,
    });
  }
};

exports.getSeoMetaDataById = async (req, res) => {
  try {
    const id = req.params.id;
    const seo = await getSeoMetaDataByIdService(id);
    res.status(200).json({
      message: "SEO metadata retrieved successfully",
      data: seo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving SEO metadata",
      error: error.message,
    });
  }
};

exports.updateSeoMetaData = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const seo = await updateSeoMetaDataService(id, updatedData);
    res.status(200).json({
      message: "SEO metadata updated successfully",
      data: seo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating SEO metadata",
      error: error.message,
    });
  }
};

exports.getAllSeoMetaData = async (req, res) => {
  try {
    const seos = await getAllSeoMetaDataServices();
    res.status(200).json({
      message: "All SEO metadata retrieved successfully",
      data: seos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving all SEO metadata",
      error: error.message,
    });
  }
};

exports.deleteSeoMetaData = async (req, res) => {
  try {
    const id = req.params.id;
    await deleteSeoMetaDataService(id);
    res.status(200).json({
      message: "SEO metadata deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting SEO metadata",
      error: error.message,
    });
  }
};

exports.getSeoMetaDataByTag = async (req, res) => {
  try {
    const tag = req.params.tag;
    const seo = await getSeoMetaDataByTagService(tag);
    res.status(200).json({
      message: "SEO metadata retrieved successfully by tag",
      data: seo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving SEO metadata by tag",
      error: error.message,
    });
  }
};

exports.getSeoMetaDataByPage = async (req, res) => {
  try {
    const page = req.params.page;
    const seo = await getSeoMetaDataByPageService(page);
    res.status(200).json({
      message: "SEO metadata retrieved successfully by page",
      data: seo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving SEO metadata by page",
      error: error.message,
    });
  }
};
