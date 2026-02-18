'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF to_regclass('public.page_sections') IS NOT NULL
           AND to_regclass('public.cms_sections') IS NULL THEN
          ALTER TABLE "page_sections" RENAME TO "cms_sections";
        END IF;
      END
      $$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF to_regclass('public.cms_sections') IS NOT NULL
           AND to_regclass('public.page_sections') IS NULL THEN
          ALTER TABLE "cms_sections" RENAME TO "page_sections";
        END IF;
      END
      $$;
    `);
  },
};
