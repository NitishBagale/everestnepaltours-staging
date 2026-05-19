import TravelBlogClient from "./TravelBlogClient";
import { getMediaObject, getMediaUrl } from "@/lib/media";
import { buildSeoMetadata } from "@/lib/seo";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const DEFAULT_TITLE = "Travel Blog | Everest Vacation";
const DEFAULT_DESCRIPTION =
  "Read travel stories, trekking tips, and destination guides for Nepal, Bhutan, and Tibet.";
const DEFAULT_KEYWORDS =
  "travel blog, Nepal travel tips, Bhutan guides, Tibet trekking, Everest Vacation";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1920&auto=format&fit=crop";

export const dynamic = "force-dynamic";

const fetchBlogList = async () => {
  try {
    const res = await fetch(`${BASE_URL}/blog/`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data || json || [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const fetchBlogCms = async () => {
  try {
    const res = await fetch(`${BASE_URL}/cms/`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const list = json?.data || [];
    return list.find((item) => item.slug === "travel-blog") || null;
  } catch {
    return null;
  }
};

export const generateMetadata = async () => {
  const [posts, cms] = await Promise.all([fetchBlogList(), fetchBlogCms()]);
  const cmsTitle = cms?.meta_title || DEFAULT_TITLE;
  const cmsDescription = cms?.meta_description || DEFAULT_DESCRIPTION;
  const cmsKeywords = cms?.meta_keywords || DEFAULT_KEYWORDS;
  const bannerMedia =
    cms?.content?.pageBannerImage ||
    cms?.content?.coverImage ||
    posts?.[0]?.coverImage ||
    DEFAULT_IMAGE;
  const bannerImage = getMediaUrl(getMediaObject(bannerMedia), "large") || DEFAULT_IMAGE;
  const ogImage = bannerImage;

  return buildSeoMetadata({
    title: cmsTitle,
    description: cmsDescription,
    keywords: cmsKeywords,
    path: "/travel-blog",
    image: ogImage,
  });
};

const BlogListingPage = async () => {
  const [posts, cms] = await Promise.all([fetchBlogList(), fetchBlogCms()]);
  const bannerMedia =
    cms?.content?.pageBannerImage || cms?.content?.coverImage || "";
  const contentTitle = cms?.content?.title || "Travel Blog";
  const contentSubtitle = cms?.content?.subtitle || "";
  return (
    <TravelBlogClient
      posts={posts}
      bannerImage={bannerMedia}
      contentTitle={contentTitle}
      contentSubtitle={contentSubtitle}
    />
  );
};

export default BlogListingPage;
