const { Router } = require("express");

const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");
const {
  createTraveller,
  getAllTravellers,
  getTravellerById,
  updateTraveller,
  deleteTraveller,
} = require("../controller/traveller");

const travellerRouter = Router();

travellerRouter.post("/", createTraveller);
travellerRouter.get("/", getAllTravellers);
travellerRouter.get("/:id", getTravellerById);
travellerRouter.put("/:id", updateTraveller);
travellerRouter.delete(
  "/:id",
  deleteTraveller,
  isAuthenticated,
  isAuthorized(["admin", "superadmin"])
);
module.exports = travellerRouter;
