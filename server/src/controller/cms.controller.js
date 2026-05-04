const CmsContent = require("../../models/cms.model");
const PageSection = require("../../models/pageSection.model");
const { postgres } = require("../../config/db/postgres/connectPostgres");
const { Op } = require("sequelize");
const {
  VALID_SECTION_TYPES,
  getDefaultSectionData,
  normalizeSectionData,
  buildLegacySectionsFromContent,
} = require("../lib/cmsSections");

const slugify = (value) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const serializeSection = (section) => {
  const data = section?.toJSON ? section.toJSON() : section;
  if (!VALID_SECTION_TYPES.includes(data.type)) {
    return null;
  }
  return {
    id: data.id,
    page_id: data.page_id,
    type: data.type,
    sort_order: data.sort_order,
    is_enabled: !!data.is_enabled,
    data: data.data || {},
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const mapSectionsByPageId = (sections = []) => {
  const grouped = new Map();
  sections.forEach((section) => {
    const serialized = serializeSection(section);
    if (!serialized) return;
    const pageId = serialized.page_id;
    if (!grouped.has(pageId)) grouped.set(pageId, []);
    grouped.get(pageId).push(serialized);
  });
  return grouped;
};

const attachSectionsToPages = (pages = [], sections = []) => {
  const grouped = mapSectionsByPageId(sections);
  return pages.map((page) => {
    const plain = page.toJSON ? page.toJSON() : page;
    return {
      ...plain,
      sections: grouped.get(plain.id) || [],
    };
  });
};

const getPageByIdOrThrow = async (pageId) => {
  const page = await CmsContent.findByPk(pageId);
  if (!page) {
    const error = new Error("CMS page not found");
    error.status = 404;
    throw error;
  }
  return page;
};

const ensureLegacySectionsMigrated = async (page) => {
  const existing = await PageSection.findAll({
    where: { page_id: page.id },
    order: [["sort_order", "ASC"], ["createdAt", "ASC"]],
  });

  if (existing.length > 0) {
    return existing;
  }

  const legacySections = buildLegacySectionsFromContent(page.content || {});
  if (legacySections.length === 0) return [];

  await PageSection.bulkCreate(
    legacySections.map((entry, index) => ({
      page_id: page.id,
      type: entry.type,
      sort_order: index + 1,
      is_enabled: entry.is_enabled,
      data: entry.data,
    }))
  );

  return PageSection.findAll({
    where: { page_id: page.id },
    order: [["sort_order", "ASC"], ["createdAt", "ASC"]],
  });
};

exports.createCMSSection = async (req, res) => {
  try {
    let cmsData = req.body;
    const slugSource = cmsData.slug || cmsData.section;
    cmsData = { ...cmsData, slug: slugify(slugSource) };
    if (cmsData.sort_order === undefined || cmsData.sort_order === null) {
      const maxOrder = await CmsContent.max("sort_order");
      cmsData.sort_order = Number.isFinite(maxOrder) ? maxOrder + 1 : 1;
    }

    const existing = await CmsContent.findOne({ where: { section: cmsData.section } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `CMS section "${cmsData.section}" already exists. Use PUT to update it.`,
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
};

exports.getCMSBySection = async (req, res) => {
  try {
    const section = req.params.section;
    const cmsContent = await CmsContent.findOne({ where: { section } });
    if (!cmsContent) {
      return res.status(404).json({
        success: false,
        message: "CMS section not found",
      });
    }

    const sections = await PageSection.findAll({
      where: { page_id: cmsContent.id },
      order: [["sort_order", "ASC"], ["createdAt", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        ...(cmsContent.toJSON ? cmsContent.toJSON() : cmsContent),
        sections: sections.map(serializeSection).filter(Boolean),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllCMSSections = async (req, res) => {
  try {
    const cmsSections = await CmsContent.findAll({
      order: [
        ["sort_order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    const pageIds = cmsSections.map((page) => page.id);
    const sectionRows = pageIds.length
      ? await PageSection.findAll({
          where: { page_id: { [Op.in]: pageIds } },
          order: [["sort_order", "ASC"], ["createdAt", "ASC"]],
        })
      : [];

    res.status(200).json({
      success: true,
      data: attachSectionsToPages(cmsSections, sectionRows),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateCMSSection = async (req, res) => {
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

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "CMS section not found",
      });
    }

    const updatedCMS = await CmsContent.findOne({ where: { section } });
    res.status(200).json({
      success: true,
      data: updatedCMS,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteCMSSection = async (req, res) => {
  try {
    const section = req.params.section;
    const deleted = await CmsContent.destroy({ where: { section } });
    if (deleted) {
      res.status(200).json({
        success: true,
        message: "CMS section deleted successfully",
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
};

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
        CmsContent.update({ sort_order }, { where: { id } })
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

exports.getAllCMSByCategoryId = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const cmsSections = await CmsContent.findAll({
      where: { categoryId },
      attributes: [
        "id",
        "section",
        "slug",
        "sort_order",
        "content",
        "status",
        "meta_title",
        "meta_description",
        "meta_keywords",
      ],
      order: [["sort_order", "ASC"]],
    });

    const pageIds = cmsSections.map((page) => page.id);
    const sectionRows = pageIds.length
      ? await PageSection.findAll({
          where: { page_id: { [Op.in]: pageIds } },
          order: [["sort_order", "ASC"], ["createdAt", "ASC"]],
        })
      : [];

    res.status(200).json({
      success: true,
      data: attachSectionsToPages(cmsSections, sectionRows),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCMSPageSections = async (req, res) => {
  try {
    const { pageId } = req.params;
    const page = await getPageByIdOrThrow(pageId);
    const sections = await ensureLegacySectionsMigrated(page);

    res.status(200).json({
      success: true,
      data: sections.map(serializeSection).filter(Boolean),
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.migrateLegacyCMSPageSections = async (req, res) => {
  try {
    const { pageId } = req.params;
    const page = await getPageByIdOrThrow(pageId);
    const sections = await ensureLegacySectionsMigrated(page);

    res.status(200).json({
      success: true,
      data: sections.map(serializeSection).filter(Boolean),
      message: "Legacy blocks migrated to page sections.",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addCMSPageSection = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { type } = req.body || {};

    if (!VALID_SECTION_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section type. Allowed: ${VALID_SECTION_TYPES.join(", ")}`,
      });
    }

    await getPageByIdOrThrow(pageId);

    const maxSortOrder = await PageSection.max("sort_order", {
      where: { page_id: pageId },
    });

    const created = await PageSection.create({
      page_id: pageId,
      type,
      sort_order: Number.isFinite(maxSortOrder) ? maxSortOrder + 1 : 1,
      is_enabled: true,
      data: getDefaultSectionData(type),
    });

    res.status(201).json({
      success: true,
      data: serializeSection(created),
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateCMSPageSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const section = await PageSection.findByPk(sectionId);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const normalizedData = normalizeSectionData(section.type, req.body?.data || {});

    await section.update({ data: normalizedData });

    res.status(200).json({
      success: true,
      data: serializeSection(section),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.toggleCMSPageSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { is_enabled } = req.body || {};

    if (typeof is_enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_enabled must be a boolean",
      });
    }

    const section = await PageSection.findByPk(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    await section.update({ is_enabled });

    res.status(200).json({
      success: true,
      data: serializeSection(section),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.duplicateCMSPageSection = async (req, res) => {
  const transaction = await postgres.transaction();
  try {
    const { sectionId } = req.params;

    const section = await PageSection.findByPk(sectionId, { transaction });
    if (!section) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    await PageSection.increment(
      { sort_order: 1 },
      {
        where: {
          page_id: section.page_id,
          sort_order: { [Op.gt]: section.sort_order },
        },
        transaction,
      }
    );

    const duplicated = await PageSection.create(
      {
        page_id: section.page_id,
        type: section.type,
        sort_order: section.sort_order + 1,
        is_enabled: section.is_enabled,
        data: JSON.parse(JSON.stringify(section.data || {})),
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: serializeSection(duplicated),
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteCMSPageSection = async (req, res) => {
  const transaction = await postgres.transaction();
  try {
    const { sectionId } = req.params;

    const section = await PageSection.findByPk(sectionId, { transaction });
    if (!section) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const pageId = section.page_id;
    const currentSort = section.sort_order;

    await section.destroy({ transaction });

    await PageSection.increment(
      { sort_order: -1 },
      {
        where: {
          page_id: pageId,
          sort_order: { [Op.gt]: currentSort },
        },
        transaction,
      }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.reorderCMSPageSections = async (req, res) => {
  const transaction = await postgres.transaction();
  try {
    const { pageId } = req.params;
    const { orderedSectionIds } = req.body || {};

    await getPageByIdOrThrow(pageId);

    if (!Array.isArray(orderedSectionIds) || orderedSectionIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "orderedSectionIds must be a non-empty array",
      });
    }

    const sections = await PageSection.findAll({
      where: { page_id: pageId },
      transaction,
    });

    if (sections.length !== orderedSectionIds.length) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "orderedSectionIds length mismatch",
      });
    }

    const validIds = new Set(sections.map((section) => section.id));
    const isInvalid = orderedSectionIds.some((id) => !validIds.has(id));
    if (isInvalid) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "orderedSectionIds contains invalid section ids",
      });
    }

    await Promise.all(
      orderedSectionIds.map((sectionId, index) =>
        PageSection.update(
          { sort_order: index + 1 },
          {
            where: { id: sectionId, page_id: pageId },
            transaction,
          }
        )
      )
    );

    await transaction.commit();

    const updated = await PageSection.findAll({
      where: { page_id: pageId },
      order: [["sort_order", "ASC"], ["createdAt", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: updated.map(serializeSection),
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
