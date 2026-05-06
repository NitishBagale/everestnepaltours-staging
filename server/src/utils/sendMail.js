const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_EMAIL,
  SMTP_PASSWORD,
} = require("../../config/env");
const nodemailer = require("nodemailer");

const smtpPort = Number(SMTP_PORT || 587);
const smtpSecure = String(SMTP_SECURE).toLowerCase() === "true";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASSWORD,
  },
  tls: {
    // Allow deployment-specific certificates when SMTP uses STARTTLS.
    rejectUnauthorized: false,
  },
  logger: true,
  debug: true,
});

async function sendMail(mailInfo) {
  try {
    return await transporter.sendMail(mailInfo);
  } catch (error) {
    throw {
      status: 400,
      message: error.message,
    };
  }
}

module.exports = sendMail;
