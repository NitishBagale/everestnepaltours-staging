const { SMTP_CONFIG } = require("../../config/env");
const nodemailer = require("nodemailer");
let transporter;

function getTransporter() {
  if (!SMTP_CONFIG.password) {
    throw new Error(
      "SMTP is not configured correctly. Set SMTP_PASSWORD in the runtime environment or expose it from server/config/env.js."
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: {
        user: SMTP_CONFIG.email,
        pass: SMTP_CONFIG.password,
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
  try {
    return await getTransporter().sendMail(mailInfo);
  } catch (error) {
    throw {
      status: 400,
      message: error.message,
    };
  }
}

module.exports = sendMail;
