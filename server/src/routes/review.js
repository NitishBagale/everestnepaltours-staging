const { Router } = require("express");

const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");
const {
  addReview,
  getReviews,
  getReviewByPackageTourId,
  getAverageRating,
  updateReview,
  deleteReview,
  reorderReviews,
} = require("../controller/review");

const reviewRouter = Router();

reviewRouter.post("/", addReview);
reviewRouter.get("/", getReviews);
reviewRouter.get("/package-tour/:packageTourId", getReviewByPackageTourId);
reviewRouter.get("/average-rating", getAverageRating);
reviewRouter.post(
  "/reorder",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  reorderReviews
);
reviewRouter.put(
  "/:id",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  updateReview
);
reviewRouter.delete(
  "/:id",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  deleteReview
);

module.exports = reviewRouter;
