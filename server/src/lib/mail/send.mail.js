const pug = require("pug");
const path = require("path");
const fs = require("fs");
const sendMail = require("../../utils/sendMail");
const { ADMIN_MAIL } = require("../../../config/env");

const BRAND_NAME = "Everest Vacation Pvt. Ltd.";
const SITE_URL = "https://everestnepaltours.com";
const SUPPORT_EMAIL = "info@everestnepaltours.com";
const SUPPORT_PHONE = "+977-985 105 3024";
const LOGO_URL =
  "https://everestnepaltours.com/wp-content/uploads/2023/11/everest-vacation-logo1-e1706090032268.png";

const visitorTemplate = fs.readFileSync(
  path.join(__dirname, "./template/visitor-confirmation.html"),
  "utf8"
);
const adminTemplate = fs.readFileSync(
  path.join(__dirname, "./template/admin-notification.html"),
  "utf8"
);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(String(value || ""));
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTimeAgo(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

function normalizeValue(value, fallback = "Not provided") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeMultiline(value, fallback = "Not provided") {
  return normalizeValue(value, fallback);
}

function sanitizePhoneLink(phone) {
  const normalized = String(phone || "").replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : `mailto:${SUPPORT_EMAIL}`;
}

function normalizeIpAddress(ip) {
  const value = String(ip || "").trim();
  if (!value) {
    return "Unavailable";
  }

  if (value === "::1") {
    return "127.0.0.1";
  }

  return value.replace(/^::ffff:/, "");
}

function buildIpLookupUrl(ip) {
  const normalizedIp = normalizeIpAddress(ip);
  if (
    !normalizedIp ||
    normalizedIp === "Unavailable" ||
    normalizedIp.toLowerCase() === "unknown"
  ) {
    return SITE_URL;
  }

  return `http://whatismyipaddress.com/ip/${encodeURIComponent(normalizedIp)}`;
}

function formatMailbox(name, email, fallbackName = "Website visitor") {
  const trimmedEmail = String(email || "").trim();
  if (!trimmedEmail) {
    return "";
  }

  const trimmedName = String(name || fallbackName)
    .trim()
    .replace(/"/g, "");

  return `"${trimmedName}" <${trimmedEmail}>`;
}

function buildVisitorReplyHeaders(name, email) {
  const mailbox = formatMailbox(name, email);
  const brandedFrom = formatMailbox(name, SUPPORT_EMAIL, "Website visitor");

  if (!mailbox) {
    return brandedFrom ? { from: brandedFrom } : {};
  }

  return {
    from: brandedFrom,
    replyTo: mailbox,
  };
}

function fillTemplate(template, values) {
  return template.replace(/{{([A-Z0-9_]+)}}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : ""
  );
}

function renderVisitorConfirmationEmail(config) {
  return fillTemplate(visitorTemplate, {
    EMAIL_TITLE: escapeHtml(config.emailTitle),
    LOGO_URL: escapeHtml(LOGO_URL),
    BRAND_NAME: escapeHtml(BRAND_NAME),
    HEADER_TITLE: escapeHtml(config.headerTitle),
    HEADER_SUBTITLE: escapeHtml(config.headerSubtitle),
    RIBBON_TEXT: escapeHtml(config.ribbonText),
    DATE: escapeHtml(config.dateText || formatDate()),
    FULL_NAME: escapeHtml(normalizeValue(config.fullName, "Traveler")),
    INTRO_TEXT: escapeHtml(config.introText),
    DETAILS_TITLE: escapeHtml(config.detailsTitle),
    DETAIL_LABEL_1: escapeHtml(config.details?.[0]?.label || "-"),
    DETAIL_VALUE_1: escapeHtml(config.details?.[0]?.value || "-"),
    DETAIL_LABEL_2: escapeHtml(config.details?.[1]?.label || "-"),
    DETAIL_VALUE_2: escapeHtml(config.details?.[1]?.value || "-"),
    DETAIL_LABEL_3: escapeHtml(config.details?.[2]?.label || "-"),
    DETAIL_VALUE_3: escapeHtml(config.details?.[2]?.value || "-"),
    DETAIL_LABEL_4: escapeHtml(config.details?.[3]?.label || "-"),
    DETAIL_VALUE_4: escapeHtml(config.details?.[3]?.value || "-"),
    STEPS_TITLE: escapeHtml(config.stepsTitle),
    STEP_1: escapeHtml(config.steps?.[0] || "-"),
    STEP_2: escapeHtml(config.steps?.[1] || "-"),
    STEP_3: escapeHtml(config.steps?.[2] || "-"),
    SUPPORT_TEXT: escapeHtml(config.supportText),
    CTA_HREF: escapeHtml(config.ctaHref || `mailto:${SUPPORT_EMAIL}`),
    CTA_TEXT: escapeHtml(config.ctaText || "Contact our team"),
    SIGNOFF_NAME: escapeHtml(config.signoffName || "The Everest Vacation Team"),
    SIGNOFF_META: escapeHtml(
      config.signoffMeta || `${SUPPORT_PHONE} | ${SITE_URL.replace("https://", "")}`
    ),
    FOOTER_TEXT: escapeHtml(config.footerText),
    FOOTER_LINK_1_HREF: escapeHtml(`${SITE_URL}/about-us/book-with-confidence/`),
    FOOTER_LINK_1_TEXT: "Book with Confidence",
    FOOTER_LINK_2_HREF: escapeHtml(SITE_URL),
    FOOTER_LINK_2_TEXT: "Visit our website",
    FOOTER_LINK_3_HREF: escapeHtml(`mailto:${SUPPORT_EMAIL}`),
    FOOTER_LINK_3_TEXT: "Contact us",
  });
}

function renderAdminNotificationEmail(config) {
  const normalizedIp = normalizeIpAddress(config.ip);
  const ipLookupUrl = buildIpLookupUrl(config.ip);

  return fillTemplate(adminTemplate, {
    EMAIL_TITLE: escapeHtml(config.emailTitle),
    LOGO_URL: escapeHtml(LOGO_URL),
    BRAND_NAME: escapeHtml(BRAND_NAME),
    HEADER_TITLE: escapeHtml(config.headerTitle),
    HEADER_SUBTITLE: escapeHtml(config.headerSubtitle),
    URGENCY_TEXT: escapeHtml(config.urgencyText),
    FULL_NAME: escapeHtml(normalizeValue(config.fullName)),
    EMAIL: escapeHtml(normalizeValue(config.email)),
    PHONE: escapeHtml(normalizeValue(config.phone)),
    CONTACT_FIELD_4_LABEL: escapeHtml(config.contactField4Label || "Passport country"),
    CONTACT_FIELD_4_VALUE: escapeHtml(normalizeValue(config.contactField4Value)),
    DETAILS_SECTION_LABEL: escapeHtml(config.detailsSectionLabel || "Details"),
    DETAILS_TITLE: escapeHtml(config.detailsTitle),
    DETAIL_LABEL_1: escapeHtml(config.details?.[0]?.label || "-"),
    DETAIL_VALUE_1: escapeHtml(config.details?.[0]?.value || "-"),
    DETAIL_LABEL_2: escapeHtml(config.details?.[1]?.label || "-"),
    DETAIL_VALUE_2: escapeHtml(config.details?.[1]?.value || "-"),
    DETAIL_LABEL_3: escapeHtml(config.details?.[2]?.label || "-"),
    DETAIL_VALUE_3: escapeHtml(config.details?.[2]?.value || "-"),
    NOTES_LABEL: escapeHtml(config.notesLabel || "Notes"),
    TRIP_NOTES: escapeHtml(normalizeMultiline(config.notes)),
    ACTION_EMAIL: escapeHtml(config.actionEmail || SUPPORT_EMAIL),
    ACTION_PHONE_LINK: escapeHtml(sanitizePhoneLink(config.phone)),
    SUBMISSION_SOURCE: escapeHtml(config.submissionSource || "website form"),
    SOURCE_PAGE: escapeHtml(config.sourcePage || SITE_URL),
    IP: escapeHtml(normalizedIp),
    IP_LOOKUP_URL: escapeHtml(ipLookupUrl),
    FOOTER_TEXT: escapeHtml(
      config.footerText || "This notification was generated automatically from your website."
    ),
  });
}

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

async function sendEnquiryNotification({
  name,
  email,
  contact,
  message,
  sourcePage,
  ip,
}) {
  try {
    const customerHtml = renderVisitorConfirmationEmail({
      emailTitle: "Inquiry Confirmation — Everest Vacation",
      headerTitle: "Your inquiry is in good hands.",
      headerSubtitle: "A travel expert will reach out to you within 24 hours.",
      ribbonText: "Inquiry received on",
      dateText: formatDate(),
      fullName: name,
      introText:
        "Thank you for reaching out to Everest Vacation Private Limited. We have received your inquiry and a travel consultant will review it shortly.",
      detailsTitle: "Your inquiry summary",
      details: [
        { label: "Inquiry type", value: "Ask to expert" },
        { label: "Email", value: email },
        { label: "Phone", value: contact || "Not provided" },
        { label: "Message length", value: `${String(message || "").trim().length} characters` },
      ],
      stepsTitle: "What happens next?",
      steps: [
        "Our travel expert reviews your request and checks the details you submitted.",
        "You will receive a personalized response from our team, usually within 24 hours.",
        "We will continue refining the plan with you until it fits your trip.",
      ],
      supportText:
        "If you need to add more details, reply to this email and mention your request.",
      ctaHref: `mailto:${SUPPORT_EMAIL}`,
      ctaText: "Contact our team",
      footerText:
        "You received this email because you submitted an inquiry on everestnepaltours.com.",
    });

    const adminHtml = renderAdminNotificationEmail({
      emailTitle: "New Inquiry — Admin Notification",
      headerTitle: "New inquiry received.",
      headerSubtitle: `Submitted ${formatTimeAgo()} · Response required within 24 hours`,
      urgencyText:
        "A visitor expects a response within 24 hours. Please follow up as soon as possible.",
      fullName: name,
      email,
      phone: contact || "Not provided",
      contactField4Label: "Lead type",
      contactField4Value: "Ask to expert",
      detailsSectionLabel: "Inquiry details",
      detailsTitle: "Inquiry summary",
      details: [
        { label: "Requested service", value: "Ask to expert" },
        { label: "Submitted date", value: formatDate() },
        { label: "Response target", value: "Within 24 hours" },
      ],
      notesLabel: "Additional notes from visitor",
      notes: message,
      actionEmail: email,
      submissionSource: "ask to expert form",
      sourcePage,
      ip,
    });

    await Promise.all([
      sendMail({
        from: '"Everest Vacation" <info@everest-vacation.com>',
        to: email,
        subject: "We received your inquiry",
        html: customerHtml,
      }),
      ADMIN_MAIL
        ? sendMail({
            from: '"Everest Vacation" <info@everest-vacation.com>',
            to: ADMIN_MAIL,
            subject: `New Inquiry from ${name}`,
            html: adminHtml,
          })
        : Promise.resolve(),
    ]);
    console.log("Enquiry notification email sent successfully");
  } catch (error) {
    console.error("Error sending enquiry email:", error);
    throw new Error("Error sending email: " + error.message);
  }
}

async function sendContactFormNotification({
  fullName,
  email,
  subject,
  message,
  sourcePage,
  ip,
}) {
  try {
    const customerHtml = renderVisitorConfirmationEmail({
      emailTitle: "Contact Confirmation — Everest Vacation",
      headerTitle: "Your message is on its way.",
      headerSubtitle: "Our team will review your contact request and reply soon.",
      ribbonText: "Contact request received on",
      dateText: formatDate(),
      fullName,
      introText:
        "Thank you for contacting Everest Vacation Private Limited. We have received your message and will get back to you as soon as possible.",
      detailsTitle: "Your contact summary",
      details: [
        { label: "Subject", value: subject },
        { label: "Email", value: email },
        { label: "Submitted via", value: "Contact form" },
        { label: "Response target", value: "Within 24 hours" },
      ],
      stepsTitle: "What happens next?",
      steps: [
        "Our team reviews your message and identifies the right person to respond.",
        "You will receive a reply by email with the answer or next steps.",
        "If needed, we will continue the conversation until your request is resolved.",
      ],
      supportText:
        "If your request is urgent, reply to this email or contact our team directly.",
      ctaHref: `mailto:${SUPPORT_EMAIL}`,
      ctaText: "Contact our team",
      footerText:
        "You received this email because you submitted a contact form on everestnepaltours.com.",
    });

    const adminHtml = renderAdminNotificationEmail({
      emailTitle: "New Contact Form — Admin Notification",
      headerTitle: "New contact form message received.",
      headerSubtitle: `Submitted ${formatTimeAgo()} · Response required within 24 hours`,
      urgencyText:
        "A visitor has submitted a contact request. Please review the message and follow up promptly.",
      fullName,
      email,
      phone: "Not provided",
      contactField4Label: "Subject",
      contactField4Value: subject,
      detailsSectionLabel: "Contact details",
      detailsTitle: "Contact summary",
      details: [
        { label: "Request type", value: "Contact form" },
        { label: "Subject", value: subject },
        { label: "Submitted date", value: formatDate() },
      ],
      notesLabel: "Visitor message",
      notes: message,
      actionEmail: email,
      submissionSource: "contact form",
      sourcePage,
      ip,
    });

    await Promise.all([
      sendMail({
        from: '"Everest Vacation" <info@everest-vacation.com>',
        to: email,
        subject: "We received your message",
        html: customerHtml,
      }),
      ADMIN_MAIL
        ? sendMail({
            ...buildVisitorReplyHeaders(fullName, email),
            to: ADMIN_MAIL,
            subject: normalizeValue(subject, "New contact form submission"),
            html: adminHtml,
          })
        : Promise.resolve(),
    ]);
    console.log("Contact form notification email sent successfully");
  } catch (error) {
    console.error("Error sending contact form email:", error);
    throw new Error("Error sending email: " + error.message);
  }
}

async function sendAskExpertNotification({
  fullName,
  email,
  phone,
  country,
  packageName,
  message,
  sourcePage,
  ip,
}) {
  const customerHtml = renderVisitorConfirmationEmail({
    emailTitle: "Ask an Expert Confirmation — Everest Vacation",
    headerTitle: "Your inquiry is in good hands.",
    headerSubtitle: "A travel expert will reach out to you within 24 hours.",
    ribbonText: "Inquiry received on",
    dateText: formatDate(),
    fullName,
    introText:
      "Thank you for reaching out to Everest Vacation Private Limited. Your request has been sent to our travel experts and we will get back to you shortly.",
    detailsTitle: "Your inquiry summary",
    details: [
      { label: "Package", value: packageName },
      { label: "Email", value: email },
      { label: "Phone", value: phone || "Not provided" },
      { label: "Passport country", value: country || "Not provided" },
    ],
    stepsTitle: "What happens next?",
    steps: [
      "A travel expert reviews your question and the selected package.",
      "You will receive a personal reply with recommendations or trip details.",
      "We can continue refining the trip plan together if you need more help.",
    ],
    supportText:
      "Need to add more information before we reply? Just respond to this email.",
    ctaHref: `mailto:${SUPPORT_EMAIL}`,
    ctaText: "Contact our team",
    footerText:
      "You received this email because you submitted an ask-to-expert form on everestnepaltours.com.",
  });

  const adminHtml = renderAdminNotificationEmail({
    emailTitle: "New Ask to Expert Lead — Admin Notification",
    headerTitle: "New trip inquiry received.",
    headerSubtitle: `Submitted ${formatTimeAgo()} · Response required within 24 hours`,
    urgencyText:
      "A visitor expects a response within 24 hours. Please assign a consultant and follow up as soon as possible.",
    fullName,
    email,
    phone: phone || "Not provided",
    contactField4Label: "Passport country",
    contactField4Value: country || "Not provided",
    detailsSectionLabel: "Trip details",
    detailsTitle: "Inquiry summary",
    details: [
      { label: "Package", value: packageName },
      { label: "Lead source", value: "Ask to expert form" },
      { label: "Submitted date", value: formatDate() },
    ],
    notesLabel: "Additional notes from visitor",
    notes: message,
    actionEmail: email,
    sourcePage,
    ip,
    submissionSource: "ask to expert form",
  });

  try {
    await Promise.all([
      sendMail({
        from: '"Everest Vacation" <info@everest-vacation.com>',
        to: email,
        subject: `We received your request about ${packageName}`,
        html: customerHtml,
      }),
      ADMIN_MAIL
        ? sendMail({
            ...buildVisitorReplyHeaders(fullName, email),
            to: ADMIN_MAIL,
            subject: `Ask an Expert: ${packageName}`,
            html: adminHtml,
          })
        : Promise.resolve(),
    ]);
  } catch (error) {
    console.error("Error sending ask expert email:", error);
    throw new Error("Error sending email: " + error.message);
  }
}

async function sendCustomizeTripNotification({
  tripName,
  tripSlug,
  travelerType,
  travelDateType,
  destinations,
  tripDuration,
  hotelCategory,
  budgetRange,
  fullName,
  email,
  phone,
  passportCountry,
  customizeDetails,
  sourcePage,
  ip,
}) {
  const destinationList = Array.isArray(destinations) && destinations.length
    ? destinations.join(", ")
    : "Not provided";
  const normalizedTripName = normalizeValue(tripName, "Custom trip request");
  const adminNotes = [
    `Traveling as: ${normalizeValue(travelerType)}`,
    `Travel date status: ${normalizeValue(travelDateType)}`,
    `Interested destinations: ${destinationList}`,
    `Estimated trip duration: ${normalizeValue(tripDuration)}`,
    `Hotel category: ${normalizeValue(hotelCategory)}`,
    `Budget range: ${normalizeValue(budgetRange)}`,
    `Passport country issued: ${normalizeValue(passportCountry)}`,
    tripSlug ? `Trip slug: ${tripSlug}` : "",
    "",
    "Customize details:",
    normalizeMultiline(customizeDetails),
  ]
    .filter(Boolean)
    .join("\n");

  const customerHtml = renderVisitorConfirmationEmail({
    emailTitle: "Customize Trip Confirmation — Everest Vacation",
    headerTitle: "Your custom trip request is in good hands.",
    headerSubtitle: "Our travel team will review your request and contact you within 24 hours.",
    ribbonText: "Request received on",
    dateText: formatDate(),
    fullName,
    introText:
      "Thank you for sharing your customize trip request with Everest Vacation Private Limited. Our team will review your travel preferences and send you a personalized response shortly.",
    detailsTitle: "Your request summary",
    details: [
      { label: "Trip", value: normalizedTripName },
      { label: "Traveling as", value: travelerType },
      { label: "Destinations", value: destinationList },
      { label: "Hotel category", value: hotelCategory },
    ],
    stepsTitle: "What happens next?",
    steps: [
      "Our consultant reviews your travel style, budget, and destination interests.",
      "We prepare a recommended plan or booking guidance based on your request.",
      "You will receive a personalized reply by email, usually within 24 hours.",
    ],
    supportText:
      "If you want to add anything else, reply to this email and include your trip preferences.",
    ctaHref: `mailto:${SUPPORT_EMAIL}`,
    ctaText: "Contact our team",
    footerText:
      "You received this email because you submitted a customize trip request on everestnepaltours.com.",
  });

  const adminHtml = renderAdminNotificationEmail({
    emailTitle: "New Customize Trip Request — Admin Notification",
    headerTitle: "New customize trip request received.",
    headerSubtitle: `Submitted ${formatTimeAgo()} · Response required within 24 hours`,
    urgencyText:
      "A visitor has submitted a customize trip request. Please review the preferences and follow up promptly.",
    fullName,
    email,
    phone,
    contactField4Label: "Passport country",
    contactField4Value: passportCountry,
    detailsSectionLabel: "Trip details",
    detailsTitle: "Request summary",
    details: [
      { label: "Trip", value: normalizedTripName },
      { label: "Traveling as", value: travelerType },
      { label: "Submitted date", value: formatDate() },
    ],
    notesLabel: "Customize details",
    notes: adminNotes,
    actionEmail: email,
    sourcePage,
    ip,
    submissionSource: "customize trip form",
  });

  try {
    await Promise.all([
      sendMail({
        from: '"Everest Vacation" <info@everest-vacation.com>',
        to: email,
        subject: `We received your customize trip request${tripName ? ` for ${tripName}` : ""}`,
        html: customerHtml,
      }),
      ADMIN_MAIL
        ? sendMail({
            ...buildVisitorReplyHeaders(fullName, email),
            to: ADMIN_MAIL,
            subject: `Customize Trip Request${tripName ? `: ${tripName}` : ""}`,
            html: adminHtml,
          })
        : Promise.resolve(),
    ]);
  } catch (error) {
    console.error("Error sending customize trip email:", error);
    throw new Error("Error sending email: " + error.message);
  }
}

async function sendOnlineBookingPaymentNotifications(booking) {
  const {
    bookingRef,
    fullName,
    email,
    country,
    totalPax,
    tripName,
    tripDate,
    depositAmount,
    message,
  } = booking;

  const customerHtml = renderVisitorConfirmationEmail({
    emailTitle: "Payment Received — Everest Vacation",
    headerTitle: "Your payment has been received.",
    headerSubtitle: "Your online booking is now with our team for final review.",
    ribbonText: "Payment received on",
    dateText: formatDate(),
    fullName,
    introText:
      "Thank you for your payment. We have recorded your booking deposit successfully and our team will contact you shortly with the next steps.",
    detailsTitle: "Your booking summary",
    details: [
      { label: "Booking reference", value: bookingRef },
      { label: "Trip", value: tripName },
      { label: "Travel date", value: tripDate },
      { label: "Paid amount", value: `$${depositAmount}` },
    ],
    stepsTitle: "What happens next?",
    steps: [
      "Our booking team reviews your payment and trip request.",
      "We will contact you with booking confirmation and any required follow-up details.",
      "You can reply to this email if you want to update passenger or trip information.",
    ],
    supportText:
      "If you need to change anything, reply to this email and include your booking reference.",
    ctaHref: `${SITE_URL}/online-booking`,
    ctaText: "View booking page",
    footerText:
      "You received this email because a payment was completed for your online booking on everestnepaltours.com.",
  });

  const adminHtml = renderAdminNotificationEmail({
    emailTitle: "Paid Online Booking — Admin Notification",
    headerTitle: "New paid online booking received.",
    headerSubtitle: `Submitted ${formatTimeAgo()} · Payment completed successfully`,
    urgencyText:
      "A customer has completed payment for an online booking. Please review the booking and follow up promptly.",
    fullName,
    email,
    phone: "Not provided",
    contactField4Label: "Passport country",
    contactField4Value: country || "Not provided",
    detailsSectionLabel: "Booking details",
    detailsTitle: "Payment summary",
    details: [
      { label: "Booking reference", value: bookingRef },
      { label: "Trip", value: `${tripName} (${tripDate})` },
      { label: "Paid amount", value: `$${depositAmount} for ${totalPax} pax` },
    ],
    notesLabel: "Booking notes",
    notes: message,
    actionEmail: email,
    sourcePage: `${SITE_URL}/online-booking`,
    submissionSource: "online booking payment form",
  });

  const jobs = [
    sendMail({
      from: '"Everest Vacation" <info@everest-vacation.com>',
      to: email,
      subject: `Payment received for booking ${bookingRef}`,
      html: customerHtml,
    }),
  ];

  if (ADMIN_MAIL) {
    jobs.push(
      sendMail({
        ...buildVisitorReplyHeaders(fullName, email),
        to: ADMIN_MAIL,
        subject: `Paid online booking ${bookingRef}`,
        html: adminHtml,
      })
    );
  }

  try {
    await Promise.all(jobs);
    console.log("Online booking payment emails sent:", bookingRef);
  } catch (error) {
    console.error("Error sending online booking payment emails:", error);
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
  sendAskExpertNotification,
  sendCustomizeTripNotification,
  sendOnlineBookingPaymentNotifications,
};
