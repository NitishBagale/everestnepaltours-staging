import { BASE_URL } from "@/config/Config";
import {
  buildReviewCountMap,
  getPackageKeys,
  normalizePackageRecord,
} from "@/lib/packageListing";

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

const unwrapData = (payload) => {
  if (payload && typeof payload === "object" && "success" in payload) {
    return payload.success ? payload.data : null;
  }
  return payload;
};

async function fetchPackageById(id) {
  if (!id) return null;
  const payload = await fetchJson(`/package-tour/${id}`, null);
  const data = unwrapData(payload);
  return data ? normalizePackageRecord(data) : null;
}

async function fetchReviewById(id) {
  if (!id) return null;
  const payload = await fetchJson(`/review/${id}`, null);
  return unwrapData(payload);
}

async function fetchReviewsByPackageTourId(id) {
  if (!id) return [];
  const payload = await fetchJson(`/review/package-tour/${id}`, []);
  const data = unwrapData(payload);
  return Array.isArray(data) ? data : [];
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
  const settingsPayload = await fetchJson("/settings/get", {});

  const settings = Array.isArray(settingsPayload?.data) ? settingsPayload.data : [];
  const homeSettings =
    settings.find((setting) => setting?.name === "hero")?.settings || {};

  const featuredIds = Array.isArray(homeSettings.featuredPackages?.packageIds)
    ? homeSettings.featuredPackages.packageIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  const reviewIds = Array.isArray(homeSettings.reviews?.reviewIds)
    ? homeSettings.reviews.reviewIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];

  const [packages, reviews] = await Promise.all([
    Promise.all(featuredIds.map((id) => fetchPackageById(id))),
    Promise.all(reviewIds.map((id) => fetchReviewById(id))),
  ]);
  const selectedPackages = packages.filter(
    (pkg) => pkg && (pkg.id || pkg._id || pkg.slug || pkg.title)
  );
  const selectedReviews = reviews.filter(
    (review) => review && (review.id || review._id)
  );

  const packageReviewGroups = await Promise.all(
    selectedPackages.map((pkg) => fetchReviewsByPackageTourId(pkg.id))
  );

  let finalPackages = selectedPackages;
  if (featuredIds.length > 0 && finalPackages.length === 0) {
    const fallbackPayload = await fetchJson("/package-tour/", []);
    const fallbackPackages = Array.isArray(fallbackPayload?.data)
      ? fallbackPayload.data
      : Array.isArray(fallbackPayload)
        ? fallbackPayload
        : [];
    const normalizedFallback = fallbackPackages.map(normalizePackageRecord);
    finalPackages = normalizedFallback.filter((pkg) =>
      featuredIds.some((id) => getPackageKeys(pkg).includes(id))
    );
  }

  return {
    heroImages: Array.isArray(homeSettings.images) ? homeSettings.images : [],
    welcome: homeSettings.welcome || {},
    whyWithUs: homeSettings.whyWithUs || {},
    featuredPackages: homeSettings.featuredPackages || {},
    reviewsSection: homeSettings.reviews || {},
    packages: finalPackages,
    reviews: selectedReviews,
    reviewCountMap: buildReviewCountMap(packageReviewGroups.flat()),
  };
}
