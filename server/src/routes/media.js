const { Router } = require('express');
const isAuthenticated = require('../middleware/isAuthenticated');
const { isAuthorized } = require('../middleware/isAuthorized');
const { createMedia, getAllMedia, getMediaById, updateMedia, deleteMedia, getMediaUsage, bulkUploadMedia } = require('../controller/media');
const { upload } = require('../utils/cloudinary');

const mediaRouter = Router();

// Create single media
mediaRouter.post("/", isAuthenticated, isAuthorized(["admin", "editor"]), upload.single("file"), createMedia);
mediaRouter.post("/upload", isAuthenticated, isAuthorized(["admin", "editor"]), upload.single("file"), createMedia);

// Bulk upload
mediaRouter.post("/bulk", isAuthenticated, isAuthorized(["admin", "editor"]), upload.array("files"), bulkUploadMedia);
mediaRouter.get("/", getAllMedia);
mediaRouter.get("/:id/usage", isAuthenticated, isAuthorized(["admin", "editor"]), getMediaUsage);
mediaRouter.get("/:id", getMediaById);
mediaRouter.put("/:id", isAuthenticated, isAuthorized(["admin", "editor"]), updateMedia);
mediaRouter.delete("/:id", isAuthenticated, isAuthorized(["admin", "editor"]), deleteMedia);

module.exports = mediaRouter;
