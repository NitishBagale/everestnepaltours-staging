const express = require("express");

const { upload } = require("../utils/cloudinary");
const {
  handleSingleFileController,
  handleMultipleFileController,
} = require("../controller/file.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");

const fileRouter = express.Router();

fileRouter
  .route("/single")
  .post(
    isAuthenticated,
    isAuthorized(["admin", "editor"]),
    upload.single("document"),
    handleSingleFileController
  );

fileRouter
  .route("/multiple")
  .post(
    isAuthenticated,
    isAuthorized(["admin", "editor"]),
    upload.array("document"),
    handleMultipleFileController
  );

module.exports = fileRouter;
