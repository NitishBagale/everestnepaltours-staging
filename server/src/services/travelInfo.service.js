const { Op, fn, Sequelize } = require("sequelize");
const TravelInfo = require("../../models/travelInfo.model");

const createTravelInfo = async (data) => {
  const payload = { ...data };
  if (payload.sort_order === undefined || payload.sort_order === null) {
    const maxOrder = await TravelInfo.max("sort_order");
    payload.sort_order = Number.isFinite(maxOrder) ? maxOrder + 1 : 1;
  }
  return await TravelInfo.create(payload);
};

const getAllTravelInfo = async ({ publishedOnly = false } = {}) => {
  const where = publishedOnly ? { status: true } : undefined;
  return await TravelInfo.findAll({
    where,
    order: [
      [Sequelize.literal('"sort_order" IS NULL'), "ASC"],
      ["sort_order", "ASC"],
      ["createdAt", "DESC"],
    ],
  });
};

const getTravelInfoBySlug = async (slug, { publishedOnly = false } = {}) => {
  const where = publishedOnly ? { slug, status: true } : { slug };
  return await TravelInfo.findOne({ where });
};

const updateTravelInfoById = async (id, data) => {
  const item = await TravelInfo.findByPk(id);
  if (!item) return null;
  await item.update(data);
  return item;
};

const deleteTravelInfoById = async (id) => {
  const item = await TravelInfo.findByPk(id);
  if (!item) return null;
  await item.destroy();
  return item;
};

const getTravelInfoBySlugWithRelated = async (slug) => {
  const item = await TravelInfo.findOne({ where: { slug, status: true } });
  if (!item) return null;

  const relatedItems = await TravelInfo.findAll({
    where: {
      id: { [Op.ne]: item.id },
      status: true,
    },
    order: fn("RANDOM"),
    limit: 4,
  });

  if (relatedItems.length < 4) {
    const additional = await TravelInfo.findAll({
      where: {
        id: {
          [Op.notIn]: [item.id, ...relatedItems.map((rel) => rel.id)],
        },
        status: true,
      },
      order: [["createdAt", "DESC"]],
      limit: 4 - relatedItems.length,
    });

    return { item, relatedItems: [...relatedItems, ...additional] };
  }

  return { item, relatedItems };
};

const reorderTravelInfo = async (orderUpdates) => {
  if (!Array.isArray(orderUpdates)) return [];
  await Promise.all(
    orderUpdates.map(({ id, sort_order }) =>
      TravelInfo.update(
        { sort_order },
        { where: { id } }
      )
    )
  );
  return await getAllTravelInfo();
};

module.exports = {
  createTravelInfo,
  getAllTravelInfo,
  getTravelInfoBySlug,
  updateTravelInfoById,
  deleteTravelInfoById,
  getTravelInfoBySlugWithRelated,
  reorderTravelInfo,
};
