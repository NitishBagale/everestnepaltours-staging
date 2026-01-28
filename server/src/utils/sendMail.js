const { SMTP_EMAIL, SMTP_PASSWORD } = require("../../config/env");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,          // Use 587 for STARTTLS instead of 465
  secure: false,      // STARTTLS requires secure=false
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASSWORD, // Use App Password if 2FA enabled
  },
  tls: {
    // do not fail on invalid certs (optional, safe if using port 587)
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
