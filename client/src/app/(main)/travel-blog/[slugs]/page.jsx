import BlogDetailClient from "./BlogDetailClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const DEFAULT_TITLE = "Travel Blog | Everest Vacation";
const DEFAULT_DESCRIPTION =
  "Read travel stories, trekking tips, and destination guides for Nepal, Bhutan, and Tibet.";
const DEFAULT_KEYWORDS =
  "travel blog, Nepal travel tips, Bhutan guides, Tibet trekking, Everest Vacation";
const DEFAULT_IMAGE = "https://placehold.co/1920x400?text=Blog+Banner";

export const dynamic = "force-dynamic";

const stripHtml = (value) => (value || "").replace(/<[^>]*>/g, "").trim();

const fetchBlogBySlug = async (slug) => {
  try {
    const res = await fetch(`${BASE_URL}/blog/related?slug=${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return { blog: null, related: [] };
    const json = await res.json();
    const payload = json?.data || json;

    if (payload?.blog) {
      return {
        blog: payload.blog,
        related: Array.isArray(payload.relatedBlogs) ? payload.relatedBlogs : [],
      };
    }

    if (Array.isArray(payload) && payload.length > 0) {
      return { blog: payload[0], related: payload.slice(1, 4) };
    }

    if (payload?.mainTitle) {
      return { blog: payload, related: [] };
    }
  } catch {
    return { blog: null, related: [] };
  }

  return { blog: null, related: [] };
};


export const generateMetadata = async ({ params } = {}) => {
  const resolvedParams = params ? await params : {};
  const slugs = resolvedParams?.slugs ?? "";
  const { blog } = await fetchBlogBySlug(slugs);

  if (!blog) {
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

  const title = blog.meta_title || blog.mainTitle || DEFAULT_TITLE;
  const description =
    blog.meta_description ||
    blog.description ||
    stripHtml(blog.blogContant).slice(0, 160) ||
    DEFAULT_DESCRIPTION;
  const keywords = blog.meta_keywords || DEFAULT_KEYWORDS;
  const image = blog.coverImage || DEFAULT_IMAGE;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
};

const BlogPage = async ({ params } = {}) => {
  const resolvedParams = params ? await params : {};
  const slugs = resolvedParams?.slugs ?? "";
  const { blog, related } = await fetchBlogBySlug(slugs);
  return <BlogDetailClient blogData={blog} relatedBlogs={related} />;
};

export default BlogPage;
