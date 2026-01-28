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
  return media.altText || media.title || fallback;
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
