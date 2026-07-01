// db.js
const { Sequelize } = require("sequelize");
const {
  DATABASE_URL,
  DIRECT_DATABASE_URL,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_DIALECT,
  DB_PORT,
  SSL,
  NODE_ENV,
} = require("../../env");

// Create a single Sequelize instance
const connectionUrl = DATABASE_URL || DIRECT_DATABASE_URL;
const shouldUseSsl = SSL === "true" && !DATABASE_URL;

const baseOptions = {
  dialect: DB_DIALECT || "postgres",
  timezone: "+05:45",
  logging: false,
  pool: {
    max: 3, // Reduced to 3 connections (conservative for pooled DBs)
    min: 0,
    acquire: 30000,
    idle: 10000,
    evict: 5000,
  },
  retry: {
    max: 3,
  },
};

if (shouldUseSsl) {
  baseOptions.dialectOptions = {
    ssl: { require: true, rejectUnauthorized: false },
  };
}

const postgres = connectionUrl
  ? new Sequelize(connectionUrl, baseOptions)
  : new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
      ...baseOptions,
      host: DB_HOST,
      port: DB_PORT,
      dialectOptions:
        SSL === "true"
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : undefined,
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

const testPostgresConnection = async () => {
  try {
    await postgres.authenticate();
    console.info("✅ Database connection authenticated.");

    await ensureCmsContentsIdConstraint();
    console.info('✅ Ensured "cms_contents.id" has a unique constraint.');

    await postgres.query(`
      CREATE TABLE IF NOT EXISTS "online_bookings" (
        "id" SERIAL PRIMARY KEY,
        "bookingRef" VARCHAR(255) NOT NULL UNIQUE,
        "fullName" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "country" VARCHAR(255) DEFAULT '',
        "totalPax" INTEGER NOT NULL DEFAULT 1,
        "tripName" VARCHAR(255) NOT NULL,
        "tripDate" VARCHAR(255) NOT NULL,
        "depositAmount" DECIMAL(10,2) NOT NULL,
        "message" TEXT NOT NULL,
        "termsAccepted" BOOLEAN NOT NULL DEFAULT FALSE,
        "paymentMethod" VARCHAR(255) NOT NULL DEFAULT 'hbl',
        "paymentStatus" VARCHAR(255) NOT NULL DEFAULT 'initiated',
        "gatewayStatus" VARCHAR(255),
        "gatewayReference" VARCHAR(255),
        "paymentReceiptEmailSentAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.info('✅ Ensured "online_bookings" table exists.');

    await postgres.query(`
      ALTER TABLE "online_bookings"
      ADD COLUMN IF NOT EXISTS "paymentReceiptEmailSentAt" TIMESTAMP WITH TIME ZONE;
    `);
    console.info('✅ Ensured "online_bookings.paymentReceiptEmailSentAt" column exists.');

    const shouldSync =
      NODE_ENV !== "production" && process.env.ENABLE_DB_SYNC === "true";

    if (shouldSync) {
      await postgres.query(
        'ALTER TABLE "Categories" ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;'
      );
      console.info('✅ Ensured "Categories.sort_order" column exists.');

      await postgres.query(
        'ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "packageIds" INTEGER[] DEFAULT \'{}\'::INTEGER[];'
      );
      console.info('✅ Ensured "Reviews.packageIds" column exists.');

      await postgres.query(
        'ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "image" JSONB;'
      );
      console.info('✅ Ensured "Reviews.image" column exists.');

      await postgres.query(
        'ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER DEFAULT 0;'
      );
      console.info('✅ Ensured "Reviews.sort_order" column exists.');

      await postgres.query(
        'ALTER TABLE "Reviews" ALTER COLUMN "tourTitle" DROP NOT NULL;'
      );
      console.info('✅ Ensured "Reviews.tourTitle" is nullable.');

      await postgres.sync({ alter: true });
      console.info("👾 Database synced successfully.");
    } else {
      console.info("ℹ️ Skipping schema sync (set ENABLE_DB_SYNC=true to enable).");
    }
    
    // Log current connection info
    const pool = postgres.connectionManager.pool;
    console.info(`📊 Connection Pool - Max: ${pool.max}, Min: ${pool.min}, Current: ${pool.size}`);
  } catch (error) {
    console.error("❌ Unable to connect to Postgres:", error.message);
    console.error("💡 Tip: Your database may have too many active connections. Try:");
    console.error("   1. Close other apps/terminals connected to the database");
    console.error("   2. Wait a few minutes for idle connections to close");
    console.error("   3. Restart your database from Aiven dashboard");
  }
};

process.on("SIGINT", async () => {
  try {
    await postgres.close();
    console.log("💤 Database connection closed due to app termination.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error closing DB connection:", err);
    process.exit(1);
  }
});

module.exports = { postgres, testPostgresConnection };
