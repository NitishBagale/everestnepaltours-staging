const OnlineBooking = require("../../models/onlineBooking");
const {
  sendOnlineBookingPaymentNotifications,
} = require("../lib/mail/send.mail");

const generateBookingRef = () =>
  `EVB-${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}`;

async function createOnlineBookingService(payload) {
  const booking = await OnlineBooking.create({
    bookingRef: generateBookingRef(),
    fullName: payload.fullName,
    email: payload.email,
    country: payload.country || "",
    totalPax: Number(payload.totalPax) || 1,
    tripName: payload.tripName,
    tripDate: payload.tripDate,
    depositAmount: payload.depositAmount,
    message: payload.message,
    termsAccepted: Boolean(payload.termsAccepted),
    paymentMethod: payload.paymentMethod || "hbl",
    paymentStatus: "initiated",
    gatewayStatus: "pending",
  });

  return booking;
}

async function getAllOnlineBookingsService() {
  return OnlineBooking.findAll({
    order: [["createdAt", "DESC"]],
  });
}

async function getOnlineBookingByRefService(bookingRef) {
  const booking = await OnlineBooking.findOne({ where: { bookingRef } });
  if (!booking) {
    throw new Error("Booking not found");
  }
  return booking;
}

async function updateOnlineBookingStatusService(bookingRef, payload) {
  const booking = await getOnlineBookingByRefService(bookingRef);
  const nextPaymentStatus = payload.paymentStatus || booking.paymentStatus;
  const nextGatewayStatus = payload.gatewayStatus || booking.gatewayStatus;
  const nextGatewayReference =
    payload.gatewayReference || booking.gatewayReference;

  await booking.update({
    paymentStatus: nextPaymentStatus,
    gatewayStatus: nextGatewayStatus,
    gatewayReference: nextGatewayReference,
  });

  if (nextPaymentStatus === "paid" && !booking.paymentReceiptEmailSentAt) {
    try {
      await sendOnlineBookingPaymentNotifications(booking);
      await booking.update({
        paymentReceiptEmailSentAt: new Date(),
      });
    } catch (error) {
      console.error(
        `Failed to send online booking payment emails for ${bookingRef}:`,
        error.message
      );
    }
  }

  return booking;
}

async function deleteOnlineBookingService(bookingRef) {
  const booking = await getOnlineBookingByRefService(bookingRef);
  await booking.destroy();
  return { message: "Online booking deleted successfully." };
}

module.exports = {
  createOnlineBookingService,
  getAllOnlineBookingsService,
  getOnlineBookingByRefService,
  updateOnlineBookingStatusService,
  deleteOnlineBookingService,
};
