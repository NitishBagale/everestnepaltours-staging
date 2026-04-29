import { BASE_URL } from "@/config/Config";
import { buildReviewCountMap, normalizePackageRecord } from "@/lib/packageListing";

const SITE_REVALIDATE_SECONDS = 300;

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: SITE_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${path}: ${response.status}`);
    }

    return await response.json();
  } catch {
    return fallback;
  }
}

const createSlug = (text = "") =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function getNavigationData() {
  const categoriesPayload = await fetchJson("/category/", {});
  const categoriesRaw =
    categoriesPayload?.success && Array.isArray(categoriesPayload.data)
      ? categoriesPayload.data
      : [];

  const categories = [...categoriesRaw].sort((a, b) => {
    const aOrder = Number(a.sort_order) || 0;
    const bOrder = Number(b.sort_order) || 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  const links = await Promise.all(
    categories.map(async (cat) => {
      const categoryId = cat._id || cat.id;
      const categorySlug = cat.slug || createSlug(cat.name);
      const cmsPayload = await fetchJson(`/cms/category/${categoryId}`, {});
      const cmsPages = cmsPayload?.success && Array.isArray(cmsPayload.data)
        ? cmsPayload.data
        : [];

      const dropdown = cmsPages
        .map((page) => {
          const sectionSlug = page.slug || createSlug(page.section);
          const content =
            typeof page.content === "string"
              ? (() => {
                  try {
                    return JSON.parse(page.content);
                  } catch {
                    return {};
                  }
                })()
              : page.content || {};
          const rawSortOrder =
            page.sort_order ??
            content.sort_order ??
            content.sortOrder ??
            page.sortOrder;

          return {
            label: page.content?.title || page.section,
            href: `/${sectionSlug}`,
            sort_order: Number.isFinite(Number(rawSortOrder))
              ? Number(rawSortOrder)
              : 9999,
          };
        })
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
          return String(a.label || "").localeCompare(String(b.label || ""));
        });

      return {
        label: cat.name,
        href: `/${categorySlug}`,
        dropdown: dropdown.length ? dropdown : null,
      };
    })
  );

  return links;
}

export async function getHomePageData() {
  const [settingsPayload, packagesPayload, reviewsPayload] = await Promise.all([
    fetchJson("/settings/get", {}),
    fetchJson("/package-tour/", []),
    fetchJson("/review/?limit=5000", []),
  ]);

  const settings = Array.isArray(settingsPayload?.data) ? settingsPayload.data : [];
  const homeSettings =
    settings.find((setting) => setting?.name === "hero")?.settings || {};

  const packageList = Array.isArray(packagesPayload?.data)
    ? packagesPayload.data
    : Array.isArray(packagesPayload)
      ? packagesPayload
      : [];

  const reviews = Array.isArray(reviewsPayload?.data)
    ? reviewsPayload.data
    : Array.isArray(reviewsPayload?.reviews)
      ? reviewsPayload.reviews
      : Array.isArray(reviewsPayload)
        ? reviewsPayload
        : [];

  return {
    heroImages: Array.isArray(homeSettings.images) ? homeSettings.images : [],
    welcome: homeSettings.welcome || {},
    whyWithUs: homeSettings.whyWithUs || {},
    featuredPackages: homeSettings.featuredPackages || {},
    reviewsSection: homeSettings.reviews || {},
    packages: packageList.map(normalizePackageRecord),
    reviews,
    reviewCountMap: buildReviewCountMap(reviews),
  };
}
