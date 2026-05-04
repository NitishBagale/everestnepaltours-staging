const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { postgres } = require("../config/db/postgres/connectPostgres");

const DEFAULT_SITE_URL = "https://everestnepaltours.com";
const EXCLUDED_POST_TYPES = new Set([
  "attachment",
  "revision",
  "nav_menu_item",
  "acf-field",
  "acf-field-group",
  "wp_global_styles",
  "wp_navigation",
  "wp_template",
  "wp_template_part",
  "custom_css",
  "customize_changeset",
  "oembed_cache",
  "user_request",
]);
const VALID_TARGETS = new Set([
  "PackageTours",
  "Blogs",
  "travel_info",
  "Reviews",
  "cms_contents",
]);

function normalizeTargetName(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return null;
  if (value === "packagetours" || value === "package_tours" || value === "package") {
    return "PackageTours";
  }
  if (value === "blogs" || value === "blog") return "Blogs";
  if (value === "travel_info" || value === "travelinfo" || value === "travel-info") {
    return "travel_info";
  }
  if (value === "reviews" || value === "review") return "Reviews";
  if (value === "cms_content" || value === "cms_contents" || value === "cms") {
    return "cms_contents";
  }
  return null;
}

function parsePostTypeMap(raw) {
  if (!raw) return {};
  const mapping = {};
  const pairs = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const pair of pairs) {
    const [postTypeRaw, targetRaw] = pair.split("=");
    const postType = String(postTypeRaw || "").trim();
    const target = normalizeTargetName(targetRaw);
    if (!postType || !target || !VALID_TARGETS.has(target)) {
      throw new Error(
        `Invalid --post-type-map entry "${pair}". Use format post=Blogs,page=travel_info,trip=PackageTours,testimonial=Reviews,page=cms_contents`
      );
    }
    mapping[postType] = target;
  }
  return mapping;
}

function parseArgs(argv) {
  const args = {
    sqlFile: "",
    wpContentDir: "",
    wpSiteUrl: process.env.WP_SITE_URL || DEFAULT_SITE_URL,
    statusFilter: new Set(["publish"]),
    includePostTypes: null,
    postTypeMap: {},
    onlyPostIds: null,
    onlyPostTitles: null,
    onlyPostSlugs: null,
    takeoverCmsSlugConflicts: false,
    noTransaction: false,
    limit: null,
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--sql-file") args.sqlFile = argv[i + 1] || "";
    if (token === "--wp-content-dir") args.wpContentDir = argv[i + 1] || "";
    if (token === "--wp-site-url") args.wpSiteUrl = argv[i + 1] || "";
    if (token === "--status") {
      const raw = argv[i + 1] || "";
      args.statusFilter = new Set(
        raw
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      );
    }
    if (token === "--include-post-types") {
      const raw = argv[i + 1] || "";
      args.includePostTypes = new Set(
        raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
    if (token === "--post-type-map") {
      args.postTypeMap = parsePostTypeMap(argv[i + 1] || "");
    }
    if (token === "--only-post-id") {
      const raw = argv[i + 1] || "";
      const ids = raw
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0);
      args.onlyPostIds = ids.length ? new Set(ids) : null;
    }
    if (token === "--only-post-title") {
      const raw = argv[i + 1] || "";
      const titles = raw
        .split(",")
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean);
      args.onlyPostTitles = titles.length ? new Set(titles) : null;
    }
    if (token === "--only-post-slug") {
      const raw = argv[i + 1] || "";
      const slugs = raw
        .split(",")
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean);
      args.onlyPostSlugs = slugs.length ? new Set(slugs) : null;
    }
    if (token === "--takeover-cms-slug-conflicts") {
      args.takeoverCmsSlugConflicts = true;
    }
    if (token === "--limit") {
      const parsed = Number(argv[i + 1]);
      args.limit = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    if (token === "--dry-run") args.dryRun = true;
    if (token === "--verbose") args.verbose = true;
    if (token === "--no-transaction") args.noTransaction = true;
  }

  return args;
}

function usageAndExit() {
  console.error(
    [
      "Usage:",
      "  node scripts/importWordpressToPostgres.js \\",
      "    --sql-file /abs/path/wordpress_dump.sql \\",
      "    --wp-content-dir /abs/path/wp-content \\",
      "    [--wp-site-url https://everestnepaltours.com] \\",
      "    [--status publish,draft] \\",
      "    [--include-post-types post,page,trip] \\",
      "    [--post-type-map post=Blogs,page=travel_info,trip=PackageTours,testimonial=Reviews,page=cms_contents] \\",
      "    [--only-post-id 3194,2] [--only-post-title \"Title A,Title B\"] [--only-post-slug slug-a,slug-b] [--takeover-cms-slug-conflicts] [--no-transaction] \\",
      "    [--limit 200] [--dry-run] [--verbose]",
    ].join("\n")
  );
  process.exit(1);
}

function detectPrefix(sql) {
  const match = sql.match(/CREATE TABLE `([a-zA-Z0-9_]+)posts`/);
  if (!match) {
    throw new Error("Could not detect WordPress table prefix from SQL dump.");
  }
  return match[1];
}

function parseColumns(columnSql) {
  return columnSql
    .split(",")
    .map((part) => part.trim().replace(/`/g, ""))
    .filter(Boolean);
}

function unescapeSqlString(escapedChar) {
  if (escapedChar === "0") return "\0";
  if (escapedChar === "b") return "\b";
  if (escapedChar === "n") return "\n";
  if (escapedChar === "r") return "\r";
  if (escapedChar === "t") return "\t";
  if (escapedChar === "Z") return "\x1a";
  return escapedChar;
}

function readQuotedString(input, startIndex) {
  let i = startIndex + 1;
  let value = "";

  while (i < input.length) {
    const ch = input[i];

    if (ch === "\\") {
      const next = input[i + 1];
      if (next === undefined) {
        i += 1;
        break;
      }
      value += unescapeSqlString(next);
      i += 2;
      continue;
    }

    if (ch === "'") {
      if (input[i + 1] === "'") {
        value += "'";
        i += 2;
        continue;
      }
      i += 1;
      break;
    }

    value += ch;
    i += 1;
  }

  return { value, nextIndex: i };
}

function readRawToken(input, startIndex) {
  let i = startIndex;
  let token = "";
  while (i < input.length) {
    const ch = input[i];
    if (ch === "," || ch === ")") break;
    token += ch;
    i += 1;
  }
  return { token: token.trim(), nextIndex: i };
}

function convertRawToken(token) {
  if (token === "NULL") return null;
  if (/^-?\d+$/.test(token)) return Number(token);
  if (/^-?\d+\.\d+$/.test(token)) return Number(token);
  return token;
}

function parseValuesRows(valuesSql) {
  const rows = [];
  let i = 0;

  while (i < valuesSql.length) {
    const ch = valuesSql[i];
    if (ch === "(") {
      i += 1;
      const row = [];
      while (i < valuesSql.length) {
        while (/\s/.test(valuesSql[i])) i += 1;
        if (valuesSql[i] === "'") {
          const parsed = readQuotedString(valuesSql, i);
          row.push(parsed.value);
          i = parsed.nextIndex;
        } else {
          const parsed = readRawToken(valuesSql, i);
          row.push(convertRawToken(parsed.token));
          i = parsed.nextIndex;
        }

        while (/\s/.test(valuesSql[i])) i += 1;
        if (valuesSql[i] === ",") {
          i += 1;
          continue;
        }
        if (valuesSql[i] === ")") {
          i += 1;
          break;
        }
      }
      rows.push(row);
      continue;
    }
    i += 1;
  }

  return rows;
}

function findStatementEnd(sql, startIndex) {
  let i = startIndex;
  let inString = false;

  while (i < sql.length) {
    const ch = sql[i];
    if (inString) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          i += 2;
          continue;
        }
        inString = false;
      }
      i += 1;
      continue;
    }

    if (ch === "'") {
      inString = true;
      i += 1;
      continue;
    }
    if (ch === ";") return i;
    i += 1;
  }
  return -1;
}

function iterateInserts(sql, tableName, onRows) {
  const pattern = new RegExp(
    `INSERT INTO\\s+\`${tableName}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*`,
    "g"
  );
  let match = pattern.exec(sql);

  while (match) {
    const columns = parseColumns(match[1]);
    const valuesStart = pattern.lastIndex;
    const end = findStatementEnd(sql, valuesStart);
    if (end < 0) {
      throw new Error(`Failed to parse INSERT statement for table ${tableName}.`);
    }
    const valuesSql = sql.slice(valuesStart, end);
    const rows = parseValuesRows(valuesSql);
    onRows(columns, rows);
    pattern.lastIndex = end + 1;
    match = pattern.exec(sql);
  }
}

function toMapFromRow(columns, row) {
  const out = {};
  for (let i = 0; i < columns.length; i += 1) {
    out[columns[i]] = row[i];
  }
  return out;
}

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!["{", "["].includes(trimmed[0])) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function uniqueBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureSlug(rawSlug, fallbackTitle, postId) {
  const clean = slugify(rawSlug);
  if (clean) return clean;
  const fromTitle = slugify(fallbackTitle);
  if (fromTitle) return `${fromTitle}-${postId}`;
  return `wp-post-${postId}`;
}

function truncate(value, maxLen) {
  if (value === null || value === undefined) return value;
  const str = String(value);
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function stripHtml(input) {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#038;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function generateMetaTitle({ title, provided }) {
  if (provided && String(provided).trim()) return truncate(provided, 255);
  return truncate(`${title} | Everest Vacation`, 255);
}

function generateMetaDescription({ excerpt, content, provided }) {
  if (provided && String(provided).trim()) return truncate(provided, 320);
  const fromExcerpt = stripHtml(excerpt);
  if (fromExcerpt) return truncate(fromExcerpt, 320);
  const fromContent = stripHtml(content);
  return truncate(fromContent, 320);
}

function generateExcerpt({ excerpt, content }) {
  const fromExcerpt = stripHtml(excerpt);
  if (fromExcerpt) return truncate(fromExcerpt, 600);
  const fromContent = stripHtml(content);
  return truncate(fromContent, 600);
}

function pickMetaFirst(metaObj, keys) {
  for (const key of keys) {
    const value = metaObj?.[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value) && value.length) {
      const first = value.find((v) => v !== null && v !== undefined && String(v).trim());
      if (first !== undefined) return String(first).trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function pickMetaByAcfFieldKey(metaObj, fieldKey) {
  if (!metaObj || !fieldKey) return "";
  for (const [key, value] of Object.entries(metaObj)) {
    if (key.startsWith("_")) continue;
    const ref = metaObj[`_${key}`];
    if (typeof ref === "string" && ref.trim() === fieldKey) {
      if (typeof value === "string" && value.trim()) return value.trim();
      if (Array.isArray(value) && value.length) {
        const first = value.find((v) => v !== null && v !== undefined && String(v).trim());
        if (first !== undefined) return String(first).trim();
      }
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
  }
  return "";
}

function sanitizeAcfFieldToken(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  const cleaned = input.replace(/\bfield_[a-z0-9]+\b/gi, "").replace(/\s+/g, " ").trim();
  return cleaned;
}

function parseRating(rawValue) {
  if (rawValue === null || rawValue === undefined) return 5.0;
  const cleaned = String(rawValue).trim();
  if (!cleaned) return 5.0;
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  const parsed = match ? Number(match[0]) : Number.NaN;
  if (!Number.isFinite(parsed)) return 5.0;
  const clamped = Math.max(1, Math.min(5, parsed));
  return Math.round(clamped * 10) / 10;
}

function pickDateOnly(rawValue, fallbackDateString) {
  const candidate = String(rawValue || "").trim();
  if (/^\d{8}$/.test(candidate)) {
    const y = candidate.slice(0, 4);
    const m = candidate.slice(4, 6);
    const d = candidate.slice(6, 8);
    return `${y}-${m}-${d}`;
  }
  if (candidate) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return fallbackDateString;
}

function parseWpSerializedIds(rawValue) {
  if (rawValue === null || rawValue === undefined) return [];
  const str = String(rawValue).trim();
  if (!str) return [];
  const out = [];

  const quotedNumberRegex = /"(\d+)"/g;
  let match = quotedNumberRegex.exec(str);
  while (match) {
    out.push(Number(match[1]));
    match = quotedNumberRegex.exec(str);
  }
  if (out.length) return out;

  if (/^\d+(,\d+)*$/.test(str)) {
    return str
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v) && v > 0);
  }

  if (/^\d+$/.test(str)) return [Number(str)];
  return [];
}

function extractReviewWpPackageIds(allMeta) {
  const rawCandidates = [
    pickMetaFirst(allMeta, ["rh_review_packages"]),
    pickMetaFirst(allMeta, ["_rh_review_packages"]),
    pickMetaFirst(allMeta, ["review_packages", "package_ids", "package_id", "trip_id", "tour_id"]),
  ].filter(Boolean);
  return uniqueBy(
    rawCandidates
      .flatMap((raw) => parseWpSerializedIds(raw))
      .filter((v) => Number.isFinite(v) && v > 0),
    (v) => String(v)
  );
}

async function resolvePackageTourIdsFromWpIds({ wpPackageIds, tx }) {
  if (!Array.isArray(wpPackageIds) || !wpPackageIds.length) return [];
  const [rows] = await postgres.query(
    `SELECT target_id
     FROM wp_import_map
     WHERE source_system = 'wordpress'
       AND target_table = 'PackageTours'
       AND wp_post_id = ANY(CAST(:wpPostIds AS TEXT[]))`,
    {
      replacements: {
        wpPostIds: toPostgresTextArray(wpPackageIds.map((v) => String(v))),
      },
      transaction: tx,
    }
  );
  return uniqueBy(
    rows
      .map((row) => Number(row.target_id))
      .filter((v) => Number.isFinite(v) && v > 0),
    (v) => String(v)
  );
}

function findMatchingBrace(text, startIndex) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = startIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === "\"") inString = false;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractAcfBlockData(content) {
  const out = [];
  if (!content || typeof content !== "string") return out;
  const marker = "<!-- wp:acf/";
  let idx = content.indexOf(marker);
  while (idx >= 0) {
    const firstBrace = content.indexOf("{", idx);
    if (firstBrace < 0) break;
    const endBrace = findMatchingBrace(content, firstBrace);
    if (endBrace < 0) break;
    const jsonText = content.slice(firstBrace, endBrace + 1);
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && typeof parsed === "object" && parsed.data) {
        out.push({
          name: parsed.name || null,
          data: parsed.data,
        });
      }
    } catch {
      // ignore malformed block JSON
    }
    idx = content.indexOf(marker, endBrace + 1);
  }
  return out;
}

