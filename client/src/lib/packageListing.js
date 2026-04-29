import { getMediaAlt } from "@/lib/media";

export const normalizePackageRecord = (record) => {
  const source =
    record?.package && typeof record.package === "object"
      ? record.package
      : record || {};

  const normalizedId =
    source.id ??
    source._id ??
    record?.id ??
    record?._id ??
    source.packageId ??
    source.package_id ??
    null;

  return {
    ...source,
    id: normalizedId,
  };
};

export const getPackageKey = (pkg) => {
  const key =
    pkg?.id ??
    pkg?._id ??
    pkg?.packageId ??
    pkg?.package_id ??
    pkg?.slug ??
    pkg?.title;

  return key == null ? "" : String(key);
};

export const getPackageKeys = (pkg) => {
  const candidates = [
    pkg?.id,
    pkg?._id,
    pkg?.packageId,
    pkg?.package_id,
    pkg?.slug,
    pkg?.title,
  ];

  return [...new Set(candidates.map((value) => String(value || "").trim()).filter(Boolean))];
};

export const buildReviewCountMap = (reviews = []) => {
  const countMap = {};

  (Array.isArray(reviews) ? reviews : []).forEach((review) => {
    const packageIds = Array.isArray(review?.packageIds) ? review.packageIds : [];
    packageIds.forEach((id) => {
      const key = String(id);
      countMap[key] = (countMap[key] || 0) + 1;
    });
  });

  return countMap;
};

export const getPackageReviewCount = (pkg, countMap = {}) => {
  const fromPackage =
    pkg?.reviewCount ??
    pkg?.reviews ??
    pkg?.review_count ??
    pkg?.reviews_count ??
    pkg?.totalReviews ??
    pkg?.total_reviews;

  const numeric = Number(fromPackage);
  if (Number.isFinite(numeric) && numeric >= 0) return numeric;

  const key = getPackageKey(pkg);
  if (key && Number.isFinite(Number(countMap[key]))) {
    return Number(countMap[key]);
  }

  return 0;
};

export const getPackageCardAlt = (media, pkg, fallback = "Tour package image") => {
  const mediaAlt = String(getMediaAlt(media, "") || "").trim();
  if (mediaAlt) return mediaAlt;

  const title = String(pkg?.title || pkg?.name || "").trim();
  if (title) return `${title} package image`;

  return fallback;
};
