const path = require("path");
require("dotenv").config();

const { postgres } = require("../config/db/postgres/connectPostgres");
const { NODE_ENV } = require("../config/env");

const modelFiles = [
  "../models/setting.model",
  "../models/blog.model",
  "../models/review",
  "../models/admin/admin.model",
  "../models/admin/role.model",
  "../models/media",
  "../models/packageTour",
  "../models/traveller",
  "../models/seo",
  "../models/trip",
  "../models/cms.model",
  "../models/pageSection.model",
  "../models/category",
  "../models/team",
  "../models/comment",
];

const allowProdSync = process.env.ALLOW_DB_SYNC_IN_PROD === "true";
if (NODE_ENV === "production" && !allowProdSync) {
  console.error(
    "❌ Refusing to sync schema in production. Set ALLOW_DB_SYNC_IN_PROD=true to override."
  );
  process.exit(1);
}

modelFiles.forEach((modelPath) => {
  require(path.join(__dirname, modelPath));
});

(async () => {
  try {
    await postgres.authenticate();
    await postgres.sync({ alter: true });
    console.info("✅ Database schema synchronized.");
    await postgres.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Schema sync failed:", error.message);
    try {
      await postgres.close();
    } catch (closeError) {
      console.error("❌ Failed to close DB connection:", closeError.message);
    }
    process.exit(1);
  }
})();
