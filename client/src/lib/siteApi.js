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
