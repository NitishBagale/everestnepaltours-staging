const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_EMAIL,
  SMTP_USER,
  SMTP_PASSWORD,
  MAIL_FROM_NAME,
  MAIL_FROM_EMAIL,
} = require("../../config/env");
const nodemailer = require("nodemailer");
let transporter;

function formatFromAddress(name, email) {
  const trimmedEmail = String(email || "").trim();
  const trimmedName = String(name || "").trim();

  if (!trimmedEmail) {
    return "";
  }

  return trimmedName ? `"${trimmedName}" <${trimmedEmail}>` : trimmedEmail;
}

function getTransporter() {
  if (!SMTP_HOST || !SMTP_EMAIL || !SMTP_PASSWORD) {
    throw new Error(
      "SMTP is not configured correctly. Set SMTP_HOST, SMTP_EMAIL, and SMTP_PASSWORD in server/.env."
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: String(SMTP_SECURE).toLowerCase() === "true",
      auth: {
        user: SMTP_USER || SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
      tls: {
        // Allow deployment-specific certificates when SMTP uses STARTTLS.
        rejectUnauthorized: false,
      },
      logger: true,
      debug: true,
    });
  }

  return transporter;
}

async function sendMail(mailInfo) {
  const defaultFrom = formatFromAddress(MAIL_FROM_NAME, MAIL_FROM_EMAIL || SMTP_EMAIL);
  const normalizedMailInfo = {
    ...mailInfo,
    from: defaultFrom,
  };

  try {
    return await getTransporter().sendMail(normalizedMailInfo);
  } catch (error) {
    if (error && (error.responseCode === 535 || /auth|login/i.test(error.message || ""))) {
      throw {
        status: 400,
        message:
          "SMTP authentication failed. Verify SMTP_USER or SMTP_EMAIL and SMTP_PASSWORD in server/.env.",
      };
    }

    throw {
      status: 400,
      message: error.message,
    };
  }
}

module.exports = sendMail;
