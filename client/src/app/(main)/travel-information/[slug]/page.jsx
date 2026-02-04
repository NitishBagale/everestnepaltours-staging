import TravelInfoDetailClient from "./TravelInfoDetailClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const DEFAULT_TITLE = "Travel Information | Everest Vacation";
const DEFAULT_DESCRIPTION =
  "Helpful travel information, tips, and guides for planning your Nepal, Bhutan, or Tibet journey.";
const DEFAULT_KEYWORDS =
  "travel information, Nepal travel tips, Bhutan guide, Tibet travel advice";
const DEFAULT_IMAGE = "";

export const dynamic = "force-dynamic";

const stripHtml = (value) => (value || "").replace(/<[^>]*>/g, "").trim();

const fetchTravelInfoBySlug = async (slug) => {
  try {
    const res = await fetch(
      `${BASE_URL}/travel-info/related?slug=${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { item: null, relatedItems: [] };
    const json = await res.json();
    const payload = json?.data || json;
    if (payload?.item) {
      return {
        item: payload.item,
        relatedItems: Array.isArray(payload.relatedItems)
          ? payload.relatedItems
          : [],
      };
    }
  } catch {
    return { item: null, relatedItems: [] };
  }

  return { item: null, relatedItems: [] };
};

export const generateMetadata = async ({ params } = {}) => {
  const resolvedParams = params ? await params : {};
  const slug = resolvedParams?.slug ?? "";
  const { item } = await fetchTravelInfoBySlug(slug);

  if (!item) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      keywords: DEFAULT_KEYWORDS,
      openGraph: {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        type: "article",
        images: DEFAULT_IMAGE ? [{ url: DEFAULT_IMAGE }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: DEFAULT_IMAGE ? [DEFAULT_IMAGE] : undefined,
      },
    };
  }

  const title = item.meta_title || item.title || DEFAULT_TITLE;
  const description =
    item.meta_description ||
    stripHtml(item.description).slice(0, 160) ||
    DEFAULT_DESCRIPTION;
  const keywords = item.meta_keywords || DEFAULT_KEYWORDS;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "article",
      images: DEFAULT_IMAGE ? [{ url: DEFAULT_IMAGE }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: DEFAULT_IMAGE ? [DEFAULT_IMAGE] : undefined,
    },
  };
};

const TravelInformationDetailPage = async ({ params } = {}) => {
  const resolvedParams = params ? await params : {};
  const slug = resolvedParams?.slug ?? "";
  const { item, relatedItems } = await fetchTravelInfoBySlug(slug);

  return <TravelInfoDetailClient item={item} relatedItems={relatedItems} />;
};

export default TravelInformationDetailPage;
