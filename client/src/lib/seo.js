const SITE_NAME = "Everest Vacation";
const SITE_URL = "https://www.everestvacations.com";
const DEFAULT_TITLE = "Nepal, Bhutan & Tibet Tours";
const DEFAULT_DESCRIPTION =
  "Tailor-made Nepal, Bhutan, and Tibet journeys with local expertise, trusted support, and authentic local experiences.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_TWITTER_CARD = "summary_large_image";

const normalizePath = (path = "/") => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

export const buildCanonicalUrl = (path = "/") =>
  new URL(normalizePath(path), SITE_URL).toString();

export const stripHtml = (value) =>
  typeof value === "string" ? value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";

export const buildSeoMetadata = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noIndex = false,
} = {}) => {
  const canonical = buildCanonicalUrl(path);
  const resolvedTitle = title || DEFAULT_TITLE;
  const resolvedImage = image || DEFAULT_OG_IMAGE;
  const robots = noIndex
    ? {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      };

  return {
    title: resolvedTitle,
    description,
    keywords,
    alternates: {
      canonical,
    },
    robots,
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
    },
    twitter: {
      card: DEFAULT_TWITTER_CARD,
      title: resolvedTitle,
      description,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
  };
};

export const seoSite = {
  name: SITE_NAME,
  url: SITE_URL,
  defaultTitle: DEFAULT_TITLE,
  defaultDescription: DEFAULT_DESCRIPTION,
  defaultOgImage: DEFAULT_OG_IMAGE,
};
