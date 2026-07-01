"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
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

    await queryInterface.sequelize.query(`
      ALTER TABLE "online_bookings"
      ADD COLUMN IF NOT EXISTS "paymentReceiptEmailSentAt" TIMESTAMP WITH TIME ZONE;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'DROP TABLE IF EXISTS "online_bookings" CASCADE;'
    );
  },
};
