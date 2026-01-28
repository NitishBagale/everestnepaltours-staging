const express = require("express");
const {
  createBooking,
  getAllBooking,
  verifyBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
  confirmBooking,
} = require("../controller/booking.controller");
const validateBooking = require("../validator/booking.validate");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");

const router = express.Router();

router.post("/create", validateBooking, createBooking);
router.put("/verify", verifyBooking);
router.get(
  "/get",
  isAuthenticated,
  isAuthorized(["admin", "superadmin"]),
  getAllBooking
);
router.get("/get/:id", getBookingById);
router.put("/update/:id", updateBooking);
router.put(
  "/cancel/:id",
  isAuthenticated,
  isAuthorized(["admin", "superadmin"]),
  cancelBooking
);
router.put(
  "/confirm/:id",
  isAuthenticated,
  isAuthorized(["admin", "superadmin"]),
  confirmBooking
);
module.exports = router;
