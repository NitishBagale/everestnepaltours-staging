const {
  confirmedBooking,
  adminBookingNotification,
  adminConfirmedBookingNotification,
} = require("../lib/mail/send.mail");
const {
  createBookingService,
  getAllBookingService,
  getBookingByIdService,
  updateBookingService,
  cancelBookingService,
} = require("../services/booking.service");
const { saveOtpService, verifyOtpService } = require("../services/otp.service");
const generateOTP = require("../utils/generateOTP");

exports.createBooking = async (req, res, next) => {
  const bookingData = req.body;
  try {
    const result = await createBookingService(bookingData);
    
    // Use packageName directly from booking data
    const packageName = result.packageName || "Package Tour";
    
    const OTP = generateOTP();
    console.log("OTP Generated:", OTP);
    console.log("Package Name:", packageName);
    
    try {
      await confirmedBooking({
        username: result.trvellerInfo.fullName,
        receiver: result.trvellerInfo.email,
        OTP: OTP,
        package: packageName,
      });
      await adminBookingNotification({
        fullName: result.trvellerInfo.fullName,
        package: packageName,
        contactNumber: result.trvellerInfo.contactNumber,
        email: result.trvellerInfo.email,
        travelDate: result.trvellerInfo.travelDate,
        message: result.details,
        noOfTravellers: result.trvellerInfo.noOfTravellers,
        accomodation: result.trvellerInfo.accommodation,
        passport: result.trvellerInfo.passport,
      });
      await saveOtpService({
        OTP,
        email: result.trvellerInfo.email,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
      return;
    }
    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyBooking = async (req, res, next) => {
  const { OTP, email } = req.body;

  console.log("Verification request received:", {
    OTP: OTP ? "***" : undefined,
    email,
  });

  if (!OTP || !email) {
    return res.status(400).json({
      success: false,
      message: "OTP and email are required",
    });
  }

  try {
    const result = await verifyOtpService({ OTP, email });

    if (result) {
      console.log("Booking verification successful for:", email);
      res.status(200).json({
        success: true,
        message: "Booking verified successfully",
        data: result,
      });
    } else {
      console.log(
        "Booking verification failed - no result returned for:",
        email
      );
      res.status(400).json({
        success: false,
        message: "Invalid OTP or verification failed",
      });
    }
  } catch (error) {
    console.error("Booking verification error:", error.message);
    res.status(400).json({
      success: false,
      error: "Verification failed",
      message: error.message,
    });
  }
};

exports.getBookingById = async (req, res, next) => {
  const packageId = req.params.id;
  try {
    const result = await getBookingByIdService(packageId);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllBooking = async (req, res, next) => {
  try {
    const result = await getAllBookingService();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateBooking = async (req, res, next) => {
  const bookingId = req.params.id;
  const { paymentStatus, status } = req.body;

  try {
    const updatedBooking = await updateBookingService(bookingId, {
      paymentStatus,
      status,
    });
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or nothing to update",
      });
    }
    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.cancelBooking = async (req, res, next) => {
  const bookingId = req.params.id;
  const { reason } = req.body;

  console.log("Cancellation request received:", { bookingId, reason });

  try {
    const cancelledBooking = await cancelBookingService(bookingId, {
      reason: reason || "Cancelled by admin",
    });

    if (!cancelledBooking) {
      console.log("Booking cancellation failed - no booking returned");
      return res.status(404).json({
        success: false,
        message: "Booking not found or could not be cancelled",
      });
    }

    console.log("Booking cancelled successfully:", bookingId);
    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully and notification email sent",
      data: cancelledBooking,
    });
  } catch (error) {
    console.error("Booking cancellation error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.confirmBooking = async (req, res, next) => {
  const bookingId = req.params.id;

  console.log("Admin confirming booking:", bookingId);

  try {
    // Get the booking first
    const booking = await getBookingByIdService(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if already confirmed
    if (booking.status === "confirmed" || booking.status === "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Booking is already confirmed",
      });
    }

    // Check if verified
    if (booking.status !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Booking must be verified before confirmation",
      });
    }

    // Update status to confirmed
    const confirmedBooking = await updateBookingService(bookingId, { 
      status: "confirmed" 
    });

    // Parse traveller info
    const travellerInfo = typeof confirmedBooking.trvellerInfo === 'string' 
      ? JSON.parse(confirmedBooking.trvellerInfo) 
      : confirmedBooking.trvellerInfo;

    // Send confirmation email to customer
    try {
      await adminConfirmedBookingNotification({
        customerName: travellerInfo?.fullName || "Customer",
        packageName: confirmedBooking.packageName || "Package Tour",
        travellerEmail: travellerInfo?.email || "",
        contactNumber: travellerInfo?.contactNumber || "",
        noOfTravellers: travellerInfo?.noOfTravellers || "",
        accommodation: travellerInfo?.accommodation || "",
        pickupLocation: confirmedBooking.pickUp || "",
        pickupDate: confirmedBooking.pickupDate || "",
        destinationLocation: confirmedBooking.destination || "",
        returnDate: confirmedBooking.returnDate || "",
      });
      console.log("Confirmation email sent to customer");
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError.message);
      // Don't fail the confirmation if email fails
    }

    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully and customer notified",
      data: confirmedBooking,
    });
  } catch (error) {
    console.error("Booking confirmation error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
