require("dotenv").config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const baseConfig = {
  dialect: "postgres",
};

const makeSslConfig = ({ production = false } = {}) => {
  const envSsl = (process.env.SSL || "").toLowerCase();
  const forceSslInProd = production && envSsl !== "false";
  const enabled = envSsl === "true" || forceSslInProd;

  if (!enabled) return {};

  return {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  };
};

module.exports = {
  development: {
    ...baseConfig,
    ...(hasDatabaseUrl
      ? { use_env_variable: "DATABASE_URL" }
      : {
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
        }),
    ...makeSslConfig({ production: false }),
  },
  production: {
    ...baseConfig,
    ...(hasDatabaseUrl
      ? { use_env_variable: "DATABASE_URL" }
      : {
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
        }),
    ...makeSslConfig({ production: true }),
  },
};