function listFromHtml(html) {
  if (!html) return [];
  const matches = [];
  const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m = regex.exec(String(html));
  while (m) {
    const cleaned = stripHtml(m[1]);
    if (cleaned) matches.push(cleaned);
    m = regex.exec(String(html));
  }
  return matches;
}

function extractBlockquoteHtml(html) {
  if (!html || typeof html !== "string") return "";
  const matches = [];
  const regex = /<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi;
  let m = regex.exec(html);
  while (m) {
    const chunk = String(m[0] || "").trim();
    if (chunk) matches.push(chunk);
    m = regex.exec(html);
  }
  return matches.join("\n");
}

function mapTripSectionsFromBlocks(content) {
  const blocks = extractAcfBlockData(content);
  const merged = {};
  const overviewSections = [];
  const halfContentSections = [];
  const galleryAttachmentIds = [];
  let highlightsHtml = "";
  let highlightsTitle = "";
  let itineraryTitle = "";
  const includeItemsSet = new Set();
  const excludeItemsSet = new Set();
  let includeNoteHtml = "";
  let excludeNoteHtml = "";

  for (const block of blocks) {
    const data = block.data || {};
    const blockName = String(block.name || "");
    Object.assign(merged, block.data || {});

    if (
      blockName.includes("starter-kit-overview") ||
      data.ws_trip_overview_title ||
      data.ws_trip_overview_description
    ) {
      const title = stripHtml(data.ws_trip_overview_title || "");
      const description = data.ws_trip_overview_description || "";
      if (title || stripHtml(description)) {
        overviewSections.push({ title, description });
      }
    }

    if (
      blockName.includes("half-content-half-image") ||
      data.starter_kit_hchi_description ||
      data.starter_kit_hchi_image
    ) {
      const title = stripHtml(data.starter_kit_hchi_title || "");
      const description = data.starter_kit_hchi_description || "";
      const imageId =
        Number.isFinite(Number(data.starter_kit_hchi_image)) &&
        Number(data.starter_kit_hchi_image) > 0
          ? Number(data.starter_kit_hchi_image)
          : null;
      if (title || stripHtml(description) || imageId) {
        halfContentSections.push({ title, description, imageId });
      }
    }

    if (data.ws_trip_block_highlights && !highlightsHtml) {
      highlightsHtml = String(data.ws_trip_block_highlights || "");
    }
    if (data.ws_trip_fact_short_description && !highlightsTitle) {
      highlightsTitle = stripHtml(data.ws_trip_fact_short_description || "");
    }

    if (
      blockName.includes("include-exclude") ||
      data.ws_trip_include_description ||
      data.ws_trip_exclude_description
    ) {
      const mode = String(data.ws_select_content_type || "").toLowerCase();
      const includeList = listFromHtml(data.ws_trip_include_description || "");
      const excludeList = listFromHtml(data.ws_trip_exclude_description || "");
      const includeNote = extractBlockquoteHtml(data.ws_trip_include_description || "");
      const excludeNote = extractBlockquoteHtml(data.ws_trip_exclude_description || "");
      const useInclude =
        mode.includes("included") || mode.includes("include") || !mode;
      const useExclude = mode.includes("exclude");

      if (useInclude) {
        includeList.forEach((item) => includeItemsSet.add(item));
        if (!includeNoteHtml && includeNote) includeNoteHtml = includeNote;
      }
      if (useExclude || (!useInclude && excludeList.length)) {
        excludeList.forEach((item) => excludeItemsSet.add(item));
        if (!excludeNoteHtml && excludeNote) excludeNoteHtml = excludeNote;
      }
      if (!highlightsTitle && data.ws_trip_include_title) {
        highlightsTitle = stripHtml(data.ws_trip_include_title || "");
      }
    }

    if (
      (!itineraryTitle && blockName.includes("detailed-itineray")) ||
      (!itineraryTitle && blockName.includes("detailed-itinerary"))
    ) {
      itineraryTitle = stripHtml(data.starter_kit_section_title || data.ws_trip_section_title || "");
    }

    if (Array.isArray(data.ws_trip_galleries)) {
      data.ws_trip_galleries.forEach((item) => {
        const id = Number(item);
        if (Number.isFinite(id) && id > 0) galleryAttachmentIds.push(id);
      });
    }
  }

  const overviewPrimary =
    halfContentSections[0] || overviewSections[0] || { title: "", description: "" };
  const overview = {
    title: overviewPrimary.title || stripHtml(merged.ws_trip_overview_title || ""),
    description: overviewPrimary.description || merged.ws_trip_overview_description || "",
  };

  const tripFacts = {
    short_description: stripHtml(merged.ws_trip_fact_short_description || ""),
    trip_grading: stripHtml(merged.ws_block_trip_grading || ""),
    max_elevation: stripHtml(merged.ws_block_max_elevation || ""),
    attractions: stripHtml(merged.ws_block_attractions || ""),
    best_season: stripHtml(merged.ws_block_best_season || ""),
    meals: stripHtml(merged.ws_block_meals || ""),
    accommodation: stripHtml(merged.ws_block_accommodation || ""),
    transportation: stripHtml(merged.ws_block_transportation || ""),
    start_end: stripHtml(merged.ws_block_start_end || ""),
  };

  const itineraryMap = new Map();
  for (const [k, v] of Object.entries(merged)) {
    let mm = k.match(/^ws_trip_information_list_(\d+)_ws_itinerary_title$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!itineraryMap.has(i)) itineraryMap.set(i, {});
      itineraryMap.get(i).title = stripHtml(v);
      continue;
    }
    mm = k.match(/^ws_trip_information_list_(\d+)_ws_itinerary_description$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!itineraryMap.has(i)) itineraryMap.set(i, {});
      itineraryMap.get(i).richText = v || "";
      continue;
    }
    mm = k.match(/^ws_trip_information_list_(\d+)_ws_itinerary_Elevation$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!itineraryMap.has(i)) itineraryMap.set(i, {});
      itineraryMap.get(i).elevation = stripHtml(v);
      continue;
    }
    mm = k.match(/^ws_trip_information_list_(\d+)_ws_itinerary_hotel$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!itineraryMap.has(i)) itineraryMap.set(i, {});
      itineraryMap.get(i).accommodation = stripHtml(v);
      continue;
    }
    mm = k.match(/^ws_trip_information_list_(\d+)_ws_itinerary_food$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!itineraryMap.has(i)) itineraryMap.set(i, {});
      itineraryMap.get(i).meal = stripHtml(v);
      continue;
    }
    mm = k.match(/^ws_trip_information_list_(\d+)_ws_itinerary_duration$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!itineraryMap.has(i)) itineraryMap.set(i, {});
      itineraryMap.get(i).driveTime = stripHtml(v);
      continue;
    }
    mm = k.match(/^ws_trip_information_list_(\d+)_di_days$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!itineraryMap.has(i)) itineraryMap.set(i, {});
      const dayNum = Number(v);
      itineraryMap.get(i).day = Number.isFinite(dayNum) ? dayNum : i + 1;
    }
  }
  const itinerary = Array.from(itineraryMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([idx, item]) => ({
      day: item.day || idx + 1,
      title: item.title || `Day ${idx + 1}`,
      richText: item.richText || "",
      elevation: item.elevation || "",
      accommodation: item.accommodation || "",
      meal: item.meal || "",
      driveTime: item.driveTime || "",
    }));

  const faqMap = new Map();
  for (const [k, v] of Object.entries(merged)) {
    let mm = k.match(/^ws_trip_faqs_lists_(\d+)_faq_title$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!faqMap.has(i)) faqMap.set(i, {});
      faqMap.get(i).question = stripHtml(v);
      continue;
    }
    mm = k.match(/^ws_trip_faqs_lists_(\d+)_faqs_description$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!faqMap.has(i)) faqMap.set(i, {});
      faqMap.get(i).answer = v || "";
    }
  }
  const faq = Array.from(faqMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, item]) => ({
      question: item.question || "",
      answer: item.answer || "",
    }))
    .filter((item) => item.question || stripHtml(item.answer));

  const infoMap = new Map();
  for (const [k, v] of Object.entries(merged)) {
    let mm = k.match(/^ws_trip_information_list_(\d+)_ws_information_title$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!infoMap.has(i)) infoMap.set(i, {});
      infoMap.get(i).title = stripHtml(v);
      continue;
    }
    mm = k.match(/^ws_trip_information_list_(\d+)_ws_information_description$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!infoMap.has(i)) infoMap.set(i, {});
      infoMap.get(i).description = v || "";
    }
  }
  const additionalInfo = Array.from(infoMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, item], idx) => ({
      id: idx + 1,
      title: item.title || "",
      type: "paragraph",
      description: item.description || "",
      content: item.description ? [item.description] : [],
    }))
    .filter((item) => item.title || stripHtml(item.description));

  const whyTravelMap = new Map();
  for (const [k, v] of Object.entries(merged)) {
    const mm = k.match(/^ws_why_with_us_lists_(\d+)_title$/);
    if (mm) {
      const i = Number(mm[1]);
      if (!whyTravelMap.has(i)) whyTravelMap.set(i, {});
      whyTravelMap.get(i).title = stripHtml(v);
    }
  }
  const whyTravelWithUs = Array.from(whyTravelMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, item]) => item.title || "")
    .filter(Boolean);

  const includeItems = includeItemsSet.size
    ? Array.from(includeItemsSet)
    : listFromHtml(merged.ws_trip_include_description || "");
  const excludeItems = excludeItemsSet.size
    ? Array.from(excludeItemsSet)
    : listFromHtml(merged.ws_trip_exclude_description || "");

  const additionalInfoFromOverview = overviewSections
    .map((item, idx) => ({
      id: `overview-${idx + 1}`,
      title: item.title || "",
      type: "paragraph",
      description: item.description || "",
      content: item.description ? [item.description] : [],
    }))
    .filter((item) => item.title || stripHtml(item.description));

  const relatedTripFacts = {
    max_elevation: tripFacts.max_elevation || "",
    attractions: tripFacts.attractions || "",
    best_season: tripFacts.best_season || "",
    meals: tripFacts.meals || "",
    accommodation: tripFacts.accommodation || "",
    transportation: tripFacts.transportation || "",
    start_end: tripFacts.start_end || "",
  };

  return {
    overview,
    tripFacts,
    highlightsHtml,
    itinerary,
    faq,
    additionalInfo,
    additionalInfoFromOverview,
    whyTravelWithUs,
    includeItems,
    excludeItems,
    includeNoteHtml,
    excludeNoteHtml,
    galleryAttachmentIds: uniqueBy(galleryAttachmentIds, (v) => String(v)),
    overviewImageAttachmentId: halfContentSections[0]?.imageId || null,
    relatedTripFacts,
    sectionTitles: {
      itineraryTitle: itineraryTitle || stripHtml(merged.ws_trip_section_title || ""),
      faqTitle: stripHtml(merged.ws_trip_faqs_section_title || ""),
      highlightsTitle: highlightsTitle || stripHtml(merged.ws_trip_include_title || ""),
    },
    raw: merged,
  };
}

