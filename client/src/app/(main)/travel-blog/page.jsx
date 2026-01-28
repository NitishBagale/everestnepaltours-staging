import TravelBlogClient from "./TravelBlogClient";

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

export const generateMetadata = async () => {
  const posts = await fetchBlogList();
  const ogImage = posts?.[0]?.coverImage || DEFAULT_IMAGE;

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    openGraph: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: ogImage ? [ogImage] : undefined,
    },
  };
};

const BlogListingPage = async () => {
  const posts = await fetchBlogList();
  return <TravelBlogClient posts={posts} />;
};

export default BlogListingPage;
