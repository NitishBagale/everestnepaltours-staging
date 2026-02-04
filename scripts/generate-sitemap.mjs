import { writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://everestvacations.com";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const OUT_DIR = path.resolve("client/public");

const slugify = (text = "") =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniq = (items) => Array.from(new Set(items.filter(Boolean)));

const safeFetchJson = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[sitemap] ${url} -> ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.warn(`[sitemap] ${url} -> ${error.message}`);
    return null;
  }
};

const buildUrlset = (urls) => {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((loc) => `  <url><loc>${loc}</loc><lastmod>${today}</lastmod></url>`)
      .join("\n") +
    "\n</urlset>\n";
};

const buildIndex = (sitemaps) => {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemaps
      .map((loc) => `  <sitemap><loc>${loc}</loc><lastmod>${today}</lastmod></sitemap>`)
      .join("\n") +
    "\n</sitemapindex>\n";
};

const main = async () => {
  const [cmsRes, pkgRes, blogRes, travelRes, teamRes] = await Promise.all([
    safeFetchJson(`${API_BASE}/cms/`),
    safeFetchJson(`${API_BASE}/package-tour/`),
    safeFetchJson(`${API_BASE}/blog/`),
    safeFetchJson(`${API_BASE}/travel-info/?published=true`),
    safeFetchJson(`${API_BASE}/team/`),
  ]);

  const cmsPages = Array.isArray(cmsRes?.data) ? cmsRes.data : [];
  const packages = Array.isArray(pkgRes?.data) ? pkgRes.data : Array.isArray(pkgRes) ? pkgRes : [];
  const blogs = Array.isArray(blogRes?.data) ? blogRes.data : Array.isArray(blogRes) ? blogRes : [];
  const travelInfos = Array.isArray(travelRes?.data) ? travelRes.data : Array.isArray(travelRes) ? travelRes : [];
  const teamMembers = Array.isArray(teamRes?.teams) ? teamRes.teams : Array.isArray(teamRes?.data) ? teamRes.data : Array.isArray(teamRes) ? teamRes : [];

  const cmsUrls = cmsPages.map((page) => {
    const slug = page.slug || slugify(page.section);
    return slug ? `${SITE_URL}/${slug}` : null;
  });

  const packageUrls = packages.map((pkg) => {
    const item = pkg?.package || pkg || {};
    const slug = item.slug || slugify(item.title);
    return slug ? `${SITE_URL}/${slug}` : null;
  });

  const blogUrls = blogs.map((post) => {
    const slug = post.slug || slugify(post.mainTitle || post.title);
    return slug ? `${SITE_URL}/travel-blog/${slug}` : null;
  });

  const travelInfoUrls = travelInfos.map((item) => {
    const slug = item.slug || slugify(item.title);
    return slug ? `${SITE_URL}/travel-information/${slug}` : null;
  });

  const teamUrls = teamMembers.map((member) => {
    const name = member?.name;
    return name ? `${SITE_URL}/team/${encodeURIComponent(name)}` : null;
  });

  const urls = uniq([
    `${SITE_URL}/`,
    ...cmsUrls,
    ...packageUrls,
    `${SITE_URL}/travel-blog`,
    ...blogUrls,
    `${SITE_URL}/travel-information`,
    ...travelInfoUrls,
    ...teamUrls,
  ]);

  const sitemapXml = buildUrlset(urls);
  const sitemapIndexXml = buildIndex([`${SITE_URL}/sitemap.xml`]);

  await writeFile(path.join(OUT_DIR, "sitemap.xml"), sitemapXml, "utf8");
  await writeFile(path.join(OUT_DIR, "sitemap_index.xml"), sitemapIndexXml, "utf8");

  console.log(`[sitemap] wrote ${urls.length} urls`);
};

main();
