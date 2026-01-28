const { Router } = require('express');
const isAuthenticated = require('../middleware/isAuthenticated');
const { isAuthorized } = require('../middleware/isAuthorized');
const { createSeoMetaData, getSeoMetaDataById, updateSeoMetaData, deleteSeoMetaData, getAllSeoMetaData, getSeoMetaDataByTag, getSeoMetaDataByPage } = require('../controller/seo');

const seoRouter = Router();

seoRouter.post("/", isAuthenticated, isAuthorized(["admin", "editor"]), createSeoMetaData );
seoRouter.get("/:id",isAuthenticated, isAuthorized(["admin", "editor"]), getSeoMetaDataById);
seoRouter.get("/", isAuthenticated, isAuthorized(["admin", "editor"]), getAllSeoMetaData);
seoRouter.put("/:id", isAuthenticated, isAuthorized(["admin", "editor"]), updateSeoMetaData);
seoRouter.delete("/:id", isAuthenticated, isAuthorized("admin"), deleteSeoMetaData);
seoRouter.get("/tag/:tag", isAuthenticated, isAuthorized(["admin", "editor"]), getSeoMetaDataByTag);
seoRouter.get("/page/:page", isAuthenticated, isAuthorized(["admin", "editor"]), getSeoMetaDataByPage);

module.exports = seoRouter;