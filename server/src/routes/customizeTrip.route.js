const { Router } = require("express");
const { createCustomizeTripRequest } = require("../controller/customizeTrip.controller");
const validateCustomizeTrip = require("../validator/customizeTrip.validate");

const customizeTripRouter = Router();

customizeTripRouter.post("/", validateCustomizeTrip, createCustomizeTripRequest);

module.exports = customizeTripRouter;
