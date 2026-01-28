const Booking = require("../../models/booking.model");
const Traveller = require("../../models/traveller");
const { bookingCancellationNotification } = require("../lib/mail/send.mail");
const { hashPassword } = require("../lib/bcrypt/bcrypt");

async function createBookingService(bookingData) {
  try {
    console.log("=== CREATING BOOKING ===");
    // Create booking first
    const booking = await Booking.create(bookingData);
    console.log("Booking created with ID:", booking.id);
    
    // Extract traveller info from booking
    const travellerInfo = bookingData.trvellerInfo;
    console.log("Traveller info from booking:", travellerInfo);
    
    if (travellerInfo && travellerInfo.email) {
      try {
        console.log("Checking if traveller exists with email:", travellerInfo.email);
        // Check if traveller already exists
        let traveller = await Traveller.findOne({ 
          where: { email: travellerInfo.email } 
        });
        
        if (!traveller) {
          console.log("Traveller not found, creating new one...");
          // Create new traveller if doesn't exist
          // Generate a default password (user can change later)
          const defaultPassword = await hashPassword(travellerInfo.email.split('@')[0] + '123');
          
          traveller = await Traveller.create({
            fullName: travellerInfo.fullName || 'Guest',
            email: travellerInfo.email,
            password: defaultPassword,
            passport: travellerInfo.passport || null,
            cantactNumber: travellerInfo.contactNumber || null,
            trvelDate: bookingData.pickupDate || null,
            noOfTravellers: travellerInfo.noOfTravellers || 1,
            accomodation: travellerInfo.accommodation || null,
            description: `Auto-created from booking ${booking.id}`,
          });
          
          console.log("✅ New traveller created:", traveller.email, "ID:", traveller.id);
        } else {
          console.log("✅ Existing traveller found:", traveller.email, "ID:", traveller.id);
        }
      } catch (travellerError) {
        // Don't fail booking if traveller creation fails
        console.error("❌ Error creating/finding traveller:", travellerError.message);
        console.error("Traveller error stack:", travellerError.stack);
      }
    } else {
      console.log("⚠️  No traveller email found in booking data");
    }
    
    console.log("=== BOOKING CREATION COMPLETE ===");
    return booking;
  } catch (error) {
    console.error("❌ Error in createBookingService:", error);
    throw new Error("Error creating booking: " + error.message);
  }
}

async function getBookingByIdService(id) {
  try {
    return await Booking.findOne({ where: { id } });
  } catch (error) {
    throw new Error("Error fetching booking: " + error.message);
  }
}

async function getAllBookingService() {
  try {
    return await Booking.findAll({
      order: [["createdAt", "DESC"]],
    });
  } catch (error) {
    throw new Error("Error fetching bookings: " + error.message);
  }
}

async function updateBookingService(id, updateData) {
  try {
    const allowedFields = {};

    if (updateData.paymentStatus !== undefined)
      allowedFields.paymentStatus = updateData.paymentStatus;

    if (updateData.status !== undefined)
      allowedFields.status = updateData.status;

    const [updatedCount, [updatedBooking]] = await Booking.update(
      allowedFields,
      {
        where: { id },
        returning: true,
      }
    );

    if (updatedCount === 0) {
      throw new Error("Booking not found or nothing to update.");
    }

    return updatedBooking;
  } catch (error) {
    throw new Error("Error updating booking: " + error.message);
  }
}

async function cancelBookingService(id, cancellationData) {
  try {
    const booking = await Booking.findOne({ where: { id } });

    if (!booking) {
      throw new Error("Booking not found.");
    }

    // Generate friendly booking ID
    const generateFriendlyBookingId = (uuid) => {
      if (!uuid) return "BK-0000";
      const shortId = uuid.replace(/-/g, "").slice(-8).toUpperCase();
      return `BK-${shortId.slice(0, 4)}`;
    };

    // Update booking status only
    const [updatedCount, [updatedBooking]] = await Booking.update(
      {
        status: "cancelled",
      },
      {
        where: { id },
        returning: true,
      }
    );

    if (updatedCount === 0) {
      throw new Error("Failed to cancel booking.");
    }

    // Email handling
    let customerEmail = null;
    let customerName = "Customer";

    // Get email and name from trvellerInfo
    if (booking.trvellerInfo && typeof booking.trvellerInfo === "object") {
      customerEmail = booking.trvellerInfo.email;
      customerName = booking.trvellerInfo.fullName || "Customer";
    }

    console.log("Cancellation email details:", {
      customerEmail,
      customerName,
      packageName: booking.packageName,
    });

    if (customerEmail) {
      try {
        await bookingCancellationNotification({
          customerName,
          bookingId: generateFriendlyBookingId(booking.id),
          packageName: booking.packageName || "Package Tour",
          cancellationReason: cancellationData.reason || "Cancelled by admin",
          customerEmail,
          pickupLocation: booking.pickUp || "",
          pickupDate: booking.pickupDate
            ? new Date(booking.pickupDate).toLocaleDateString()
            : "",
          destinationLocation: booking.destination || "",
          destinationDate: booking.returnDate
            ? new Date(booking.returnDate).toLocaleDateString()
            : "",
        });
        console.log("Cancellation email sent successfully to:", customerEmail);
      } catch (error) {
        console.error("Failed to send cancellation email:", error.message);
      }
    } else {
      console.log("No customer email found, skipping cancellation email");
    }

    return updatedBooking;
  } catch (error) {
    throw new Error("Error cancelling booking: " + error.message);
  }
}

module.exports = {
  createBookingService,
  getAllBookingService,
  getBookingByIdService,
  updateBookingService,
  cancelBookingService,
};
