const Booking = require("../../models/booking.model");
const Otp = require("../../models/otp.model");
const { verifiedBookingNotification } = require("../lib/mail/send.mail");
const { Op } = require("sequelize");

async function saveOtpService({ OTP, email }) {
  try {
    console.log("Saving OTP for email:", email);

    // Delete any existing OTPs for this email
    await Otp.destroy({ where: { email } });

    // Create new OTP record
    const otpRecord = await Otp.create({ email, otp: OTP });
    console.log("OTP saved successfully:", otpRecord.id);

    return otpRecord;
  } catch (error) {
    console.error("Error saving OTP:", error.message);
    throw new Error("Error saving OTP: " + error.message);
  }
}

async function verifyOtpService({ OTP, email }) {
  try {
    console.log("Verifying OTP:", { OTP, email });

    // Check if OTP exists and is valid
    const otpRecord = await Otp.findOne({
      where: { email, otp: OTP },
      order: [["createdAt", "DESC"]],
    });

    if (!otpRecord) {
      console.log("OTP not found for email:", email);
      throw new Error("Invalid OTP or email");
    }

    console.log("OTP found, created at:", otpRecord.createdAt);
    console.log("Now finding the corresponding booking...");

    // Find the MOST RECENT PENDING booking by email created around the same time as OTP
    // Add time-based filtering to match the correct booking
    const otpTime = new Date(otpRecord.createdAt);
    const timeBuffer = 30 * 60 * 1000; // 30 minutes buffer
    const minBookingTime = new Date(otpTime.getTime() - timeBuffer);

    console.log("OTP created at:", otpTime);
    console.log("Looking for booking created after:", minBookingTime);

    const booking = await Booking.findOne({
      where: {
        [Op.and]: [
          Booking.sequelize.literal(`"trvellerInfo"->>'email' = '${email}'`),
          { status: "pending" }, // Only find pending bookings
          {
            createdAt: {
              [Op.gte]: minBookingTime, // Booking should be created around the same time as OTP
            },
          },
        ],
      },
      order: [["createdAt", "DESC"]], // Get the most recent one
    });

    if (!booking) {
      console.log("No matching booking found for email:", email);
      console.log(
        "Trying fallback: finding latest pending booking without time filter..."
      );

      // Fallback: find the latest pending booking without time restriction
      const fallbackBooking = await Booking.findOne({
        where: {
          [Op.and]: [
            Booking.sequelize.literal(`"trvellerInfo"->>'email' = '${email}'`),
            { status: "pending" },
          ],
        },
        order: [["createdAt", "DESC"]],
      });

      if (!fallbackBooking) {
        throw new Error("No pending booking found for this email");
      }

      console.log("Fallback booking found:", {
        id: fallbackBooking.id,
        createdAt: fallbackBooking.createdAt,
        destination: fallbackBooking.destination,
        pickUp: fallbackBooking.pickUp,
      });

      // Use fallback booking
      booking = fallbackBooking;
    }

    console.log("Latest pending booking found:", {
      id: booking.id,
      createdAt: booking.createdAt,
      destination: booking.destination,
      pickUp: booking.pickUp,
    });

    // Update booking status to verified (admin will change to ongoing/confirmed later)
    const [updatedRowsCount] = await Booking.update(
      { status: "verified" },
      {
        where: { id: booking.id },
      }
    );

    if (updatedRowsCount === 0) {
      console.log("Failed to update booking status");
      throw new Error("Failed to update booking status");
    }

    console.log("Booking status updated successfully");

    // Get updated booking
    const updatedBooking = await Booking.findOne({
      where: { id: booking.id },
    });

    console.log("=== BOOKING DATA DEBUG ===");
    console.log("Package Name:", updatedBooking.packageName);
    console.log("Status:", updatedBooking.status);
    console.log("Traveller Info type:", typeof updatedBooking.trvellerInfo);
    console.log("Traveller Info:", JSON.stringify(updatedBooking.trvellerInfo, null, 2));
    console.log("Pickup:", updatedBooking.pickUp);
    console.log("Destination:", updatedBooking.destination);
    console.log("=== END BOOKING DATA ===");

    // Delete the used OTP
    await Otp.destroy({ where: { email, otp: OTP } });
    console.log("OTP deleted successfully");

    // Parse trvellerInfo if it's a string (from raw query)
    const travellerInfo = typeof updatedBooking.trvellerInfo === 'string' 
      ? JSON.parse(updatedBooking.trvellerInfo) 
      : updatedBooking.trvellerInfo;

    console.log("=== PARSED TRAVELLER INFO ===");
    console.log(JSON.stringify(travellerInfo, null, 2));
    console.log("=== END PARSED INFO ===");

    // Send verification email
    try {
      const emailData = {
        customerName: travellerInfo?.fullName || "Customer",
        packageName: updatedBooking.packageName || "Package Tour",
        bookingStatus: updatedBooking.status || "ongoing",
        travellerEmail: travellerInfo?.email || "",
        contactNumber: travellerInfo?.contactNumber || "",
        noOfTravellers: travellerInfo?.noOfTravellers || "",
        accommodation: travellerInfo?.accommodation || "",
        pickupLocation: updatedBooking.pickUp || "",
        pickupDate: updatedBooking.pickupDate || "",
        destinationLocation: updatedBooking.destination || "",
        returnDate: updatedBooking.returnDate || "",
        mail: travellerInfo?.email || email,
      };

      console.log("=== EMAIL DATA TO SEND ===");
      console.log(JSON.stringify(emailData, null, 2));
      console.log("=== END EMAIL DATA ===");

      await verifiedBookingNotification(emailData);
      console.log("✅ Verification email sent successfully to:", emailData.mail);
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError.message);
      console.error("Email error stack:", emailError.stack);
      // Don't throw error here as booking verification was successful
    }

    return updatedBooking;
  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    throw new Error("Error verifying OTP: " + error.message);
  }
}

module.exports = { saveOtpService, verifyOtpService };
