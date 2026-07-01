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
  "../models/travelInfo.model",
  "../models/onlineBooking",
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

const ensureCmsContentsIdConstraint = async () => {
  await postgres.query(`
    DO $$
    DECLARE
      cms_table regclass;
      id_attnum smallint;
      has_unique_constraint boolean;
    BEGIN
      SELECT to_regclass('"cms_contents"') INTO cms_table;
      IF cms_table IS NULL THEN
        RETURN;
      END IF;

      SELECT attnum
      INTO id_attnum
      FROM pg_attribute
      WHERE attrelid = cms_table
        AND attname = 'id'
        AND NOT attisdropped;

      IF id_attnum IS NULL THEN
        RETURN;
      END IF;

      SELECT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = cms_table
          AND contype IN ('p', 'u')
          AND conkey = ARRAY[id_attnum]
      )
      INTO has_unique_constraint;

      IF NOT has_unique_constraint THEN
        ALTER TABLE "cms_contents"
        ADD CONSTRAINT "cms_contents_id_unique" UNIQUE ("id");
      END IF;
    END
    $$;
  `);
};

(async () => {
  try {
    await postgres.authenticate();
    await ensureCmsContentsIdConstraint();
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
