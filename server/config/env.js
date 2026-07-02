const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

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
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_EMAIL,
  SMTP_PASSWORD,
  SECRET_KEY,
  PORT,
  NODE_ENV,
};
