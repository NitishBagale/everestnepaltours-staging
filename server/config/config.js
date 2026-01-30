require("dotenv").config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const baseConfig = {
  dialect: "postgres",
};

const sslConfig =
  process.env.SSL === "true"
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    : {};

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
    ...sslConfig,
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
    ...sslConfig,
  },
};
