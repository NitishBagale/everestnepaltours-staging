"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'DROP TABLE IF EXISTS "PaymentAndCancellationPolicies" CASCADE;'
    );
  },

  down: async () => {},
};
