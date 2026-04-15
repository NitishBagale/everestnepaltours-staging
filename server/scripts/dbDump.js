const path = require("path");
const { spawnSync } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL or DIRECT_DATABASE_URL is required.");
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[-:TZ.]/g, "")
  .slice(0, 14);

const outputPath = path.join(
  __dirname,
  `../../live_db_backup_${timestamp}.sql`
);

const result = spawnSync(
  "pg_dump",
  [databaseUrl, "--no-owner", "--no-privileges", "--file", outputPath],
  { stdio: "inherit" }
);

if (result.error) {
  console.error(`Failed to start pg_dump: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
