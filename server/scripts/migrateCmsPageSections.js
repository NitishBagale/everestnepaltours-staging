const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { postgres } = require("../config/db/postgres/connectPostgres");
const CmsContent = require("../models/cms.model");
const PageSection = require("../models/pageSection.model");
const { buildLegacySectionsFromContent } = require("../src/lib/cmsSections");

(async () => {
  try {
    await postgres.authenticate();

    const pages = await CmsContent.findAll({
      order: [["sort_order", "ASC"], ["createdAt", "ASC"]],
    });

    let migratedCount = 0;

    for (const page of pages) {
      const exists = await PageSection.count({ where: { page_id: page.id } });
      if (exists > 0) continue;

      const legacySections = buildLegacySectionsFromContent(page.content || {});
      if (!legacySections.length) continue;

      await PageSection.bulkCreate(
        legacySections.map((section, index) => ({
          page_id: page.id,
          type: section.type,
          sort_order: index + 1,
          is_enabled: section.is_enabled,
          data: section.data,
        }))
      );

      migratedCount += 1;
      console.info(`Migrated page sections for: ${page.section} (${page.id})`);
    }

    console.info(`Done. Migrated ${migratedCount} page(s).`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
})();
