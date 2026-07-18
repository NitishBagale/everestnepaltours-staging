import { BASE_URL } from "@/config/Config";
import { seoSite } from "@/lib/seo";

const STATIC_ROUTES = [
  "/",
  "/travel-blog",
  "/travel-information",
  "/contact-form",
  "/reviews",
];

const RESERVED_CMS_SLUGS = new Set([
  "travel-blog",
  "travel-information",
  "contact-form",
  "reviews",
]);

const slugify = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/,/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const stripHtml = (value = "") =>
  String(value).replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").trim();

const normalizeDate = (value) => {
  const date = value ? new Date(value) : null;
  return Number.isNaN(date?.getTime()) ? new Date() : date;
};

const toUrlEntry = (path, lastModified, priority = 0.7, changeFrequency = "weekly") => ({
  url: `${seoSite.url}${path}`,
  lastModified: normalizeDate(lastModified),
  changeFrequency,
  priority,
});

const fetchJson = async (path) => {
  try {
    const response = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const getCmsEntries = async () => {
  const payload = await fetchJson("/cms/");
  const items = Array.isArray(payload?.data) ? payload.data : [];

  return items
    .filter((item) => {
      const status = String(item?.status || "").toLowerCase();
      return !["draft", "unpublished", "false"].includes(status);
    })
    .map((item) => ({
      slug: item?.slug || slugify(item?.section) || slugify(item?.content?.title),
      updatedAt: item?.updatedAt || item?.createdAt,
    }))
    .filter((item) => item.slug && !RESERVED_CMS_SLUGS.has(item.slug))
    .map((item) => toUrlEntry(`/${item.slug}`, item.updatedAt, 0.7, "monthly"));
};

const getBlogEntries = async () => {
  const payload = await fetchJson("/blog/");
  const posts = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

  return posts
    .map((post) => ({
      slug: post?.slug || slugify(post?.mainTitle),
      updatedAt: post?.updatedAt || post?.createdAt,
    }))
    .filter((post) => post.slug)
    .map((post, index) =>
      toUrlEntry(`/travel-blog/${post.slug}`, post.updatedAt, index === 0 ? 0.8 : 0.7, "weekly")
    );
};

const getTravelInfoEntries = async () => {
  const payload = await fetchJson("/travel-info/?published=true");
  const pages = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

  return pages
    .map((page) => ({
      slug: page?.slug || slugify(page?.title),
      updatedAt: page?.updatedAt || page?.createdAt,
    }))
    .filter((page) => page.slug)
    .map((page) =>
      toUrlEntry(`/travel-information/${page.slug}`, page.updatedAt, 0.7, "monthly")
    );
};

const getPackageEntries = async () => {
  const payload = await fetchJson("/package-tour/");
  const packages = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

  return packages
    .map((record) => {
      const item = record?.package || record || {};
      return {
        slug: item?.slug || slugify(item?.title),
        updatedAt: item?.updatedAt || record?.updatedAt || item?.createdAt || record?.createdAt,
      };
    })
    .filter((item) => item.slug)
    .map((item) => toUrlEntry(`/${item.slug}`, item.updatedAt, 0.8, "weekly"));
};

const getTeamEntries = async () => {
  const payload = await fetchJson("/team/");
  const members = Array.isArray(payload?.teams)
    ? payload.teams
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  return members
    .map((member) => ({
      slug: encodeURIComponent(member?.name || ""),
      updatedAt: member?.updatedAt || member?.createdAt,
      has_detail_page: member?.has_detail_page === true,
      description: member?.description || "",
    }))
    .filter((member) => member.slug && member.has_detail_page && stripHtml(member.description).trim())
    .map((member) => toUrlEntry(`/team/${member.slug}`, member.updatedAt, 0.5, "monthly"));
};

export default async function sitemap() {
  const [cmsEntries, blogEntries, travelInfoEntries, packageEntries, teamEntries] =
    await Promise.all([
      getCmsEntries(),
      getBlogEntries(),
      getTravelInfoEntries(),
      getPackageEntries(),
      getTeamEntries(),
    ]);

  const staticEntries = STATIC_ROUTES.map((path, index) =>
    toUrlEntry(path, new Date(), index === 0 ? 1 : 0.8, index === 0 ? "daily" : "weekly")
  );

  const entries = [
    ...staticEntries,
    ...cmsEntries,
    ...blogEntries,
    ...travelInfoEntries,
    ...packageEntries,
    ...teamEntries,
  ];

  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}
