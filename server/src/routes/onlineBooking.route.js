const { Router } = require("express");
const {
  createOnlineBooking,
  deleteOnlineBooking,
  getAllOnlineBookings,
  getOnlineBookingByRef,
  updateOnlineBookingStatus,
} = require("../controller/onlineBooking.controller");

const onlineBookingRouter = Router();

onlineBookingRouter.post("/", createOnlineBooking);
onlineBookingRouter.get("/", getAllOnlineBookings);
onlineBookingRouter.get("/:bookingRef", getOnlineBookingByRef);
onlineBookingRouter.patch("/:bookingRef/status", updateOnlineBookingStatus);
onlineBookingRouter.delete("/:bookingRef", deleteOnlineBooking);

module.exports = onlineBookingRouter;
