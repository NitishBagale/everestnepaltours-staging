#!/usr/bin/env bash
set -euo pipefail

# Optional overrides:
#   SQL_FILE=/absolute/path/dump.sql
#   WP_CONTENT_DIR=/absolute/path/wp-content
#   WP_SITE_URL=https://example.com
#   DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

SQL_FILE="${SQL_FILE:-/Users/pasangrumba/Documents/Work/JavaScript_Projects/everestnepaltours_wordpress/entour_naya_block.sql}"
WP_CONTENT_DIR="${WP_CONTENT_DIR:-/Users/pasangrumba/Documents/Work/JavaScript_Projects/everestnepaltours_wordpress/wp-content}"
WP_SITE_URL="${WP_SITE_URL:-https://everestnepaltours.com}"
DATABASE_URL="${DATABASE_URL:-postgresql://pasangrumba:postgres@localhost:5432/everest-holidays}"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "SQL file not found: $SQL_FILE" >&2
  exit 1
fi

if [[ ! -d "$WP_CONTENT_DIR" ]]; then
  echo "wp-content directory not found: $WP_CONTENT_DIR" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

DATABASE_URL="$DATABASE_URL" npm run etl:wordpress -- \
  --sql-file "$SQL_FILE" \
  --wp-content-dir "$WP_CONTENT_DIR" \
  --wp-site-url "$WP_SITE_URL" \
  --include-post-types "testimonial" \
  --post-type-map "testimonial=Reviews" \
  --verbose