function toPostgresTextArray(values) {
  if (!Array.isArray(values) || !values.length) return "{}";
  return `{${values
    .map((value) =>
      `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
    )
    .join(",")}}`;
}

function formatDbError(error) {
  const parent = error?.parent || error?.original || {};
  const parts = [
    parent.message || error?.message || "Unknown error",
    parent.code ? `code=${parent.code}` : null,
    parent.constraint ? `constraint=${parent.constraint}` : null,
    parent.detail ? `detail=${parent.detail}` : null,
  ].filter(Boolean);
  return parts.join(" | ");
}

function extractImageUrlsFromHtml(html) {
  if (!html || typeof html !== "string") return [];
  const urls = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match = regex.exec(html);
  while (match) {
    urls.push(match[1]);
    match = regex.exec(html);
  }
  return uniqueBy(urls, (v) => v);
}

function stripWpComments(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<!--\s*wp:[\s\S]*?-->/gi, "")
    .replace(/<!--\s*\/wp:[\s\S]*?-->/gi, "")
    .trim();
}

function isLikelyAcfFieldToken(value) {
  return /^field_[a-z0-9]+$/i.test(String(value || "").trim());
}

function cleanRichTextOrEmpty(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (isLikelyAcfFieldToken(trimmed)) return "";
  return trimmed;
}

function cleanPlainTextOrEmpty(value) {
  const text = stripHtml(value || "");
  if (!text) return "";
  if (isLikelyAcfFieldToken(text)) return "";
  return text;
}

function firstValidImageUrlFromAny(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const str = value.trim();
    if (!str || isLikelyAcfFieldToken(str)) return "";
    if (/^https?:\/\//i.test(str)) return str;
    const htmlImgs = extractImageUrlsFromHtml(str);
    if (htmlImgs.length) return htmlImgs[0];
    return "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstValidImageUrlFromAny(item);
      if (found) return found;
    }
    return "";
  }
  if (typeof value === "object") {
    return (
      firstValidImageUrlFromAny(value.url) ||
      firstValidImageUrlFromAny(value.guid) ||
      firstValidImageUrlFromAny(value.src) ||
      ""
    );
  }
  return "";
}

function extractGalleryUrlsFromBlockData(data, attachmentUrlFromId) {
  const urls = [];
  if (!data || typeof data !== "object") return urls;

  for (const [key, rawValue] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (!lowerKey.includes("gallery")) continue;

    if (typeof rawValue === "string") {
      extractImageUrlsFromHtml(rawValue).forEach((url) => urls.push(url));
      parseWpSerializedIds(rawValue).forEach((id) => {
        const resolved = typeof attachmentUrlFromId === "function" ? attachmentUrlFromId(id) : null;
        if (resolved) urls.push(resolved);
      });
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (Number.isFinite(Number(item)) && Number(item) > 0) {
          const resolved =
            typeof attachmentUrlFromId === "function" ? attachmentUrlFromId(Number(item)) : null;
          if (resolved) urls.push(resolved);
          continue;
        }
        const direct = firstValidImageUrlFromAny(item);
        if (direct) urls.push(direct);
      }
      continue;
    }

    const direct = firstValidImageUrlFromAny(rawValue);
    if (direct) urls.push(direct);
  }

  return uniqueBy(urls.filter(Boolean), (v) => v);
}

function extractFaqItemsFromBlockData(data) {
  if (!data || typeof data !== "object") return [];

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      const items = value
        .map((item) => ({
          question: cleanPlainTextOrEmpty(item?.question || item?.title || item?.faq_title),
          answer: cleanRichTextOrEmpty(item?.answer || item?.description || item?.faqs_description),
        }))
        .filter((item) => item.question || stripHtml(item.answer));
      if (items.length) return items;
    }
  }

  const faqMap = new Map();
  for (const [k, v] of Object.entries(data)) {
    let m = k.match(/(?:^|_)(\d+)_.*(?:faq.*title|question)$/i);
    if (m) {
      const i = Number(m[1]);
      if (!faqMap.has(i)) faqMap.set(i, {});
      faqMap.get(i).question = cleanPlainTextOrEmpty(v);
      continue;
    }
    m = k.match(/(?:^|_)(\d+)_.*(?:faq.*description|faqs_description|answer)$/i);
    if (m) {
      const i = Number(m[1]);
      if (!faqMap.has(i)) faqMap.set(i, {});
      faqMap.get(i).answer = cleanRichTextOrEmpty(v);
    }
  }

  return Array.from(faqMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, item]) => ({
      question: item.question || "",
      answer: item.answer || "",
    }))
    .filter((item) => item.question || stripHtml(item.answer));
}

function extractRelatedInfoItemsFromBlockData(data) {
  if (!data || typeof data !== "object") return [];
  const map = new Map();

  for (const [k, v] of Object.entries(data)) {
    let m = k.match(/(?:related|information).*_(\d+)_.*(?:title|heading)$/i);
    if (m) {
      const i = Number(m[1]);
      if (!map.has(i)) map.set(i, {});
      map.get(i).title = cleanPlainTextOrEmpty(v);
      continue;
    }
    m = k.match(/(?:related|information).*_(\d+)_.*(?:description|content|details)$/i);
    if (m) {
      const i = Number(m[1]);
      if (!map.has(i)) map.set(i, {});
      map.get(i).description = cleanRichTextOrEmpty(v);
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, item]) => ({
      id: crypto.randomUUID(),
      title: item.title || "",
      description: item.description || "",
    }))
    .filter((item) => item.title || stripHtml(item.description));
}

function extractRepeatableItemsFromBlockData(data, featuredImage, attachmentUrlFromId) {
  if (!data || typeof data !== "object") return [];

  const directTitle = cleanPlainTextOrEmpty(
    data.starter_kit_hchi_title ||
      data.starter_kit_mctaim_cd_title ||
      data.starter_kit_mctaim_cd_subtitle ||
      data.ws_trip_overview_title ||
      data.ws_trip_fact_short_description ||
      data.title ||
      data.section_title ||
      data.heading
  );
  const directDescription = cleanRichTextOrEmpty(
    data.starter_kit_hchi_description ||
      data.starter_kit_mctaim_cd_description ||
      data.ws_trip_overview_description ||
      data.ws_trip_block_highlights ||
      data.description ||
      data.content ||
      data.details
  );

  let directImage = "";
  if (Number.isFinite(Number(data.starter_kit_hchi_image)) && Number(data.starter_kit_hchi_image) > 0) {
    directImage =
      typeof attachmentUrlFromId === "function"
        ? attachmentUrlFromId(Number(data.starter_kit_hchi_image)) || ""
        : "";
  }
  if (!directImage) {
    if (
      Number.isFinite(Number(data.starter_kit_mctaim_cd_image)) &&
      Number(data.starter_kit_mctaim_cd_image) > 0
    ) {
      directImage =
        typeof attachmentUrlFromId === "function"
          ? attachmentUrlFromId(Number(data.starter_kit_mctaim_cd_image)) || ""
          : "";
    }
  }
  if (!directImage) {
    directImage =
      firstValidImageUrlFromAny(data.image) ||
      firstValidImageUrlFromAny(data.image_url) ||
      firstValidImageUrlFromAny(data.photo) ||
      "";
  }
  const explicitImagePosition = String(
    data.starter_kit_hchi_image_position || data.starter_kit_mctaim_choose_img_position || ""
  )
    .toLowerCase()
    .trim();
  const imagePosition =
    explicitImagePosition.includes("right")
      ? "right-50"
      : explicitImagePosition.includes("left")
      ? "left-50"
      : directImage || featuredImage
      ? "right-50"
      : "left-50";
  const imageCaption = cleanPlainTextOrEmpty(
    data.starter_kit_mctaim_cd_img_desc || data.image_caption || data.caption
  );

  const items = [];
  if (directTitle || stripHtml(directDescription) || directImage) {
    items.push({
      id: crypto.randomUUID(),
      title: directTitle,
      description: directDescription,
      image: directImage || featuredImage || "",
      imageCaption,
      background: "white",
      imagePosition,
    });
  }

  const repeaterMap = new Map();
  for (const [k, v] of Object.entries(data)) {
    let m = k.match(/(?:^|_)(\d+)_.*(?:title|heading)$/i);
    if (m) {
      const i = Number(m[1]);
      if (!repeaterMap.has(i)) repeaterMap.set(i, {});
      repeaterMap.get(i).title = cleanPlainTextOrEmpty(v);
      continue;
    }
    m = k.match(/(?:^|_)(\d+)_.*(?:description|content|details)$/i);
    if (m) {
      const i = Number(m[1]);
      if (!repeaterMap.has(i)) repeaterMap.set(i, {});
      repeaterMap.get(i).description = cleanRichTextOrEmpty(v);
      continue;
    }
    m = k.match(/(?:^|_)(\d+)_.*(?:image|photo)$/i);
    if (m) {
      const i = Number(m[1]);
      if (!repeaterMap.has(i)) repeaterMap.set(i, {});
      let imageUrl = "";
      if (Number.isFinite(Number(v)) && Number(v) > 0) {
        imageUrl =
          typeof attachmentUrlFromId === "function" ? attachmentUrlFromId(Number(v)) || "" : "";
      }
      if (!imageUrl) imageUrl = firstValidImageUrlFromAny(v);
      if (imageUrl) repeaterMap.get(i).image = imageUrl;
    }
  }

  const repeaterItems = Array.from(repeaterMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, item]) => ({
      id: crypto.randomUUID(),
      title: item.title || "",
      description: item.description || "",
      image: item.image || "",
      imageCaption: "",
      background: "white",
      imagePosition: item.image ? "right-50" : "left-50",
    }))
    .filter((item) => item.title || stripHtml(item.description) || item.image);

  return uniqueBy([...items, ...repeaterItems], (item) =>
    [item.title, stripHtml(item.description), item.image].join("|")
  );
}

function splitHtmlIntoRepeatableItems({ html, title, featuredImage }) {
  const cleanedHtml = stripWpComments(html || "");
  if (!stripHtml(cleanedHtml)) return [];

  const parts = cleanedHtml
    .split(/(?=<h[2-4][^>]*>)/i)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const items = [];
  if (parts.length > 1) {
    for (const part of parts) {
      const headingMatch = part.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
      const itemTitle = cleanPlainTextOrEmpty(headingMatch ? headingMatch[1] : "");
      const itemDescription = part;
      if (!itemTitle && !stripHtml(itemDescription)) continue;
      const partImage = extractImageUrlsFromHtml(part)[0] || "";
      items.push({
        id: crypto.randomUUID(),
        title: itemTitle,
        description: itemDescription,
        image: partImage || "",
        imageCaption: "",
        background: "white",
        imagePosition: partImage ? "right-50" : "left-50",
      });
    }
  }

  if (!items.length) {
    items.push({
      id: crypto.randomUUID(),
      title: cleanPlainTextOrEmpty(title || ""),
      description: cleanedHtml,
      image: featuredImage || "",
      imageCaption: "",
      background: "white",
      imagePosition: featuredImage ? "right-50" : "left-50",
    });
  }

  return items.filter((item) => item.title || stripHtml(item.description) || item.image);
}

function parseWpDate(raw, rawGmt) {
  if (typeof rawGmt === "string" && rawGmt && !rawGmt.startsWith("0000-00-00")) {
    const d = new Date(`${rawGmt.replace(" ", "T")}Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof raw === "string" && raw && !raw.startsWith("0000-00-00")) {
    const d = new Date(raw.replace(" ", "T"));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function buildAttachmentUrl({ attachedFile, guid, wpSiteUrl }) {
  if (attachedFile && typeof attachedFile === "string") {
    return `${wpSiteUrl.replace(/\/$/, "")}/wp-content/uploads/${attachedFile.replace(
      /^\//,
      ""
    )}`;
  }
  return guid || null;
}

function buildAttachmentCaption({ attachmentPost, attachmentMeta, fallbackTitle }) {
  const explicitCaption =
    (attachmentPost && typeof attachmentPost.post_excerpt === "string"
      ? attachmentPost.post_excerpt
      : "") || "";
  const attachmentDescription =
    (attachmentPost && typeof attachmentPost.post_content === "string"
      ? attachmentPost.post_content
      : "") || "";
  const altText =
    Array.isArray(attachmentMeta?._wp_attachment_image_alt) &&
    attachmentMeta._wp_attachment_image_alt.length
      ? String(attachmentMeta._wp_attachment_image_alt[0] || "")
      : "";
  const attachmentTitle =
    attachmentPost && typeof attachmentPost.post_title === "string"
      ? attachmentPost.post_title
      : "";

  const caption = sanitizeAcfFieldToken(
    stripHtml(explicitCaption) ||
      stripHtml(attachmentDescription) ||
      stripHtml(altText) ||
      stripHtml(attachmentTitle) ||
      stripHtml(fallbackTitle) ||
      ""
  );
  return truncate(caption, 255);
}

function buildAttachmentAltText({ attachmentPost, attachmentMeta, attachedFile, fallbackTitle }) {
  const explicitAlt =
    Array.isArray(attachmentMeta?._wp_attachment_image_alt) &&
    attachmentMeta._wp_attachment_image_alt.length
      ? String(attachmentMeta._wp_attachment_image_alt[0] || "")
      : "";
  const attachmentTitle =
    attachmentPost && typeof attachmentPost.post_title === "string"
      ? attachmentPost.post_title
      : "";
  const attachmentCaption =
    attachmentPost && typeof attachmentPost.post_excerpt === "string"
      ? attachmentPost.post_excerpt
      : "";
  const fileLabel = attachedFile
    ? path
        .basename(String(attachedFile))
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

  const alt = sanitizeAcfFieldToken(
    stripHtml(explicitAlt) ||
      stripHtml(attachmentTitle) ||
      stripHtml(attachmentCaption) ||
      stripHtml(fileLabel) ||
      stripHtml(fallbackTitle) ||
      "Tour image"
  );
  return truncate(alt, 255);
}

function normalizeWpContentPath(wpContentDir, attachedFile) {
  if (!wpContentDir || !attachedFile) return null;
  return path.join(wpContentDir, "uploads", attachedFile);
}

function shouldImportPost(post, args) {
  if (!post || !post.post_type) return false;
  const status = String(post.post_status || "").toLowerCase();
  if (args.statusFilter.size && !args.statusFilter.has(status)) return false;
  if (args.includePostTypes) return args.includePostTypes.has(post.post_type);
  return !EXCLUDED_POST_TYPES.has(post.post_type);
}

function makeMetaObjects(metaValues) {
  const allMeta = {};
  const acf = {};

  for (const [key, values] of Object.entries(metaValues || {})) {
    const parsedValues = values.map((v) => parseMaybeJson(v));
    allMeta[key] = parsedValues.length <= 1 ? parsedValues[0] : parsedValues;
  }

  for (const [key, values] of Object.entries(metaValues || {})) {
    if (key.startsWith("_")) continue;
    const fieldKey = `_${key}`;
    const likelyAcfField =
      Array.isArray(metaValues[fieldKey]) &&
      String(metaValues[fieldKey][0] || "").startsWith("field_");
    if (!likelyAcfField) continue;
    acf[key] = values.length <= 1 ? parseMaybeJson(values[0]) : values.map(parseMaybeJson);
  }

  return { allMeta, acf };
}

function taxonomyBundleForPost(postId, relationshipsByPostId, termTaxonomyById, termsById) {
  const rels = relationshipsByPostId.get(postId) || [];
  const taxonomy = {};

  for (const rel of rels) {
    const tt = termTaxonomyById.get(rel.term_taxonomy_id);
    if (!tt) continue;
    const term = termsById.get(tt.term_id);
    if (!term) continue;

    if (!taxonomy[tt.taxonomy]) taxonomy[tt.taxonomy] = [];
    taxonomy[tt.taxonomy].push({
      termId: term.term_id,
      name: term.name,
      slug: term.slug,
      parentTermId: tt.parent || 0,
      description: tt.description || "",
      termOrder: rel.term_order || 0,
    });
  }

  for (const key of Object.keys(taxonomy)) {
    taxonomy[key] = uniqueBy(taxonomy[key], (item) => `${item.termId}:${item.slug}`);
  }

  return taxonomy;
}

async function ensureCategory(term, tx, cache) {
  const cacheKey = `${term.slug}::${term.name}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const [bySlug] = await postgres.query(
    `SELECT id, slug, name FROM "Categories" WHERE slug = :slug LIMIT 1`,
    { replacements: { slug: term.slug }, transaction: tx }
  );
  if (bySlug.length) {
    cache.set(cacheKey, bySlug[0].id);
    return bySlug[0].id;
  }

  const [byName] = await postgres.query(
    `SELECT id, slug, name FROM "Categories" WHERE name = :name LIMIT 1`,
    { replacements: { name: term.name }, transaction: tx }
  );
  if (byName.length) {
    if (!byName[0].slug && term.slug) {
      await postgres.query(
        `UPDATE "Categories" SET slug = :slug, "updatedAt" = NOW() WHERE id = :id`,
        {
          replacements: { slug: term.slug, id: byName[0].id },
          transaction: tx,
        }
      );
    }
    cache.set(cacheKey, byName[0].id);
    return byName[0].id;
  }

  const [created] = await postgres.query(
    `INSERT INTO "Categories" (name, slug, sort_order, "createdAt", "updatedAt")
     VALUES (:name, :slug, 0, NOW(), NOW())
     RETURNING id`,
    {
      replacements: { name: term.name, slug: term.slug || null },
      transaction: tx,
    }
  );
  const createdId = created[0].id;
  cache.set(cacheKey, createdId);
  return createdId;
}

function chooseTargetTable(postType, args) {
  if (postType === "testimonial" && !args.postTypeMap[postType]) return "Reviews";
  if (postType === "page" && !args.postTypeMap[postType]) return "cms_contents";
  return args.postTypeMap[postType] || "PackageTours";
}

function pushCounter(counters, key, targetTable) {
  counters[key] += 1;
  if (!counters.byTarget[targetTable]) {
    counters.byTarget[targetTable] = { inserted: 0, updated: 0, skipped: 0 };
  }
  if (key === "inserted") counters.byTarget[targetTable].inserted += 1;
  if (key === "updatedByWpId" || key === "updatedBySlug") {
    counters.byTarget[targetTable].updated += 1;
  }
  if (key === "skippedConflicts") counters.byTarget[targetTable].skipped += 1;
}

async function ensureImportMapTable(tx) {
  await postgres.query(
    `CREATE TABLE IF NOT EXISTS wp_import_map (
      id BIGSERIAL PRIMARY KEY,
      source_system TEXT NOT NULL,
      wp_post_id TEXT NOT NULL,
      target_table TEXT NOT NULL,
      target_id TEXT NOT NULL,
      slug TEXT,
      post_type TEXT,
      acf JSONB,
      meta JSONB,
      taxonomy JSONB,
      featured_image JSONB,
      source_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (source_system, wp_post_id, target_table),
      UNIQUE (target_table, target_id)
    )`,
    { transaction: tx }
  );
}

async function getImportMapByWpId({ wpPostId, targetTable, tx }) {
  const [rows] = await postgres.query(
    `SELECT * FROM wp_import_map
     WHERE source_system = 'wordpress'
       AND wp_post_id = :wpPostId
       AND target_table = :targetTable
     LIMIT 1`,
    { replacements: { wpPostId, targetTable }, transaction: tx }
  );
  return rows[0] || null;
}

async function getImportMapByTarget({ targetTable, targetId, tx }) {
  const [rows] = await postgres.query(
    `SELECT * FROM wp_import_map
     WHERE target_table = :targetTable
       AND target_id = :targetId
     LIMIT 1`,
    { replacements: { targetTable, targetId: String(targetId) }, transaction: tx }
  );
  return rows[0] || null;
}

async function targetRowExistsById({ targetTable, targetId, tx }) {
  if (!targetId) return false;

  if (targetTable === "cms_contents") {
    const [rows] = await postgres.query(
      `SELECT id FROM cms_contents WHERE id = :id LIMIT 1`,
      { replacements: { id: String(targetId) }, transaction: tx }
    );
    return !!rows[0];
  }

  return true;
}

async function upsertImportMap({
  wpPostId,
  targetTable,
  targetId,
  slug,
  postType,
  acf,
  meta,
  taxonomy,
  featuredImage,
  sourcePayload,
  tx,
  dryRun,
}) {
  if (dryRun) return;
  await postgres.query(
    `INSERT INTO wp_import_map (
      source_system, wp_post_id, target_table, target_id, slug, post_type,
      acf, meta, taxonomy, featured_image, source_payload, created_at, updated_at
    )
    VALUES (
      'wordpress', :wpPostId, :targetTable, :targetId, :slug, :postType,
      CAST(:acf AS JSONB), CAST(:meta AS JSONB), CAST(:taxonomy AS JSONB),
      CAST(:featuredImage AS JSONB), CAST(:sourcePayload AS JSONB), NOW(), NOW()
    )
    ON CONFLICT (source_system, wp_post_id, target_table)
    DO UPDATE SET
      target_id = EXCLUDED.target_id,
      slug = EXCLUDED.slug,
      post_type = EXCLUDED.post_type,
      acf = EXCLUDED.acf,
      meta = EXCLUDED.meta,
      taxonomy = EXCLUDED.taxonomy,
      featured_image = EXCLUDED.featured_image,
      source_payload = EXCLUDED.source_payload,
      updated_at = NOW()`,
    {
      replacements: {
        wpPostId,
        targetTable,
        targetId: String(targetId),
        slug: slug || null,
        postType,
        acf: JSON.stringify(acf || {}),
        meta: JSON.stringify(meta || {}),
        taxonomy: JSON.stringify(taxonomy || {}),
        featuredImage: JSON.stringify(featuredImage || null),
        sourcePayload: JSON.stringify(sourcePayload || {}),
      },
      transaction: tx,
    }
  );
}

async function findRowBySlug(targetTable, slug, tx) {
  if (targetTable === "Reviews") return null;
  if (!slug) return null;
  if (targetTable === "PackageTours") {
    const [rows] = await postgres.query(
      `SELECT id FROM "PackageTours" WHERE package->>'slug' = :slug LIMIT 1`,
      { replacements: { slug }, transaction: tx }
    );
    return rows[0] || null;
  }
  if (targetTable === "Blogs") {
    const [rows] = await postgres.query(
      `SELECT id FROM "Blogs" WHERE slug = :slug LIMIT 1`,
      { replacements: { slug }, transaction: tx }
    );
    return rows[0] || null;
  }
  if (targetTable === "cms_contents") {
    const [rows] = await postgres.query(
      `SELECT id FROM cms_contents WHERE slug = :slug LIMIT 1`,
      { replacements: { slug }, transaction: tx }
    );
    return rows[0] || null;
  }
  const [rows] = await postgres.query(
    `SELECT id FROM travel_info WHERE slug = :slug LIMIT 1`,
    { replacements: { slug }, transaction: tx }
  );
  return rows[0] || null;
}

async function updateTargetById({
  targetTable,
  targetId,
  packagePayload,
  blogPayload,
  travelPayload,
  reviewPayload,
  cmsPayload,
  sourcePost,
  tx,
  dryRun,
}) {
  if (dryRun) return;
  const updatedAt = parseWpDate(sourcePost.post_modified, sourcePost.post_modified_gmt);
  if (targetTable === "PackageTours") {
    await postgres.query(
      `UPDATE "PackageTours"
       SET package = CAST(:pkg AS JSONB), "updatedAt" = :updatedAt
       WHERE id = :id`,
      {
        replacements: {
          pkg: JSON.stringify(packagePayload),
          updatedAt,
          id: targetId,
        },
        transaction: tx,
      }
    );
    return;
  }
  if (targetTable === "Blogs") {
    await postgres.query(
      `UPDATE "Blogs"
       SET "mainTitle" = :mainTitle,
           slug = :slug,
           description = :description,
           "coverImage" = :coverImage,
           date = :date,
           "blogContant" = :blogContant,
           tags = CAST(:tags AS TEXT[]),
           meta_title = :meta_title,
           meta_description = :meta_description,
           meta_keywords = :meta_keywords,
           "updatedAt" = :updatedAt
       WHERE id = :id`,
      {
        replacements: {
          ...blogPayload,
          tags: toPostgresTextArray(blogPayload.tags || []),
          updatedAt,
          id: targetId,
        },
        transaction: tx,
      }
    );
    return;
  }
  if (targetTable === "Reviews") {
    await postgres.query(
      `UPDATE "Reviews"
       SET "guestName" = :guestName,
           country = :country,
           "travelDate" = :travelDate,
           "tourTitle" = :tourTitle,
           title = :title,
           "reviewText" = :reviewText,
           rating = :rating,
           "packageIds" = CAST(:packageIds AS INTEGER[]),
           image = CAST(:image AS JSONB),
           sort_order = :sort_order,
           "updatedAt" = :updatedAt
       WHERE id = :id`,
      {
        replacements: {
          ...reviewPayload,
          packageIds: `{${(reviewPayload.packageIds || []).join(",")}}`,
          image: JSON.stringify(reviewPayload.image || null),
          updatedAt,
          id: targetId,
        },
        transaction: tx,
      }
    );
    return;
  }
  if (targetTable === "cms_contents") {
    await postgres.query(
      `UPDATE cms_contents
       SET section = :section,
           content = CAST(:content AS JSONB),
           status = :status,
           "categoryId" = :categoryId,
           slug = :slug,
           subtitle = :subtitle,
           meta_title = :meta_title,
           meta_description = :meta_description,
           meta_keywords = :meta_keywords,
           sort_order = :sort_order,
           "updatedAt" = :updatedAt
       WHERE id = :id`,
      {
        replacements: {
          ...cmsPayload,
          content: JSON.stringify(cmsPayload.content || {}),
          updatedAt,
          id: targetId,
        },
        transaction: tx,
      }
    );
    return;
  }
  await postgres.query(
    `UPDATE travel_info
     SET title = :title,
         slug = :slug,
         description = :description,
         status = :status,
         meta_title = :meta_title,
         meta_description = :meta_description,
         meta_keywords = :meta_keywords,
         "updatedAt" = :updatedAt
     WHERE id = :id`,
    {
      replacements: {
        ...travelPayload,
        updatedAt,
        id: targetId,
      },
      transaction: tx,
    }
  );
}

async function insertTarget({
  targetTable,
  packagePayload,
  blogPayload,
  travelPayload,
  reviewPayload,
  cmsPayload,
  sourcePost,
  tx,
  dryRun,
}) {
  const createdAt = parseWpDate(sourcePost.post_date, sourcePost.post_date_gmt);
  const updatedAt = parseWpDate(sourcePost.post_modified, sourcePost.post_modified_gmt);
  if (dryRun) return { id: `dry-${sourcePost.ID}` };

  if (targetTable === "PackageTours") {
    const [rows] = await postgres.query(
      `INSERT INTO "PackageTours" (package, "createdAt", "updatedAt")
       VALUES (CAST(:pkg AS JSONB), :createdAt, :updatedAt)
       RETURNING id`,
      {
        replacements: {
          pkg: JSON.stringify(packagePayload),
          createdAt,
          updatedAt,
        },
        transaction: tx,
      }
    );
    return rows[0];
  }
  if (targetTable === "Blogs") {
    const [rows] = await postgres.query(
      `INSERT INTO "Blogs" (
        "mainTitle", slug, description, "coverImage", date, "blogContant", tags,
        meta_title, meta_description, meta_keywords, "createdAt", "updatedAt"
      ) VALUES (
        :mainTitle, :slug, :description, :coverImage, :date, :blogContant,
        CAST(:tags AS TEXT[]), :meta_title, :meta_description, :meta_keywords, :createdAt, :updatedAt
      )
      RETURNING id`,
      {
        replacements: {
          ...blogPayload,
          tags: toPostgresTextArray(blogPayload.tags || []),
          createdAt,
          updatedAt,
        },
        transaction: tx,
      }
    );
    return rows[0];
  }
  if (targetTable === "Reviews") {
    const [rows] = await postgres.query(
      `INSERT INTO "Reviews" (
        "guestName", country, "travelDate", "tourTitle", title, "reviewText",
        rating, "packageIds", image, sort_order, "createdAt", "updatedAt"
      ) VALUES (
        :guestName, :country, :travelDate, :tourTitle, :title, :reviewText,
        :rating, CAST(:packageIds AS INTEGER[]), CAST(:image AS JSONB), :sort_order, :createdAt, :updatedAt
      )
      RETURNING id`,
      {
        replacements: {
          ...reviewPayload,
          packageIds: `{${(reviewPayload.packageIds || []).join(",")}}`,
          image: JSON.stringify(reviewPayload.image || null),
          createdAt,
          updatedAt,
        },
        transaction: tx,
      }
    );
    return rows[0];
  }
  if (targetTable === "cms_contents") {
    const [rows] = await postgres.query(
      `INSERT INTO cms_contents (
        id, section, content, status, "categoryId", slug, subtitle,
        meta_title, meta_description, meta_keywords, sort_order, "createdAt", "updatedAt"
      ) VALUES (
        :id, :section, CAST(:content AS JSONB), :status, :categoryId, :slug, :subtitle,
        :meta_title, :meta_description, :meta_keywords, :sort_order, :createdAt, :updatedAt
      )
      RETURNING id`,
      {
        replacements: {
          ...cmsPayload,
          id: crypto.randomUUID(),
          content: JSON.stringify(cmsPayload.content || {}),
          createdAt,
          updatedAt,
        },
        transaction: tx,
      }
    );
    return rows[0];
  }
  const [rows] = await postgres.query(
    `INSERT INTO travel_info (
      id, title, slug, description, status, meta_title, meta_description, meta_keywords, "createdAt", "updatedAt"
    ) VALUES (
      :id, :title, :slug, :description, :status, :meta_title, :meta_description, :meta_keywords, :createdAt, :updatedAt
    )
    RETURNING id`,
    {
      replacements: {
        ...travelPayload,
        id: crypto.randomUUID(),
        createdAt,
        updatedAt,
      },
      transaction: tx,
    }
  );
  return rows[0];
}

async function upsertCmsImportedSections({
  cmsPageId,
  cmsPayload,
  cmsSectionPayloads,
  sourcePost,
  acf,
  meta,
  taxonomy,
  featuredImage,
  tx,
  dryRun,
}) {
  if (!Array.isArray(cmsSectionPayloads) || !cmsSectionPayloads.length) return;

  // Remove legacy/manual placeholder rows (no wp_import_map ownership) so imported
  // sections become the source of truth for this page on reruns.
  if (!dryRun) {
    await postgres.query(
      `DELETE FROM cms_sections cs
       WHERE cs.page_id = :pageId
         AND NOT EXISTS (
           SELECT 1
           FROM wp_import_map wim
           WHERE wim.target_table = 'cms_sections'
             AND wim.target_id = cs.id::text
         )`,
      {
        replacements: { pageId: cmsPageId },
        transaction: tx,
      }
    );
  }

  for (const section of cmsSectionPayloads) {
    let sectionData = { ...(section.data || {}) };
    if (
      section.type === "packages" &&
      Array.isArray(sectionData.packagesSectionPackageWpIds) &&
      sectionData.packagesSectionPackageWpIds.length
    ) {
      const resolvedPackageIds = await resolvePackageTourIdsFromWpIds({
        wpPackageIds: sectionData.packagesSectionPackageWpIds,
        tx,
      });
      sectionData.packagesSectionPackageIds = resolvedPackageIds.map(String);
      delete sectionData.packagesSectionPackageWpIds;
    }

    const existingSectionMap = await getImportMapByWpId({
      wpPostId: section.importKey,
      targetTable: "cms_sections",
      tx,
    });

    let sectionId = existingSectionMap?.target_id || null;
    if (sectionId) {
      if (!dryRun) {
        const [updatedRows] = await postgres.query(
          `UPDATE cms_sections
           SET page_id = :page_id,
               type = :type,
               sort_order = :sort_order,
               is_enabled = :is_enabled,
               data = CAST(:data AS JSONB),
               "updatedAt" = NOW()
           WHERE id = :id`,
          {
            replacements: {
              id: sectionId,
              page_id: cmsPageId,
              type: section.type,
              sort_order: section.sort_order,
              is_enabled: !!section.is_enabled,
              data: JSON.stringify(sectionData),
            },
            transaction: tx,
          }
        );
        // If the mapped row was deleted earlier, recreate it and refresh wp_import_map.
        if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
          sectionId = null;
        }
      }
    } else if (dryRun) {
      sectionId = `dry-${section.importKey}`;
    } else {
      const [sectionRows] = await postgres.query(
        `INSERT INTO cms_sections (
          id, page_id, type, sort_order, is_enabled, data, "createdAt", "updatedAt"
        ) VALUES (
          :id, :page_id, :type, :sort_order, :is_enabled, CAST(:data AS JSONB), NOW(), NOW()
        )
        RETURNING id`,
        {
          replacements: {
            id: crypto.randomUUID(),
            page_id: cmsPageId,
            type: section.type,
            sort_order: section.sort_order,
            is_enabled: !!section.is_enabled,
            data: JSON.stringify(sectionData),
          },
          transaction: tx,
        }
      );
      sectionId = sectionRows[0].id;
    }

    if (!sectionId && dryRun) {
      sectionId = `dry-${section.importKey}`;
    }

    if (!sectionId) {
      const [sectionRows] = await postgres.query(
        `INSERT INTO cms_sections (
          id, page_id, type, sort_order, is_enabled, data, "createdAt", "updatedAt"
        ) VALUES (
          :id, :page_id, :type, :sort_order, :is_enabled, CAST(:data AS JSONB), NOW(), NOW()
        )
        RETURNING id`,
        {
          replacements: {
            id: crypto.randomUUID(),
            page_id: cmsPageId,
            type: section.type,
            sort_order: section.sort_order,
            is_enabled: !!section.is_enabled,
            data: JSON.stringify(sectionData),
          },
          transaction: tx,
        }
      );
      sectionId = sectionRows[0].id;
    }

    await upsertImportMap({
      wpPostId: section.importKey,
      targetTable: "cms_sections",
      targetId: sectionId,
      slug: cmsPayload?.slug || null,
      postType: sourcePost.post_type,
      acf,
      meta,
      taxonomy,
      featuredImage,
      sourcePayload: {
        pageSlug: cmsPayload?.slug || null,
        sectionType: section.type,
        sort_order: section.sort_order,
      },
      tx,
      dryRun,
    });
  }
}

function buildBlogPayload({ post, tags, featuredImage, allMeta }) {
  const slug = ensureSlug(post.post_name, post.post_title, post.ID);
  const title = truncate(post.post_title || "Untitled", 255);
  const providedMetaTitle =
    (typeof allMeta._yoast_wpseo_title === "string" && allMeta._yoast_wpseo_title) || null;
  const providedMetaDescription =
    (typeof allMeta._yoast_wpseo_metadesc === "string" && allMeta._yoast_wpseo_metadesc) ||
    null;
  return {
    mainTitle: title,
    slug: truncate(slug, 255),
    description: generateExcerpt({
      excerpt: post.post_excerpt,
      content: post.post_content,
    }),
    coverImage: truncate(featuredImage?.url || "", 255),
    date: truncate(
      typeof post.post_date === "string" ? post.post_date.slice(0, 10) : "",
      255
    ),
    blogContant: post.post_content || "",
    tags,
    meta_title: generateMetaTitle({ title, provided: providedMetaTitle }),
    meta_description: generateMetaDescription({
      excerpt: post.post_excerpt,
      content: post.post_content,
      provided: providedMetaDescription,
    }),
    meta_keywords: truncate(tags.length ? tags.join(", ") : null, 255),
  };
}

function buildTravelPayload({ post, allMeta }) {
  const slug = ensureSlug(post.post_name, post.post_title, post.ID);
  const title = truncate(post.post_title || "Untitled", 255);
  const providedMetaTitle =
    (typeof allMeta._yoast_wpseo_title === "string" && allMeta._yoast_wpseo_title) || null;
  const providedMetaDescription =
    (typeof allMeta._yoast_wpseo_metadesc === "string" && allMeta._yoast_wpseo_metadesc) ||
    null;
  return {
    title,
    slug: truncate(slug, 255),
    description: post.post_content || post.post_excerpt || "",
    status: String(post.post_status || "").toLowerCase() === "publish",
    meta_title: generateMetaTitle({ title, provided: providedMetaTitle }),
    meta_description: generateMetaDescription({
      excerpt: post.post_excerpt,
      content: post.post_content,
      provided: providedMetaDescription,
    }),
    meta_keywords: truncate(null, 255),
  };
}

function normalizeDurationValue(raw) {
  const str = String(raw || "").trim();
  if (!str) return "";
  if (/^\d+$/.test(str)) {
    const days = Number(str);
    return `${days} Day${days === 1 ? "" : "s"}`;
  }
  return str;
}

function generateTripQuote({ excerpt, content, title }) {
  const base =
    stripHtml(excerpt) ||
    stripHtml(content) ||
    (title ? `Explore ${title} with Everest Vacation.` : "Explore this trip with Everest Vacation.");
  return truncate(base, 220);
}

function buildCmsContentPayload({ post, allMeta, featuredImage }) {
  const slug = ensureSlug(post.post_name, post.post_title, post.ID);
  const title = truncate(post.post_title || "Untitled Page", 255);
  const providedMetaTitle =
    (typeof allMeta._yoast_wpseo_title === "string" && allMeta._yoast_wpseo_title) || null;
  const providedMetaDescription =
    (typeof allMeta._yoast_wpseo_metadesc === "string" && allMeta._yoast_wpseo_metadesc) ||
    null;

  return {
    section: truncate(slug, 255),
    slug: truncate(slug, 255),
    status: String(post.post_status || "").toLowerCase() === "publish",
    categoryId: null,
    subtitle: truncate("", 255),
    meta_title: generateMetaTitle({ title, provided: providedMetaTitle }),
    meta_description: generateMetaDescription({
      excerpt: post.post_excerpt,
      content: post.post_content,
      provided: providedMetaDescription,
    }),
    meta_keywords: truncate(null, 255),
    sort_order: Number.isFinite(Number(post.menu_order)) ? Number(post.menu_order) : null,
    content: {
      title,
      subtitle: "",
      description: post.post_content || "",
      pageBannerImage: featuredImage || null,
      importSource: {
        system: "wordpress",
        wpPostId: String(post.ID),
        postType: post.post_type,
      },
    },
  };
}

function flattenMetaForSectionExtraction(allMeta = {}, acf = {}) {
  const flattened = {};

  for (const [key, rawValue] of Object.entries(allMeta || {})) {
    if (!key || key.startsWith("_")) continue;
    if (Array.isArray(rawValue)) {
      if (rawValue.length === 1) {
        flattened[key] = rawValue[0];
      } else if (rawValue.length > 1) {
        flattened[key] = rawValue;
      }
      continue;
    }
    flattened[key] = rawValue;
  }

  for (const [key, value] of Object.entries(acf || {})) {
    if (value === undefined || value === null || value === "") continue;
    if (flattened[key] === undefined) flattened[key] = value;
  }

  return flattened;
}

function parseWpIdsFromUnknown(value) {
  const ids = [];

  if (Array.isArray(value)) {
    for (const item of value) {
      ids.push(...parseWpIdsFromUnknown(item));
    }
    return ids;
  }

  if (Number.isFinite(Number(value)) && Number(value) > 0) {
    return [Number(value)];
  }

  if (typeof value === "string") {
    parseWpSerializedIds(value).forEach((id) => ids.push(id));

    if (!ids.length) {
      const matches = value.match(/\d+/g) || [];
      matches
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0)
        .forEach((id) => ids.push(id));
    }
  }

  return uniqueBy(ids, (v) => String(v));
}

function buildCmsSectionPayloads({
  post,
  cmsPayload,
  featuredImage,
  attachmentUrlFromId,
  allMeta,
  acf,
}) {
  const sections = [];
  let sortOrder = 1;
  if (featuredImage) {
    sections.push({
      importKey: `wp:${post.ID}:cms:pageBanner`,
      type: "pageBanner",
      sort_order: sortOrder,
      is_enabled: true,
      data: {
        pageBannerImage: featuredImage,
      },
    });
    sortOrder += 1;
  }
  const blocks = extractAcfBlockData(post.post_content || "");
  const repeatableItems = [];
  const relatedItems = [];
  const faqItems = [];
  const galleryUrls = [];
  const packagesBlocks = [];
  let hasBookingForm = false;

  for (const block of blocks) {
    const blockName = String(block?.name || "").toLowerCase();
    const data = block?.data && typeof block.data === "object" ? block.data : {};
    const isDisabledBlock =
      String(data.starter_kit_enable_section ?? "1")
        .toLowerCase()
        .trim() === "0";
    if (isDisabledBlock) continue;

    extractRepeatableItemsFromBlockData(data, featuredImage, attachmentUrlFromId).forEach((item) =>
      repeatableItems.push(item)
    );
    extractRelatedInfoItemsFromBlockData(data).forEach((item) => relatedItems.push(item));
    extractFaqItemsFromBlockData(data).forEach((item) => faqItems.push(item));
    extractGalleryUrlsFromBlockData(data, attachmentUrlFromId).forEach((url) => galleryUrls.push(url));

    if (blockName.includes("holiday-package") || Array.isArray(data.starter_kit_select_packages)) {
      const wpPackageIds = (Array.isArray(data.starter_kit_select_packages)
        ? data.starter_kit_select_packages
        : [])
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      packagesBlocks.push({
        title: cleanPlainTextOrEmpty(data.starter_kit_destination_section_title || "Recommended Packages"),
        subtitle: cleanPlainTextOrEmpty(data.starter_kit_destination_section_subtitle || ""),
        description: cleanRichTextOrEmpty(data.starter_kit_section_description || ""),
        wpPackageIds: uniqueBy(wpPackageIds, (v) => String(v)),
      });
    }

    if (
      blockName.includes("booking") ||
      blockName.includes("quick-enquiry") ||
      blockName.includes("contact-form") ||
      blockName.includes("contactform")
    ) {
      hasBookingForm = true;
    }
  }

  const metaData = flattenMetaForSectionExtraction(allMeta, acf);
  if (Object.keys(metaData).length) {
    extractRepeatableItemsFromBlockData(metaData, featuredImage, attachmentUrlFromId).forEach((item) =>
      repeatableItems.push(item)
    );
    extractRelatedInfoItemsFromBlockData(metaData).forEach((item) => relatedItems.push(item));
    extractFaqItemsFromBlockData(metaData).forEach((item) => faqItems.push(item));
    extractGalleryUrlsFromBlockData(metaData, attachmentUrlFromId).forEach((url) => galleryUrls.push(url));

    const metaPackageIds = parseWpIdsFromUnknown(
      metaData.starter_kit_select_packages ||
        metaData.select_packages ||
        metaData.package_ids ||
        metaData.packages
    );
    if (metaPackageIds.length) {
      packagesBlocks.push({
        title: cleanPlainTextOrEmpty(
          metaData.starter_kit_destination_section_title || metaData.packages_section_title
        ) || "Recommended Packages",
        subtitle: cleanPlainTextOrEmpty(
          metaData.starter_kit_destination_section_subtitle || metaData.packages_section_subtitle
        ),
        description: cleanRichTextOrEmpty(
          metaData.starter_kit_section_description || metaData.packages_section_description
        ),
        wpPackageIds: uniqueBy(metaPackageIds, (v) => String(v)),
      });
    }

    if (!hasBookingForm) {
      const metaKeyBlob = Object.keys(metaData).join(" ").toLowerCase();
      hasBookingForm =
        metaKeyBlob.includes("booking") ||
        metaKeyBlob.includes("enquiry") ||
        metaKeyBlob.includes("contact_form") ||
        metaKeyBlob.includes("contactform");
    }
  }

  const dedupedRepeatableItems = uniqueBy(
    repeatableItems.filter((item) => item.title || stripHtml(item.description) || item.image),
    (item) => [item.title, stripHtml(item.description), item.image].join("|")
  );
  const dedupedRelatedItems = uniqueBy(
    relatedItems.filter((item) => item.title || stripHtml(item.description)),
    (item) => [item.title, stripHtml(item.description)].join("|")
  );
  const dedupedFaqItems = uniqueBy(
    faqItems.filter((item) => item.question || stripHtml(item.answer)),
    (item) => [item.question, stripHtml(item.answer)].join("|")
  );
  const dedupedGalleryUrls = uniqueBy(galleryUrls.filter(Boolean), (v) => v);

  if (!dedupedRepeatableItems.length && stripHtml(post.post_content || "")) {
    splitHtmlIntoRepeatableItems({
      html: post.post_content || "",
      title: cmsPayload.content?.title || post.post_title || "",
      featuredImage,
    }).forEach((item) => dedupedRepeatableItems.push(item));
  }

  if (dedupedRepeatableItems.length) {
    sections.push({
      importKey: `wp:${post.ID}:cms:repeatableTextImage:1`,
      type: "repeatableTextImage",
      sort_order: sortOrder,
      is_enabled: true,
      data: {
        items: dedupedRepeatableItems.map((item) => ({
          ...item,
          imageCaption:
            item.imageCaption ||
            ((featuredImage && item.image === featuredImage.url && featuredImage.caption) || ""),
        })),
      },
    });
    sortOrder += 1;
  }

  const mergedPackagesBlock = packagesBlocks.find(
    (item) => item.wpPackageIds.length || item.title || item.subtitle || stripHtml(item.description)
  );
  if (mergedPackagesBlock) {
    sections.push({
      importKey: `wp:${post.ID}:cms:packages`,
      type: "packages",
      sort_order: sortOrder,
      is_enabled: true,
      data: {
        packagesSectionTitle: mergedPackagesBlock.title || "Recommended Packages",
        packagesSectionSubtitle: mergedPackagesBlock.subtitle || "",
        packagesSectionDescription: mergedPackagesBlock.description || "",
        packagesSectionPackageIds: [],
        packagesSectionPackageWpIds: mergedPackagesBlock.wpPackageIds.map(String),
      },
    });
    sortOrder += 1;
  }

  if (dedupedGalleryUrls.length) {
    sections.push({
      importKey: `wp:${post.ID}:cms:gallery`,
      type: "gallery",
      sort_order: sortOrder,
      is_enabled: true,
      data: { galleryImages: dedupedGalleryUrls },
    });
    sortOrder += 1;
  }

  if (dedupedRelatedItems.length) {
    sections.push({
      importKey: `wp:${post.ID}:cms:relatedInformation`,
      type: "relatedInformation",
      sort_order: sortOrder,
      is_enabled: true,
      data: { items: dedupedRelatedItems },
    });
    sortOrder += 1;
  }

  if (dedupedFaqItems.length) {
    const faqTitleFromMeta = cleanPlainTextOrEmpty(
      metaData?.ws_trip_faqs_section_title || metaData?.faq_section_title || metaData?.faq_title
    );
    sections.push({
      importKey: `wp:${post.ID}:cms:faq`,
      type: "faq",
      sort_order: sortOrder,
      is_enabled: true,
      data: {
        faqSectionTitle: faqTitleFromMeta || "Frequently Asked Questions",
        items: dedupedFaqItems.map((item) => ({
          id: crypto.randomUUID(),
          question: item.question,
          answer: item.answer,
        })),
      },
    });
    sortOrder += 1;
  }

  return sections;
}

function buildReviewPayload({ post, allMeta, acf, featuredImage, imageGallery }) {
  const fallbackDate = parseWpDate(post.post_date, post.post_date_gmt).toISOString().slice(0, 10);
  const firstNameByFieldKey = pickMetaByAcfFieldKey(allMeta, "field_63b979e2a8c91");
  const firstName = sanitizeAcfFieldToken(firstNameByFieldKey || pickMetaFirst(allMeta, [
    "rh_review_traveler_first_name",
    "guest_name",
    "client_name",
    "reviewer_name",
    "testimonial_name",
    "name",
  ]));
  const lastName = sanitizeAcfFieldToken(pickMetaFirst(allMeta, [
    "rh_review_traveler_last_name",
  ]));
  const fullName = `${firstName} ${lastName}`.trim();
  const guestName = truncate(
    sanitizeAcfFieldToken(fullName || firstName || post.post_title || "Anonymous Guest"),
    255
  );
  const country = truncate(
    pickMetaFirst(allMeta, [
      "rh_reviw_traveler_country",
      "_rh_reviw_traveler_country",
      "country",
      "guest_country",
      "nationality",
      "location",
      "reviewer_country",
    ]) || "Unknown",
    255
  );
  const travelDate = pickDateOnly(
    pickMetaFirst(allMeta, [
      "rh_review_travelyear",
      "_rh_review_travelyear",
      "travel_date",
      "date_of_travel",
      "trip_date",
      "journey_date",
      "review_date",
      "date",
    ]),
    fallbackDate
  );
  const reviewTitle = truncate(
    pickMetaFirst(allMeta, [
      "review_title",
      "testimonial_title",
      "headline",
      "title",
    ]) || post.post_title || "Guest Review",
    255
  );
  const tourTitle = truncate(
    pickMetaFirst(allMeta, [
      "tour_title",
      "trip_name",
      "package_name",
      "trip_title",
    ]) || null,
    255
  );
  const reviewText =
    pickMetaFirst(allMeta, ["review_text", "testimonial_text", "comment", "feedback"]) ||
    post.post_content ||
    post.post_excerpt ||
    reviewTitle;
  const rating = parseRating(
    pickMetaFirst(allMeta, [
      "rh_reviewer_traveler_rating",
      "_rh_reviewer_traveler_rating",
      "rating",
      "review_rating",
      "testimonial_rating",
      "star_rating",
      "stars",
    ])
  );
  const packageWpIds = extractReviewWpPackageIds(allMeta);
  const primaryImageUrl =
    (featuredImage && typeof featuredImage.url === "string" && featuredImage.url) ||
    (Array.isArray(imageGallery) && imageGallery.length ? imageGallery[0] : "") ||
    "";
  const sortOrder = Number(post.menu_order);
  return {
    guestName,
    country,
    travelDate,
    tourTitle,
    title: reviewTitle,
    reviewText,
    rating,
    packageIds: [],
    packageWpIds,
    image: {
      url: primaryImageUrl,
      altText:
        (featuredImage && typeof featuredImage.altText === "string" && featuredImage.altText) ||
        "",
      variants: {},
      featured: featuredImage || null,
      gallery: imageGallery || [],
      acf: acf || {},
      source: "wordpress",
    },
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

async function upsertTargetRecord({
  targetTable,
  packagePayload,
  blogPayload,
  travelPayload,
  reviewPayload,
  cmsPayload,
  cmsSectionPayloads,
  sourcePost,
  sourceMapPayload,
  acf,
  meta,
  taxonomy,
  featuredImage,
  tx,
  dryRun,
  counters,
  args,
}) {
  const wpPostId = String(sourcePost.ID);
  const slug =
    packagePayload.slug ||
    blogPayload.slug ||
    travelPayload.slug ||
    cmsPayload?.slug ||
    `testimonial-${sourcePost.ID}`;

  let mapped = await getImportMapByWpId({ wpPostId, targetTable, tx });
  if (mapped) {
    const mappedTargetExists = await targetRowExistsById({
      targetTable,
      targetId: mapped.target_id,
      tx,
    });
    if (!mappedTargetExists) {
      if (args?.verbose) {
        console.warn(
          `Stale wp_import_map target detected for wp_post_id=${wpPostId}, target_table=${targetTable}, target_id=${mapped.target_id}. Falling back to slug recovery.`
        );
      }
      mapped = null;
    }
  }
  if (mapped) {
    await updateTargetById({
      targetTable,
      targetId: mapped.target_id,
      packagePayload,
      blogPayload,
      travelPayload,
      reviewPayload,
      cmsPayload,
      sourcePost,
      tx,
      dryRun,
    });
    if (targetTable === "cms_contents") {
      await upsertCmsImportedSections({
        cmsPageId: mapped.target_id,
        cmsPayload,
        cmsSectionPayloads,
        sourcePost,
        acf,
        meta,
        taxonomy,
        featuredImage,
        tx,
        dryRun,
      });
    }
    await upsertImportMap({
      wpPostId,
      targetTable,
      targetId: mapped.target_id,
      slug,
      postType: sourcePost.post_type,
      acf,
      meta,
      taxonomy,
      featuredImage,
      sourcePayload: sourceMapPayload,
      tx,
      dryRun,
    });
    pushCounter(counters, "updatedByWpId", targetTable);
    return;
  }

  const bySlug = await findRowBySlug(targetTable, slug, tx);
  if (bySlug) {
    const ownership = await getImportMapByTarget({
      targetTable,
      targetId: bySlug.id,
      tx,
    });
    const canTakeoverCmsSlugConflict =
      !ownership &&
      targetTable === "cms_contents" &&
      args?.takeoverCmsSlugConflicts;

    if (!ownership && !canTakeoverCmsSlugConflict) {
      pushCounter(counters, "skippedConflicts", targetTable);
      return;
    }
    await updateTargetById({
      targetTable,
      targetId: bySlug.id,
      packagePayload,
      blogPayload,
      travelPayload,
      reviewPayload,
      cmsPayload,
      sourcePost,
      tx,
      dryRun,
    });
    if (targetTable === "cms_contents") {
      await upsertCmsImportedSections({
        cmsPageId: bySlug.id,
        cmsPayload,
        cmsSectionPayloads,
        sourcePost,
        acf,
        meta,
        taxonomy,
        featuredImage,
        tx,
        dryRun,
      });
    }
    await upsertImportMap({
      wpPostId,
      targetTable,
      targetId: bySlug.id,
      slug,
      postType: sourcePost.post_type,
      acf,
      meta,
      taxonomy,
      featuredImage,
      sourcePayload: sourceMapPayload,
      tx,
      dryRun,
    });
    pushCounter(counters, "updatedBySlug", targetTable);
    return;
  }

  const inserted = await insertTarget({
    targetTable,
    packagePayload,
    blogPayload,
    travelPayload,
    reviewPayload,
    cmsPayload,
    sourcePost,
    tx,
    dryRun,
  });
  await upsertImportMap({
    wpPostId,
    targetTable,
    targetId: inserted.id,
    slug,
    postType: sourcePost.post_type,
    acf,
    meta,
    taxonomy,
    featuredImage,
    sourcePayload: sourceMapPayload,
    tx,
    dryRun,
  });
  if (targetTable === "cms_contents") {
    await upsertCmsImportedSections({
      cmsPageId: inserted.id,
      cmsPayload,
      cmsSectionPayloads,
      sourcePost,
      acf,
      meta,
      taxonomy,
      featuredImage,
      tx,
      dryRun,
    });
  }
  pushCounter(counters, "inserted", targetTable);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.sqlFile) usageAndExit();
  if (!fs.existsSync(args.sqlFile)) {
    throw new Error(`SQL file not found: ${args.sqlFile}`);
  }

  const sqlText = fs.readFileSync(args.sqlFile, "utf8");
  const prefix = detectPrefix(sqlText);
  const tables = {
    posts: `${prefix}posts`,
    postmeta: `${prefix}postmeta`,
    terms: `${prefix}terms`,
    termTaxonomy: `${prefix}term_taxonomy`,
    termRelationships: `${prefix}term_relationships`,
  };

  const postsById = new Map();
  const metaByPostId = new Map();
  const termsById = new Map();
  const termTaxonomyById = new Map();
  const relationshipsByPostId = new Map();

  iterateInserts(sqlText, tables.posts, (columns, rows) => {
    for (const row of rows) {
      const rec = toMapFromRow(columns, row);
      postsById.set(Number(rec.ID), rec);
    }
  });

  iterateInserts(sqlText, tables.postmeta, (columns, rows) => {
    for (const row of rows) {
      const rec = toMapFromRow(columns, row);
      const postId = Number(rec.post_id);
      if (!metaByPostId.has(postId)) metaByPostId.set(postId, {});
      const bucket = metaByPostId.get(postId);
      const key = rec.meta_key || "";
      if (!bucket[key]) bucket[key] = [];
      bucket[key].push(rec.meta_value);
    }
  });

  iterateInserts(sqlText, tables.terms, (columns, rows) => {
    for (const row of rows) {
      const rec = toMapFromRow(columns, row);
      termsById.set(Number(rec.term_id), rec);
    }
  });

  iterateInserts(sqlText, tables.termTaxonomy, (columns, rows) => {
    for (const row of rows) {
      const rec = toMapFromRow(columns, row);
      termTaxonomyById.set(Number(rec.term_taxonomy_id), rec);
    }
  });

  iterateInserts(sqlText, tables.termRelationships, (columns, rows) => {
    for (const row of rows) {
      const rec = toMapFromRow(columns, row);
      const postId = Number(rec.object_id);
      if (!relationshipsByPostId.has(postId)) relationshipsByPostId.set(postId, []);
      relationshipsByPostId.get(postId).push(rec);
    }
  });

  const allPosts = Array.from(postsById.values());
  const candidatePosts = allPosts.filter((post) => {
    if (!shouldImportPost(post, args)) return false;
    if (args.onlyPostIds && !args.onlyPostIds.has(Number(post.ID))) return false;
    if (args.onlyPostTitles) {
      const title = String(post.post_title || "").trim().toLowerCase();
      if (!args.onlyPostTitles.has(title)) return false;
    }
    if (args.onlyPostSlugs) {
      const slug = String(post.post_name || "").trim().toLowerCase();
      if (!args.onlyPostSlugs.has(slug)) return false;
    }
    return true;
  });
  candidatePosts.sort((a, b) => Number(a.ID) - Number(b.ID));

  const toImport = args.limit ? candidatePosts.slice(0, args.limit) : candidatePosts;
  const categoryIdCache = new Map();
  const counters = {
    selected: toImport.length,
    inserted: 0,
    updatedByWpId: 0,
    updatedBySlug: 0,
    skippedConflicts: 0,
    failed: 0,
    byTarget: {},
  };

  if (args.verbose) {
    console.info(`Detected WP prefix: ${prefix}`);
    console.info(`Candidate posts: ${candidatePosts.length}`);
    console.info(`Will process: ${toImport.length}`);
  }

  await postgres.authenticate();
  try {
    await ensureImportMapTable(null);

    for (const post of toImport) {
      const tx = args.noTransaction ? null : await postgres.transaction();
      const postId = Number(post.ID);
      try {
        const meta = metaByPostId.get(postId) || {};
        const { allMeta, acf } = makeMetaObjects(meta);
        const taxonomy = taxonomyBundleForPost(
          postId,
          relationshipsByPostId,
          termTaxonomyById,
          termsById
        );

        const categoryTerms = taxonomy.category || [];
        let categoryId = null;
        if (categoryTerms.length) {
          categoryId = await ensureCategory(categoryTerms[0], tx, categoryIdCache);
        }

        const thumbnailIdRaw =
          Array.isArray(meta._thumbnail_id) && meta._thumbnail_id.length
            ? meta._thumbnail_id[0]
            : null;
        const thumbnailId =
          thumbnailIdRaw !== null && thumbnailIdRaw !== undefined
            ? Number(thumbnailIdRaw)
            : null;
        const attachmentPost =
          Number.isFinite(thumbnailId) && thumbnailId > 0
            ? postsById.get(thumbnailId)
            : null;
        const attachmentMeta = thumbnailId ? metaByPostId.get(thumbnailId) || {} : {};
        const attachedFile =
          Array.isArray(attachmentMeta._wp_attached_file) &&
          attachmentMeta._wp_attached_file.length
            ? attachmentMeta._wp_attached_file[0]
            : null;
        const featuredImage = attachmentPost
          ? {
              attachmentId: thumbnailId,
              url: buildAttachmentUrl({
                attachedFile,
                guid: attachmentPost.guid,
                wpSiteUrl: args.wpSiteUrl,
              }),
              altText:
                buildAttachmentAltText({
                  attachmentPost,
                  attachmentMeta,
                  attachedFile,
                  fallbackTitle: post.post_title || "",
                }) || null,
              caption: buildAttachmentCaption({
                attachmentPost,
                attachmentMeta,
                fallbackTitle: post.post_title || "",
              }),
              title:
                (typeof attachmentPost.post_title === "string" &&
                  attachmentPost.post_title.trim()) ||
                null,
              variants: {},
              localPath: normalizeWpContentPath(args.wpContentDir, attachedFile),
            }
          : null;

        const imageGallery = uniqueBy(
          [
            ...(featuredImage && featuredImage.url ? [featuredImage.url] : []),
            ...extractImageUrlsFromHtml(post.post_content),
          ],
          (url) => url
        );

        const tags = uniqueBy(
          (taxonomy.post_tag || [])
            .map((item) => item.name)
            .filter((name) => typeof name === "string" && name.trim()),
          (name) => name.toLowerCase()
        );

        const tripBlocks =
          post.post_type === "trip" ? mapTripSectionsFromBlocks(post.post_content || "") : null;

        const packagePayload = {
          title: post.post_title || "",
          slug: ensureSlug(post.post_name, post.post_title, post.ID),
          descriptions: post.post_excerpt || post.post_content || "",
          blogContent: post.post_content || "",
          mainImage: featuredImage
            ? {
                url: featuredImage.url || "",
                altText: featuredImage.altText || "",
                caption: featuredImage.caption || "",
                title: featuredImage.title || "",
                variants: featuredImage.variants || {},
              }
            : "",
          imageGallary: imageGallery,
          categoryId,
          tags,
          meta_title: generateMetaTitle({
            title: post.post_title || "Untitled",
            provided:
              (typeof allMeta._yoast_wpseo_title === "string" &&
                allMeta._yoast_wpseo_title) ||
              null,
          }),
          meta_description: generateMetaDescription({
            excerpt: post.post_excerpt,
            content: post.post_content,
            provided:
              (typeof allMeta._yoast_wpseo_metadesc === "string" &&
                allMeta._yoast_wpseo_metadesc) ||
              null,
          }),
          taxonomy,
          acf,
          meta: allMeta,
          importSource: {
            system: "wordpress",
            tablePrefix: prefix,
            wpPostId: String(postId),
            postType: post.post_type,
            postStatus: post.post_status,
            guid: post.guid || null,
            parentId: Number(post.post_parent || 0),
            wpContentDir: args.wpContentDir || null,
            wpSiteUrl: args.wpSiteUrl,
            sourceTimestamps: {
              post_date: post.post_date || null,
              post_date_gmt: post.post_date_gmt || null,
              post_modified: post.post_modified || null,
              post_modified_gmt: post.post_modified_gmt || null,
            },
          },
        };
        const attachmentUrlFromId = (attachmentId) => {
          if (!Number.isFinite(Number(attachmentId)) || Number(attachmentId) <= 0) return "";
          const attachment = postsById.get(Number(attachmentId));
          if (!attachment) return "";
          const attachmentMetaById = metaByPostId.get(Number(attachmentId)) || {};
          const attachmentFile =
            Array.isArray(attachmentMetaById._wp_attached_file) &&
            attachmentMetaById._wp_attached_file.length
              ? attachmentMetaById._wp_attached_file[0]
              : null;
          return (
            buildAttachmentUrl({
              attachedFile: attachmentFile,
              guid: attachment.guid,
              wpSiteUrl: args.wpSiteUrl,
            }) || ""
          );
        };

        if (post.post_type === "trip") {
          const metaShortDesc = pickMetaFirst(allMeta, ["ws_short_desc", "_ws_short_desc"]);
          const metaDays = pickMetaFirst(allMeta, ["ws_number_of_days", "_ws_number_of_days"]);
          const metaTripLevel = pickMetaFirst(allMeta, [
            "ws_trips_difficulty_level",
            "_ws_trips_difficulty_level",
          ]);
          const cleanedShortDesc = sanitizeAcfFieldToken(metaShortDesc);

          if (cleanedShortDesc) {
            packagePayload.sub_description = stripHtml(cleanedShortDesc);
          } else {
            packagePayload.sub_description = generateTripQuote({
              excerpt: post.post_excerpt,
              content: post.post_content,
              title: post.post_title,
            });
          }
          if (metaDays) {
            packagePayload.duration = normalizeDurationValue(metaDays);
          }
          if (metaTripLevel) {
            packagePayload.trip_type_level = stripHtml(metaTripLevel);
          }
        }

        if (tripBlocks) {
          if (tripBlocks.overview.title || stripHtml(tripBlocks.overview.description)) {
            packagePayload.overview = tripBlocks.overview;
          }
          if (tripBlocks.overviewImageAttachmentId) {
            const overviewImage = attachmentUrlFromId(tripBlocks.overviewImageAttachmentId);
            if (overviewImage) {
              packagePayload.overviewImage = overviewImage;
            }
          }
          const blockShortDesc = sanitizeAcfFieldToken(tripBlocks.tripFacts.short_description);
          if (
            (!packagePayload.sub_description ||
              String(packagePayload.sub_description).trim().toLowerCase().startsWith("field_")) &&
            stripHtml(blockShortDesc)
          ) {
            packagePayload.sub_description = blockShortDesc;
          }
          if (stripHtml(tripBlocks.highlightsHtml || tripBlocks.raw.ws_trip_block_highlights || "")) {
            packagePayload.trip_highlights =
              tripBlocks.highlightsHtml || tripBlocks.raw.ws_trip_block_highlights;
          }
          if (tripBlocks.sectionTitles.highlightsTitle) {
            packagePayload.trip_highlights_title = tripBlocks.sectionTitles.highlightsTitle;
          }
          if (tripBlocks.sectionTitles.itineraryTitle) {
            packagePayload.itinerary_title = tripBlocks.sectionTitles.itineraryTitle;
          }
          if (tripBlocks.itinerary.length) {
            packagePayload.itinerary = tripBlocks.itinerary;
          }
          if (tripBlocks.faq.length) {
            packagePayload.faq = tripBlocks.faq;
          }
          if (tripBlocks.sectionTitles.faqTitle) {
            packagePayload.faq_section_title = tripBlocks.sectionTitles.faqTitle;
          }
          const customSections = [
            ...(tripBlocks.additionalInfo || []),
            ...(tripBlocks.additionalInfoFromOverview || []),
          ];
          if (tripBlocks.includeItems.length) {
            customSections.push({
              id: "included-list",
              title: "Cost Include",
              type: "list",
              content: tripBlocks.includeItems,
              description: "",
              note: tripBlocks.includeNoteHtml || "",
            });
          }
          if (tripBlocks.excludeItems.length) {
            customSections.push({
              id: "excluded-list",
              title: "Cost Exclude",
              type: "list",
              content: tripBlocks.excludeItems,
              description: "",
              note: tripBlocks.excludeNoteHtml || "",
            });
          }
          if (customSections.length) {
            packagePayload.customSections = customSections.map((item, idx) => ({
              ...item,
              id: item.id || idx + 1,
            }));
          }
          if (tripBlocks.whyTravelWithUs.length) {
            packagePayload.why_travel_with_us = tripBlocks.whyTravelWithUs;
          }
          if (tripBlocks.includeItems.length) {
            packagePayload.cost_inclusions = {
              permits: tripBlocks.includeItems,
              services: [],
            };
          }
          if (tripBlocks.excludeItems.length) {
            packagePayload.cost_exclusions = tripBlocks.excludeItems;
          }
          if (!packagePayload.trip_type_level && tripBlocks.tripFacts.trip_grading) {
            packagePayload.trip_type_level = tripBlocks.tripFacts.trip_grading;
          }
          if (
            !packagePayload.duration &&
            Array.isArray(tripBlocks.itinerary) &&
            tripBlocks.itinerary.length
          ) {
            packagePayload.duration = `${tripBlocks.itinerary.length} Days`;
          }
          if (tripBlocks.tripFacts.attractions) {
            packagePayload.trip_attractions = tripBlocks.tripFacts.attractions;
          }
          if (tripBlocks.tripFacts.max_elevation) {
            packagePayload.trip_max_elevation = tripBlocks.tripFacts.max_elevation;
          }
          if (tripBlocks.tripFacts.best_season) {
            packagePayload.trip_best_season = tripBlocks.tripFacts.best_season;
          }
          if (tripBlocks.tripFacts.meals) {
            packagePayload.trip_meals = tripBlocks.tripFacts.meals;
          }
          if (tripBlocks.tripFacts.accommodation) {
            packagePayload.trip_accommodation = tripBlocks.tripFacts.accommodation;
          }
          if (tripBlocks.tripFacts.transportation) {
            packagePayload.trip_transportations = tripBlocks.tripFacts.transportation;
          }
          if (tripBlocks.relatedTripFacts) {
            packagePayload.related_trip_facts = tripBlocks.relatedTripFacts;
          }
          if (Array.isArray(tripBlocks.galleryAttachmentIds) && tripBlocks.galleryAttachmentIds.length) {
            const galleryFromBlocks = tripBlocks.galleryAttachmentIds
              .map((id) => attachmentUrlFromId(id))
              .filter(Boolean);
            if (galleryFromBlocks.length) {
              packagePayload.imageGallary = uniqueBy(
                [...(packagePayload.imageGallary || []), ...galleryFromBlocks],
                (url) => url
              );
            }
          }
          packagePayload.acf_blocks = tripBlocks.raw;
        }

        const blogPayload = buildBlogPayload({
          post,
          tags,
          featuredImage,
          allMeta,
        });
        const travelPayload = buildTravelPayload({
          post,
          allMeta,
        });
        const reviewPayload = buildReviewPayload({
          post,
          allMeta,
          acf,
          featuredImage,
          imageGallery,
        });
        const cmsPayload = buildCmsContentPayload({
          post,
          allMeta,
          featuredImage,
        });
        const cmsSectionPayloads = buildCmsSectionPayloads({
          post,
          cmsPayload,
          featuredImage,
          attachmentUrlFromId,
          allMeta,
          acf,
        });
        const targetTable = chooseTargetTable(post.post_type, args);
        if (targetTable === "Reviews") {
          reviewPayload.packageIds = await resolvePackageTourIdsFromWpIds({
            wpPackageIds: reviewPayload.packageWpIds || [],
            tx,
          });
        }
        delete reviewPayload.packageWpIds;

        await upsertTargetRecord({
          targetTable,
          packagePayload,
          blogPayload,
          travelPayload,
          reviewPayload,
          cmsPayload,
          cmsSectionPayloads,
          sourcePost: post,
          sourceMapPayload:
            targetTable === "cms_contents" ? cmsPayload.content?.importSource || {} : packagePayload.importSource,
          acf,
          meta: allMeta,
          taxonomy,
          featuredImage,
          tx,
          dryRun: args.dryRun,
          counters,
          args,
        });
        if (tx && args.dryRun) {
          await tx.rollback();
        } else if (tx) {
          await tx.commit();
        }
      } catch (innerError) {
        if (tx) {
          try {
            await tx.rollback();
          } catch (rollbackError) {
            if (args.verbose) {
              console.error("Rollback failed:", formatDbError(rollbackError));
            }
          }
        }
        counters.failed += 1;
        const detail = formatDbError(innerError);
        throw new Error(
          `Failed importing wp_post_id=${post.ID}, post_type=${post.post_type}. ${detail}`
        );
      }
    }
  } finally {
    await postgres.close();
  }

  console.info("WordPress ETL summary:");
  console.info(`- Selected: ${counters.selected}`);
  console.info(`- Inserted: ${counters.inserted}`);
  console.info(`- Updated by wpPostId: ${counters.updatedByWpId}`);
  console.info(`- Updated by slug (wordpress-only): ${counters.updatedBySlug}`);
  console.info(`- Skipped slug conflicts (non-wordpress rows): ${counters.skippedConflicts}`);
  console.info(`- Failed: ${counters.failed}`);
  console.info("- Per-target:");
  Object.entries(counters.byTarget).forEach(([target, stats]) => {
    console.info(
      `  - ${target}: inserted=${stats.inserted}, updated=${stats.updated}, skipped=${stats.skipped}`
    );
  });
  console.info(`- Mode: ${args.dryRun ? "dry-run (rolled back)" : "apply"}`);
}

main().catch((error) => {
  const detail =
    error?.message ||
    error?.parent?.message ||
    error?.original?.message ||
    "Unknown error";
  console.error("WordPress ETL failed:", detail);
  if (error?.stack) console.error(error.stack);
  if (error?.parent?.detail) console.error("Detail:", error.parent.detail);
  process.exit(1);
});
