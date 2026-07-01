const {
  createOnlineBookingService,
  getAllOnlineBookingsService,
  deleteOnlineBookingService,
  getOnlineBookingByRefService,
  updateOnlineBookingStatusService,
} = require("../services/onlineBooking.service");

const normalizeAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : null;
};

exports.createOnlineBooking = async (req, res) => {
  try {
    const {
      fullName,
      email,
      country,
      totalPax,
      tripName,
      tripDate,
      depositAmount,
      message,
      termsAccepted,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !tripName ||
      !tripDate ||
      !message ||
      !termsAccepted
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking fields.",
      });
    }

    const normalizedAmount = normalizeAmount(depositAmount);
    if (!normalizedAmount) {
      return res.status(400).json({
        success: false,
        message: "Deposit amount must be a valid number greater than zero.",
      });
    }

    const booking = await createOnlineBookingService({
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      country: String(country || "").trim(),
      totalPax,
      tripName: String(tripName).trim(),
      tripDate: String(tripDate).trim(),
      depositAmount: normalizedAmount,
      message: String(message).trim(),
      termsAccepted: Boolean(termsAccepted),
      paymentMethod: "hbl",
    });

    return res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create booking.",
    });
  }
};

exports.getAllOnlineBookings = async (req, res) => {
  try {
    const bookings = await getAllOnlineBookingsService();
    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch online bookings.",
    });
  }
};

exports.getOnlineBookingByRef = async (req, res) => {
  try {
    const booking = await getOnlineBookingByRefService(req.params.bookingRef);
    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    return res.status(error.message === "Booking not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateOnlineBookingStatus = async (req, res) => {
  try {
    const booking = await updateOnlineBookingStatusService(
      req.params.bookingRef,
      req.body || {}
    );

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    return res.status(error.message === "Booking not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteOnlineBooking = async (req, res) => {
  try {
    const result = await deleteOnlineBookingService(req.params.bookingRef);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.message === "Booking not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};
