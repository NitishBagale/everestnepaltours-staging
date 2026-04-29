
const { getReviewByPackageTourIdService } = require("../services/review");
const {
  addReviewService,
  getReviewsService,
  getReviewByIdService,
  getAverageRatingService,
  updateReviewService,
  deleteReviewService,
  reorderReviewsService,
} = require("../services/review");

console.log("Review controller loaded");

// Add Review
const addReview = async (req, res) => {
  try {
    const result = await addReviewService(req.body);
    res.json({ message: "Review added successfully", data: result.review, averageRating: result.averageRating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Reviews + Filters + Pagination
const getReviews = async (req, res) => {
  try {
    const result = await getReviewsService(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getReviewByIdService(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// getReviewByPackageTourId
const getReviewByPackageTourId = async (req, res) => {
  try {
    const { packageTourId } = req.params;
    const result = await getReviewByPackageTourIdService(packageTourId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Average Rating
const getAverageRating = async (req, res) => {
  try {
    const result = await getAverageRatingService();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Review (Admin)
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateReviewService(id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteReviewService(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reorder Reviews
const reorderReviews = async (req, res) => {
  try {
    const { orderUpdates } = req.body;
    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({ error: "orderUpdates must be an array" });
    }
    const reviews = await reorderReviewsService(orderUpdates);
    res.json({ message: "Review order updated successfully", data: reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addReview,
  getReviews,
  getReviewById,
  getReviewByPackageTourId,
  getAverageRating,
  updateReview,
  deleteReview,
  reorderReviews,
};
