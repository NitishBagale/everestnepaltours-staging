const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { Op } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");
const CmsContent = require("../models/cms.model");
const PageSection = require("../models/pageSection.model");
const { buildLegacySectionsFromContent } = require("../src/lib/cmsSections");

const parseListArg = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseArgs = (argv) => {
  const args = {
    sections: [],
    slugs: [],
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--section" || token === "--sections") {
      args.sections.push(...parseListArg(argv[i + 1]));
      i += 1;
      continue;
    }

    if (token === "--slug" || token === "--slugs") {
      args.slugs.push(...parseListArg(argv[i + 1]));
      i += 1;
      continue;
    }

    if (token === "--force") {
      args.force = true;
    }
  }

  args.sections = Array.from(new Set(args.sections));
  args.slugs = Array.from(new Set(args.slugs));
  return args;
};

(async () => {
  try {
    const args = parseArgs(process.argv.slice(2));
    await postgres.authenticate();

    const where = {};
    if (args.sections.length || args.slugs.length) {
      where[Op.or] = [];
      if (args.sections.length) {
        where[Op.or].push({ section: { [Op.in]: args.sections } });
      }
      if (args.slugs.length) {
        where[Op.or].push({ slug: { [Op.in]: args.slugs } });
      }
    }

    const pages = await CmsContent.findAll({
      ...(Object.keys(where).length ? { where } : {}),
      order: [["sort_order", "ASC"], ["createdAt", "ASC"]],
    });

    let migratedCount = 0;
    let skippedExistingCount = 0;

    for (const page of pages) {
      const existingCount = await PageSection.count({ where: { page_id: page.id } });
      if (existingCount > 0 && !args.force) {
        skippedExistingCount += 1;
        continue;
      }

      if (existingCount > 0 && args.force) {
        await PageSection.destroy({ where: { page_id: page.id } });
      }

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
      console.info(
        `Migrated page sections for: ${page.section} (${page.id})${args.force && existingCount ? " [replaced]" : ""}`
      );
    }

    if (args.sections.length || args.slugs.length) {
      console.info(
        `Target filter applied. sections=${args.sections.length} slugs=${args.slugs.length} matched=${pages.length}`
      );
    }
    if (skippedExistingCount > 0 && !args.force) {
      console.info(
        `Skipped ${skippedExistingCount} page(s) because sections already exist. Re-run with --force to replace them.`
      );
    }
    console.info(`Done. Migrated ${migratedCount} page(s).`);
    process.exit(0);
  } catch (error) {
    console.error(
      "Migration failed:",
      error?.message || error?.original?.message || error?.parent?.message || error
    );
    if (error?.parent?.detail) console.error("Detail:", error.parent.detail);
    if (error?.stack) console.error(error.stack);
    process.exit(1);
  }
})();
