import ReviewsClient from "./ReviewsClient";
import { BASE_URL } from "@/config/Config";

const DEFAULT_METADATA = {
  title: "Reviews | Everest Vacation",
  description:
    "Read guest reviews and experiences from Everest Vacation tours across Nepal, Bhutan, and Tibet.",
  keywords: "Everest Vacation reviews, guest feedback, Nepal tour reviews",
};

const stripHtml = (value) =>
  typeof value === "string" ? value.replace(/<[^>]+>/g, "").trim() : "";

const fetchReviewsCms = async () => {
  try {
    const res = await fetch(`${BASE_URL}/cms/`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const list = data?.data || [];
    return list.find((item) => item.slug === "reviews") || null;
  } catch (error) {
    console.error("Failed to load reviews CMS metadata:", error);
    return null;
  }
};

export const generateMetadata = async () => {
  const cms = await fetchReviewsCms();

  const title =
    cms?.meta_title || cms?.content?.title || DEFAULT_METADATA.title;
  const description =
    cms?.meta_description ||
    stripHtml(cms?.content?.description) ||
    DEFAULT_METADATA.description;
  const keywords = cms?.meta_keywords || DEFAULT_METADATA.keywords;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
};

const ReviewsPage = async () => {
  return <ReviewsClient />;
};

export default ReviewsPage;
