const CmsContent = require("../../models/cms.model");

const slugify = (value) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

exports.createCMSSection = async (req, res,next) =>  {
  try {
    let cmsData = req.body;
    const slugSource = cmsData.slug || cmsData.section;
    cmsData = { ...cmsData, slug: slugify(slugSource) };
    if (cmsData.sort_order === undefined || cmsData.sort_order === null) {
      const maxOrder = await CmsContent.max("sort_order");
      cmsData.sort_order = Number.isFinite(maxOrder) ? maxOrder + 1 : 1;
    }
    
    // Check if section already exists
    const existing = await CmsContent.findOne({ where: { section: cmsData.section } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `CMS section "${cmsData.section}" already exists. Use PUT to update it.`
      });
    }
    
    const section = await CmsContent.create(cmsData);
    res.status(201).json({
      success: true,
      data: section,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

exports.getCMSBySection = async (req, res,next) => {
  try {
    const section = req.params.section;
    const cmsContent = await CmsContent.findOne({ where: { section } });
    if (!cmsContent) {
      return res.status(404).json({ 
        success: false,
        message: "CMS section not found" 
      });
    }
    res.status(200).json({
      success: true,
      data: cmsContent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } 
}

exports.getAllCMSSections = async (req, res, next) => {
  try {
    const cmsSections = await CmsContent.findAll({
      order: [
        ["sort_order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });
    res.status(200).json({
      success: true,
      data: cmsSections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

exports.updateCMSSection = async (req, res,next) => {
  try {
    const section = req.params.section;
    const updateData = req.body;
    if (updateData.slug || updateData.section) {
      const slugSource = updateData.slug || updateData.section;
      updateData.slug = slugify(slugSource);
    }
    const [updated] = await CmsContent.update(updateData, {
      where: { section },
    });
    if (updated) {
      const updatedCMS = await CmsContent.findOne({ where: { section } });
      res.status(200).json({
        success: true,
        data: updatedCMS,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "CMS section not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

exports.deleteCMSSection = async (req, res,next) => {
  try {
    const section = req.params.section;
    const deleted = await CmsContent.destroy({ where: { section } });
    if (deleted) {
      res.status(200).json({  
        success: true,
        message: "CMS section deleted successfully" 
      });
    } else {
      res.status(404).json({
        success: false,
        message: "CMS section not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

exports.reorderCMSSections = async (req, res) => {
  try {
    const { orderUpdates } = req.body;
    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({
        success: false,
        message: "orderUpdates must be an array",
      });
    }

    await Promise.all(
      orderUpdates.map(({ id, sort_order }) =>
        CmsContent.update(
          { sort_order },
          { where: { id } }
        )
      )
    );

    const cmsSections = await CmsContent.findAll({
      order: [
        ["sort_order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: cmsSections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllCMSByCategoryId = async(req,res)=>{
  try {
    const categoryId = req.params.categoryId;
    const cmsSections = await CmsContent.findAll({
      where: {categoryId},
      attributes: ['section', 'slug', 'sort_order', 'content'],
      order: [['sort_order', 'ASC']]
    });
    res.status(200).json({
      success: true,
      data: cmsSections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// getCmsByTags removed: cms_contents no longer stores tags
