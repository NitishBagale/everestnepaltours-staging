const dotenv = require("dotenv");
dotenv.config();

const {
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  SSL,
  DB_DIALECT,
  JWT_SECRET,
  ADMIN_MAIL,
  SMTP_EMAIL,
  SMTP_PASSWORD,
  SECRET_KEY,
  PORT,
} = process.env;

module.exports = {
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  SSL,
  DB_DIALECT,
  JWT_SECRET,
  ADMIN_MAIL,
  SMTP_EMAIL,
  SMTP_PASSWORD,
  SECRET_KEY,
  PORT,
};
