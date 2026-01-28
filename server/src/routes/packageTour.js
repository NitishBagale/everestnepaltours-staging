const { Router } = require("express");
const {
  createPackageTour,
  uploadPackageTourImages,
  getAllPackageTours,
  getPackageTourById,
  updatePackageTour,
  deletePackageTourById,
  getPackageTourByName,
  addReview,
  getAllPackageTourByCategoryId,
  getAllPackageTourByTags,
  askExpert,
} = require("../controller/packageTour");
const { upload } = require("../utils/cloudinary");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");
const validatePckageTour = require("../validator/packageTour.validate");

const packageTourRouter = Router();

packageTourRouter.post(
  "/upload-images",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  upload.array("images"),
  uploadPackageTourImages
);

packageTourRouter.post(
  "/",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  validatePckageTour,
  createPackageTour
);

packageTourRouter.get("/", getAllPackageTours);
packageTourRouter.get("/search", getPackageTourByName);
packageTourRouter.get("/category/:categoryId", getAllPackageTourByCategoryId);
packageTourRouter.get("/:id", getPackageTourById);
packageTourRouter.post("/:id/review", addReview);
packageTourRouter.post("/:id/ask-expert", askExpert);
packageTourRouter.put(
  "/:id",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  updatePackageTour
);
packageTourRouter.delete(
  "/:id",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  deletePackageTourById
);

packageTourRouter.get("/tags/:tag", getAllPackageTourByTags);

module.exports = packageTourRouter;
