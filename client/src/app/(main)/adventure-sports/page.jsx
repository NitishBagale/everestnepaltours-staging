import AdventureSportsClient from "./AdventureSportsClient";

const slugify = (value) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getPageData = async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/cms/`, { cache: "no-store" });
  const payload = await response.json();
  const list = payload?.data || [];

  const routeSlug = "adventure-sports";
  const sections = ["Adventure Sports", "adventure-sports", "adventure sports"];

  const page = list.find((item) => {
    const pageSlug = item.slug || slugify(item.section);
    return pageSlug === routeSlug || sections.includes(item.section);
  });

  return page || null;
};

export const generateMetadata = async () => {
  try {
    const page = await getPageData();
    if (!page) {
      return {
        title: "Adventure Sports",
        description: "Find thrilling adventure sports experiences across the Himalayas.",
      };
    }

    const stripHtml = (value) =>
      typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";
    const metaTitle =
      page.meta_title || page.content?.title || page.section || "Adventure Sports";
    const metaDescription =
      page.meta_description ||
      stripHtml(page.content?.description).slice(0, 160) ||
      "Find thrilling adventure sports experiences across the Himalayas.";
    const metaKeywords = page.meta_keywords || "";

    return {
      title: metaTitle,
      description: metaDescription,
      keywords: metaKeywords || undefined,
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: "website",
      },
    };
  } catch (error) {
    return {
      title: "Adventure Sports",
      description: "Find thrilling adventure sports experiences across the Himalayas.",
    };
  }
};

const AdventureSportsPage = async () => {
  let pageData = null;
  let initialError = null;

  try {
    pageData = await getPageData();
    if (!pageData) {
      initialError = "Page not found";
    }
  } catch (error) {
    initialError = "Failed to load page content";
  }

  return (
    <AdventureSportsClient initialData={pageData} initialError={initialError} />
  );
};

export default AdventureSportsPage;
