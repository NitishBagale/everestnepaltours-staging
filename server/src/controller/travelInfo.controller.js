const {
  createTravelInfo,
  getAllTravelInfo,
  getTravelInfoBySlug,
  updateTravelInfoById,
  deleteTravelInfoById,
  getTravelInfoBySlugWithRelated,
  reorderTravelInfo,
} = require("../services/travelInfo.service");

const slugify = (value) =>
  value
    ? value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/--+/g, "-")
    : "";

exports.createTravelInfo = async (req, res) => {
  try {
    const data = req.body || {};
    if (!data.title) {
      return res.status(400).json({
        success: false,
        message: "title is required",
      });
    }

    const payload = {
      title: data.title.trim(),
      slug: data.slug ? slugify(data.slug) : slugify(data.title),
      description: data.description || "",
      status: data.status !== undefined ? data.status : true,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      meta_keywords: data.meta_keywords || null,
    };

    const item = await createTravelInfo(payload);
    res.status(201).json({
      success: true,
      message: "Travel info created successfully",
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTravelInfoList = async (req, res) => {
  try {
    const publishedOnly = req.query.published === "true";
    const items = await getAllTravelInfo({ publishedOnly });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTravelInfoBySlug = async (req, res) => {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({
      success: false,
      message: "slug is required",
    });
  }
  try {
    const publishedOnly = req.query.published === "true";
    const item = await getTravelInfoBySlug(slug, { publishedOnly });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Travel info not found",
      });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTravelInfoById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = req.body || {};
    const payload = {
      title: data.title?.trim() || data.title,
      slug: data.slug ? slugify(data.slug) : undefined,
      description: data.description,
      status: data.status,
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      meta_keywords: data.meta_keywords,
    };

    const updated = await updateTravelInfoById(id, payload);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Travel info not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Travel info updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTravelInfoById = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteTravelInfoById(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Travel info not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Travel info deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTravelInfoWithRelated = async (req, res) => {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({
      success: false,
      message: "slug is required",
    });
  }
  try {
    const data = await getTravelInfoBySlugWithRelated(slug);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Travel info not found",
      });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reorderTravelInfo = async (req, res) => {
  const { orderUpdates } = req.body || {};
  if (!Array.isArray(orderUpdates)) {
    return res.status(400).json({
      success: false,
      message: "orderUpdates must be an array",
    });
  }
  try {
    const updatedList = await reorderTravelInfo(orderUpdates);
    res.status(200).json({
      success: true,
      message: "Travel info order updated successfully",
      data: updatedList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
