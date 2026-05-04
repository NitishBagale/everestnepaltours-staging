"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "DELETE FROM cms_sections WHERE type = 'bookingForm';"
    );

    const dropStatements = [
      'DROP TABLE IF EXISTS "Bookings" CASCADE;',
      "DROP TABLE IF EXISTS booking CASCADE;",
      'DROP TABLE IF EXISTS "ContactForms" CASCADE;',
      "DROP TABLE IF EXISTS contactforms CASCADE;",
      'DROP TABLE IF EXISTS "Enquiries" CASCADE;',
      "DROP TABLE IF EXISTS enquires CASCADE;",
      "DROP TABLE IF EXISTS wp_import_map CASCADE;",
    ];

    for (const statement of dropStatements) {
      await queryInterface.sequelize.query(statement);
    }
  },

  down: async () => {},
};
