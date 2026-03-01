const express = require("express");
const cmsrouter = express.Router();
const cmsController = require("../controller/cms.controller");

const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");
const validateCms = require("../validator/cms");

// Specific routes with fixed patterns should come BEFORE generic :section routes
cmsrouter.get("/category/:categoryId", cmsController.getAllCMSByCategoryId);
cmsrouter.post(
  "/reorder",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  cmsController.reorderCMSSections
);

cmsrouter.get(
  "/:pageId/sections",
  isAuthenticated,
  isAuthorized(["admin", "superadmin", "editor"]),
  cmsController.getCMSPageSections
);

cmsrouter.post(
  "/:pageId/sections/migrate-legacy",
  isAuthenticated,
  isAuthorized(["admin", "superadmin", "editor"]),
  cmsController.migrateLegacyCMSPageSections
);

cmsrouter.post(
  "/:pageId/sections",
  isAuthenticated,
  isAuthorized(["admin", "superadmin", "editor"]),
  cmsController.addCMSPageSection
);

cmsrouter.post(
  "/:pageId/sections/reorder",
  isAuthenticated,
  isAuthorized(["admin", "superadmin", "editor"]),
  cmsController.reorderCMSPageSections
);

cmsrouter.put(
  "/sections/:sectionId",
  isAuthenticated,
  isAuthorized(["admin", "superadmin", "editor"]),
  cmsController.updateCMSPageSection
);

cmsrouter.patch(
  "/sections/:sectionId/toggle",
  isAuthenticated,
  isAuthorized(["admin", "superadmin", "editor"]),
  cmsController.toggleCMSPageSection
);

cmsrouter.post(
  "/sections/:sectionId/duplicate",
  isAuthenticated,
  isAuthorized(["admin", "superadmin", "editor"]),
  cmsController.duplicateCMSPageSection
);

cmsrouter.delete(
  "/sections/:sectionId",
  isAuthenticated,
  isAuthorized(["admin", "superadmin", "editor"]),
  cmsController.deleteCMSPageSection
);

// Generic CRUD operations
cmsrouter.get("/", cmsController.getAllCMSSections);

cmsrouter.post(
  "/",
  validateCms,
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  cmsController.createCMSSection
);

// Variable routes (:section) come last
cmsrouter.get("/:section", cmsController.getCMSBySection);

cmsrouter.put(
  "/:section",
  validateCms,
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  cmsController.updateCMSSection
);

cmsrouter.delete(
  "/:section",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  cmsController.deleteCMSSection
);

module.exports = cmsrouter;
