const { Client } = require("pg");

const SOURCE_DB = process.env.SOURCE_DB;
const TARGET_DB = process.env.TARGET_DB;

if (!SOURCE_DB || !TARGET_DB) {
  console.error("Missing SOURCE_DB or TARGET_DB");
  process.exit(1);
}

async function main() {
  const source = new Client({ connectionString: SOURCE_DB });
  const target = new Client({ connectionString: TARGET_DB });

  await source.connect();
  await target.connect();

  console.log("Connected to both databases.");

  const { rows } = await source.query(`
    SELECT
      id,
      name,
      designation,
      description,
      has_detail_page,
      "imageUrl",
      meta_title,
      meta_description,
      meta_keywords,
      sort_order,
      "createdAt",
      "updatedAt"
    FROM teams
    ORDER BY sort_order ASC
  `);

  console.log(`Found ${rows.length} team records in source.`);

  for (const team of rows) {
    await target.query(
      `
      INSERT INTO teams (
        id,
        name,
        designation,
        description,
        has_detail_page,
        "imageUrl",
        meta_title,
        meta_description,
        meta_keywords,
        sort_order,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      )
      ON CONFLICT (id) DO NOTHING
      `,
      [
        team.id,
        team.name,
        team.designation,
        team.description,
        team.has_detail_page,
        team.imageUrl,
        team.meta_title,
        team.meta_description,
        team.meta_keywords,
        team.sort_order,
        team.createdAt,
        team.updatedAt,
      ]
    );
  }

  console.log(`Copied ${rows.length} team records.`);

  await source.end();
  await target.end();
}

main().catch((err) => {
  console.error("COPY FAILED:");
  console.error(err);
  process.exit(1);
});