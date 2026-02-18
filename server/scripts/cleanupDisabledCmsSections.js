const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { postgres } = require("../config/db/postgres/connectPostgres");
const PageSection = require("../models/pageSection.model");

const isDryRun = !process.argv.includes("--apply");

(async () => {
  try {
    await postgres.authenticate();

    const disabledRows = await PageSection.findAll({
      where: { is_enabled: false },
      attributes: ["id", "page_id", "type", "sort_order", "is_enabled"],
      order: [["page_id", "ASC"], ["sort_order", "ASC"]],
    });

    if (disabledRows.length === 0) {
      console.info("No disabled cms_sections rows found.");
      process.exit(0);
    }

    console.info(`Found ${disabledRows.length} disabled cms_sections row(s).`);

    if (isDryRun) {
      console.info("Dry run mode (no delete). Pass --apply to delete.");
      disabledRows.slice(0, 50).forEach((row) => {
        console.info(
          `- id=${row.id} page_id=${row.page_id} type=${row.type} sort_order=${row.sort_order}`
        );
      });
      if (disabledRows.length > 50) {
        console.info(`...and ${disabledRows.length - 50} more`);
      }
      process.exit(0);
    }

    const deletedCount = await PageSection.destroy({
      where: { is_enabled: false },
    });

    console.info(`Deleted ${deletedCount} disabled cms_sections row(s).`);
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error.message);
    process.exit(1);
  }
})();
