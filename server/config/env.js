const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const DEFAULT_SMTP_CONFIG = {
  host: "mail.privateemail.com",
  port: "587",
  secure: "false",
  email: "info@everestvacations.com",
};

const envCandidates = [
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const {
  DATABASE_URL,
  DIRECT_DATABASE_URL,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  SSL,
  DB_DIALECT,
  JWT_SECRET,
  ADMIN_MAIL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_EMAIL,
  SMTP_PASSWORD,
  SECRET_KEY,
  PORT,
  NODE_ENV,
} = process.env;

const SMTP_CONFIG = {
  host: SMTP_HOST || DEFAULT_SMTP_CONFIG.host,
  port: Number(SMTP_PORT || DEFAULT_SMTP_CONFIG.port),
  secure: String(SMTP_SECURE || DEFAULT_SMTP_CONFIG.secure).toLowerCase() === "true",
  email: SMTP_EMAIL || DEFAULT_SMTP_CONFIG.email,
  password: SMTP_PASSWORD || "",
};

module.exports = {
  DATABASE_URL,
  DIRECT_DATABASE_URL,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  SSL,
  DB_DIALECT,
  JWT_SECRET,
  ADMIN_MAIL,
  SMTP_HOST: SMTP_CONFIG.host,
  SMTP_PORT: SMTP_CONFIG.port,
  SMTP_SECURE: SMTP_CONFIG.secure,
  SMTP_EMAIL: SMTP_CONFIG.email,
  SMTP_PASSWORD: SMTP_CONFIG.password,
  SMTP_CONFIG,
  SECRET_KEY,
  PORT,
  NODE_ENV,
};
