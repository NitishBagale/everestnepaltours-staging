const pug = require("pug");
const path = require("path");
const sendMail = require("../../utils/sendMail");
const { ADMIN_MAIL } = require("../../../config/env");

async function confirmedBooking({ username, receiver, OTP, package }) {
  const htmlContent = pug.renderFile(
    path.join(__dirname, "./template/confirmed-booking.jade"),
    {
      customerName: username,
      OTP: OTP,
      packageName: package,
    }
  );
  try {
    await sendMail({
      from: '"everest-holidays Booking" <info@everest-holidaysbooking.com>',
      to: receiver,
      subject: "Booking Confirmation OTP",
      html: htmlContent,
    });
  } catch (error) {
    console.log(error);
    throw new Error("Error sending email: " + error.message);
  }
}

async function adminBookingNotification({
  fullName,
  package,
  contactNumber,
  email,
  travelDate,
  message,
  noOfTravellers,
  accomodation,
  passport,
}) {
  const htmlContent = pug.renderFile(
    path.join(__dirname, "./template/admin-notification.jade"),
    {
      customerName: fullName,
      packageName: package,
      contactNumber,
      email,
      travelDate,
      message,
      noOfTravellers,
      accommodation: accomodation,
      passport,
    }
  );
  try {
    await sendMail({
      from: '"everest-holidays Booking" <info@everest-holidaysbooking.com>',
      to: ADMIN_MAIL,
      subject: "New Booking Alert",
      html: htmlContent,
    });
  } catch (error) {
    throw new Error("Error sending email: " + error.message);
  }
}

async function verifiedBookingNotification({
  customerName,
  packageName,
  bookingStatus,
  travellerEmail,
  contactNumber,
  noOfTravellers,
  accommodation,
  pickupLocation,
  pickupDate,
  destinationLocation,
  returnDate,
  mail,
}) {
  console.log("=== VERIFIED BOOKING EMAIL FUNCTION ===");
  console.log("Received data:", {
    customerName,
    packageName,
    bookingStatus,
    travellerEmail,
    contactNumber,
    noOfTravellers,
    accommodation,
    pickupLocation,
    pickupDate,
    destinationLocation,
    returnDate,
    mail,
  });

  const htmlContent = pug.renderFile(
    path.join(__dirname, "./template/booking-confirmation.jade"),
    {
      customerName,
      packageName,
      bookingStatus,
      travellerEmail,
      contactNumber,
      noOfTravellers,
      accommodation,
      pickupLocation,
      pickupDate,
      destinationLocation,
      returnDate,
      mail,
    }
  );
  
  console.log("Template rendered successfully");
  
  try {
    await sendMail({
      from: '"everest-holidays Booking" <everest-holidaysbooking@gmail.com>',
      to: mail,
      subject: "Your booking is confirmed",
      html: htmlContent,
    });
    console.log("Email sent successfully to:", mail);
  } catch (error) {
    console.error("Error sending verified booking email:", error);
    throw new Error("Error sending email: " + error.message);
  }
}

async function bookingCancellationNotification({
  customerName,
  bookingId,
  rawBookingId,
  vehicleName,
  vehicleType,
  pickupLocation,
  pickupDate,
  destinationLocation,
  destinationDate,
  cancellationReason,
  customerEmail,
}) {
  console.log("Preparing cancellation email with data:", {
    customerName,
    bookingId,
    vehicleName,
    customerEmail,
    cancellationReason,
    pickupLocation,
    pickupDate,
    destinationLocation,
    destinationDate,
  });

  try {
    const htmlContent = pug.renderFile(
      path.join(__dirname, "./template/booking-cancellation.jade"),
      {
        customerName,
        bookingId,
        rawBookingId,
        vehicleName,
        vehicleType,
        pickupLocation,
        pickupDate,
        destinationLocation,
        destinationDate,
        cancellationReason,
      }
    );

    console.log("Email template rendered successfully");

    const emailOptions = {
      from: '"everest-holidays Booking" <info@everest-holidaysbooking.com>',
      to: customerEmail,
      subject: "Booking Cancellation - everest-holidays Booking",
      html: htmlContent,
    };

    console.log("Sending email to:", customerEmail);

    await sendMail(emailOptions);

    console.log("Cancellation email sent successfully to:", customerEmail);
  } catch (error) {
    console.error("Error in bookingCancellationNotification:", error);
    throw new Error("Error sending cancellation email: " + error.message);
  }
}

async function adminConfirmedBookingNotification({
  customerName,
  packageName,
  travellerEmail,
  contactNumber,
  noOfTravellers,
  accommodation,
  pickupLocation,
  pickupDate,
  destinationLocation,
  returnDate,
}) {
  console.log("=== ADMIN CONFIRMED BOOKING EMAIL ===");
  
  const htmlContent = pug.renderFile(
    path.join(__dirname, "./template/admin-confirmed-booking.jade"),
    {
      customerName,
      packageName,
      travellerEmail,
      contactNumber,
      noOfTravellers,
      accommodation,
      pickupLocation,
      pickupDate,
      destinationLocation,
      returnDate,
    }
  );

  try {
    await sendMail({
      from: '"everest-holidays Booking" <everest-holidaysbooking@gmail.com>',
      to: travellerEmail,
      subject: "Booking Confirmed by Admin - everest-holidays",
      html: htmlContent,
    });
    console.log("Admin confirmed email sent to:", travellerEmail);
  } catch (error) {
    console.error("Error sending admin confirmed email:", error);
    throw new Error("Error sending email: " + error.message);
  }
}

async function sendEnquiryNotification({ name, email, contact, message }) {
  const htmlContent = pug.renderFile(
    path.join(__dirname, "./template/../../../views/enquiryEmail.jade"),
    {
      name,
      email,
      contact,
      message,
    }
  );
  
  try {
    await sendMail({
      from: '"Everest Vacation - Enquiry" <info@everest-vacation.com>',
      to: ADMIN_MAIL,
      subject: `New Enquiry from ${name}`,
      html: htmlContent,
    });
    console.log("Enquiry notification email sent successfully");
  } catch (error) {
    console.error("Error sending enquiry email:", error);
    throw new Error("Error sending email: " + error.message);
  }
}

async function sendContactFormNotification({ fullName, email, subject, message }) {
  const htmlContent = pug.renderFile(
    path.join(__dirname, "./template/../../../views/contactFormEmail.jade"),
    {
      fullName,
      email,
      subject,
      message,
    }
  );
  
  try {
    await sendMail({
      from: '"Everest Vacation - Contact" <info@everest-vacation.com>',
      to: ADMIN_MAIL,
      subject: `New Contact Form: ${subject}`,
      html: htmlContent,
    });
    console.log("Contact form notification email sent successfully");
  } catch (error) {
    console.error("Error sending contact form email:", error);
    throw new Error("Error sending email: " + error.message);
  }
}


module.exports = {
  confirmedBooking,
  adminBookingNotification,
  verifiedBookingNotification,
  bookingCancellationNotification,
  adminConfirmedBookingNotification,
  sendEnquiryNotification,
  sendContactFormNotification,
};
