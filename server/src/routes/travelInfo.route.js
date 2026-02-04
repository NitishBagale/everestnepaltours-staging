const express = require("express");
const travelInfoRouter = express.Router();
const travelInfoController = require("../controller/travelInfo.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");

travelInfoRouter.post(
  "/",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  travelInfoController.createTravelInfo
);

travelInfoRouter.get("/", travelInfoController.getTravelInfoList);
travelInfoRouter.get("/by-slug", travelInfoController.getTravelInfoBySlug);
travelInfoRouter.get("/related", travelInfoController.getTravelInfoWithRelated);
travelInfoRouter.post(
  "/reorder",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  travelInfoController.reorderTravelInfo
);

travelInfoRouter.put(
  "/:id",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  travelInfoController.updateTravelInfoById
);

travelInfoRouter.delete(
  "/:id",
  isAuthenticated,
  isAuthorized(["admin", "editor"]),
  travelInfoController.deleteTravelInfoById
);

module.exports = travelInfoRouter;
