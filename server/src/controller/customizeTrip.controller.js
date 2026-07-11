const { sendCustomizeTripNotification } = require("../lib/mail/send.mail");

function getRequestIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip;
}

exports.createCustomizeTripRequest = async (req, res) => {
  try {
    const payload = req.body || {};

    await sendCustomizeTripNotification({
      tripName: payload.tripName,
      tripSlug: payload.tripSlug,
      travelerType: payload.travelerType,
      adults: payload.adults,
      children: payload.children,
      travelDateType: payload.travelDateType,
      travelDate: payload.travelDate,
      destinations: payload.destinations,
      tripDuration: payload.tripDuration,
      hotelCategory: payload.hotelCategory,
      budgetRange: payload.budgetRange,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      passportCountry: payload.passportCountry,
      customizeDetails: payload.customizeDetails,
      sourcePage: req.get("referer"),
      ip: getRequestIp(req),
    });

    res.status(201).json({
      success: true,
      message: "Customize trip request submitted successfully",
      data: payload,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit customize trip request.",
    });
  }
};
