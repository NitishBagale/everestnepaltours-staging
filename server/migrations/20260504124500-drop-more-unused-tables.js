"use strict";

module.exports = {
  up: async (queryInterface) => {
    const dropStatements = [
      "DROP TABLE IF EXISTS paymentandcancellations CASCADE;",
      'DROP TABLE IF EXISTS "paymentandcancellations" CASCADE;',
      "DROP TABLE IF EXISTS opts CASCADE;",
      'DROP TABLE IF EXISTS "opts" CASCADE;',
      "DROP TABLE IF EXISTS otps CASCADE;",
      'DROP TABLE IF EXISTS "otps" CASCADE;',
      "DROP TABLE IF EXISTS ask_expert_messages CASCADE;",
      'DROP TABLE IF EXISTS "ask_expert_messages" CASCADE;',
    ];

    for (const statement of dropStatements) {
      await queryInterface.sequelize.query(statement);
    }
  },

  down: async () => {},
};
