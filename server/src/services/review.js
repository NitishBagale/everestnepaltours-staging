
const Review = require("../../models/review");
const { postgres } = require("../../config/db/postgres/connectPostgres");
const { Op } = require("sequelize");

// Add Review
const addReviewService = async (data) => {
  const review = await Review.create(data);

  // Update average rating
  const avgResult = await Review.findOne({
    attributes: [[postgres.fn("AVG", postgres.col("rating")), "averageRating"]],
  });
  const avgRating = parseFloat(avgResult.dataValues.averageRating).toFixed(1);

  return { review, averageRating: avgRating };
};

// Get Reviews with Filters + Pagination
const getReviewsService = async (query) => {
  const { rating, page = 1, limit = 10 } = query;

  const where = {};
  if (rating) where.rating = rating;

  const reviews = await Review.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: (page - 1) * limit,
    order: [["sort_order", "ASC"], ["createdAt", "DESC"]],
  });

  return {
    total: reviews.count,
    page: parseInt(page),
    pages: Math.ceil(reviews.count / limit),
    data: reviews.rows,
  };
};


// Get Average Rating
const getAverageRatingService = async () => {
  const result = await Review.findOne({
    attributes: [[postgres.fn("AVG", postgres.col("rating")), "averageRating"]],
  });

  return { averageRating: parseFloat(result.dataValues.averageRating || 0).toFixed(1) };
};

//gerReviewByPackageTourIdService

const getReviewByPackageTourIdService = async (packageTourId) => {
  try {
    return await Review.findAll({ where: { packageTourId } });
  } catch (error) {
    throw new Error("Error fetching reviews by packageTourId");
  }
};

// Update Review (Admin)
const updateReviewService = async (id, data) => {
  await Review.update(data, { where: { id } });

  // Recalculate average rating
  const avgResult = await Review.findOne({
    attributes: [[postgres.fn("AVG", postgres.col("rating")), "averageRating"]],
  });
  const avgRating = parseFloat(avgResult.dataValues.averageRating || 0).toFixed(1);

  return { message: "Review updated successfully", averageRating: avgRating };
};

// Delete Review
const deleteReviewService = async (id) => {
  await Review.destroy({ where: { id } });

  // Recalculate average rating
  const avgResult = await Review.findOne({
    attributes: [[postgres.fn("AVG", postgres.col("rating")), "averageRating"]],
  });
  const avgRating = parseFloat(avgResult.dataValues.averageRating || 0).toFixed(1);

  return { message: "Review deleted successfully", averageRating: avgRating };
};

// Reorder Reviews
const reorderReviewsService = async (orderUpdates) => {
  await Promise.all(
    orderUpdates.map(({ id, sort_order }) =>
      Review.update({ sort_order }, { where: { id } })
    )
  );

  return Review.findAll({ order: [["sort_order", "ASC"], ["createdAt", "DESC"]] });
};

module.exports = {
  addReviewService,
  getReviewsService,
  getReviewByPackageTourIdService,
  getAverageRatingService,
  updateReviewService,
  deleteReviewService,
  reorderReviewsService,
};
