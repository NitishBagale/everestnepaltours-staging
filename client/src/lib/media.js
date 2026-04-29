import { BASE_URL } from "@/config/Config";

const isAbsoluteUrl = (value) =>
  /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value) ||
  value.startsWith("data:") ||
  value.startsWith("blob:");

const normalizeUrl = (value) => {
  if (!value) return "";
  if (isAbsoluteUrl(value)) return value;

  const base = (BASE_URL || "").replace(/\/+$/, "");
  if (!base) return value;

  if (value.startsWith("/")) return `${base}${value}`;
  return `${base}/${value}`;
};

export const humanizeMediaName = (value = "") => {
  const withoutExtension = String(value || "")
    .split("/")
    .pop()
    .replace(/\.[^.]+$/, "");

  if (!withoutExtension) return "";

  const parts = withoutExtension
    .split(/[-_\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    const looksGenerated =
      /^[a-z0-9]{5,12}$/i.test(lastPart) &&
      /[a-z]/i.test(lastPart) &&
      /\d/.test(lastPart);

    if (looksGenerated) {
      parts.pop();
      if (parts.length > 1 && /^[a-z0-9]$/i.test(parts[parts.length - 1])) {
        parts.pop();
      }
    }
  }

  return parts.join(" ");
};

export const getMediaObject = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    return { url: value };
  }
  if (typeof value === "object") {
    return value;
  }
  return null;
};

export const getMediaUrl = (media, preferred = "large") => {
  if (!media) return "";
  if (typeof media === "string") return normalizeUrl(media);
  if (media.variants && media.variants[preferred])
    return normalizeUrl(media.variants[preferred]);
  if (media.url) return normalizeUrl(media.url);
  if (media.src) return normalizeUrl(media.src);
  if (media.path) return normalizeUrl(media.path);
  if (media.secure_url) return normalizeUrl(media.secure_url);
  return "";
};

export const getMediaAlt = (media, fallback = "") => {
  if (!media) return fallback;
  if (typeof media === "string") return fallback;
  return (
    humanizeMediaName(media.altText) ||
    humanizeMediaName(media.title) ||
    humanizeMediaName(media.originalName) ||
    humanizeMediaName(media.url) ||
    fallback
  );
};

export const getMediaSrcSet = (media) => {
  if (!media || typeof media === "string") return "";
  const variants = media.variants || {};
  const entries = [];
  if (variants.thumbnail) entries.push(`${normalizeUrl(variants.thumbnail)} 150w`);
  if (variants.small) entries.push(`${normalizeUrl(variants.small)} 400w`);
  if (variants.medium) entries.push(`${normalizeUrl(variants.medium)} 800w`);
  if (variants.large) entries.push(`${normalizeUrl(variants.large)} 1200w`);
  return entries.join(", ");
};

export const getMediaUniqueKey = (media) => {
  if (!media) return "";
  if (typeof media === "string") return media;
  return media.mediaId || media.id || media.url || "";
};

const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

export const isCloudinaryUrl = (value = "") =>
  String(value).includes("res.cloudinary.com") &&
  String(value).includes(CLOUDINARY_UPLOAD_SEGMENT);

export const getOptimizedCloudinaryUrl = (value, options = {}) => {
  const normalized = normalizeUrl(value || "");
  if (!normalized || !isCloudinaryUrl(normalized)) return normalized;

  const transformations = [
    options.crop ? `c_${options.crop}` : "",
    Number.isFinite(Number(options.width)) ? `w_${Number(options.width)}` : "",
    Number.isFinite(Number(options.height)) ? `h_${Number(options.height)}` : "",
    options.gravity ? `g_${options.gravity}` : "",
    options.format || "f_auto",
    options.quality ? `q_${options.quality}` : "q_auto",
  ].filter(Boolean);

  return normalized.replace(
    CLOUDINARY_UPLOAD_SEGMENT,
    `${CLOUDINARY_UPLOAD_SEGMENT}${transformations.join(",")}/`
  );
};
