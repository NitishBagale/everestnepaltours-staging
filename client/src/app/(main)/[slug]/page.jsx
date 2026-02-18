import { cache } from "react";
import { BASE_URL } from "@/config/Config";
import { getMediaObject, getMediaUrl } from "@/lib/media";
import CmsContentRenderer from "@/components/CmsContentRenderer";
import PackageDetailClient from "@/components/PackageDetailClient";

const slugify = (value) =>
  value
    ? value
        .toLowerCase()
        .trim()
        .replace(/,/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
    : "";

const stripHtml = (value) =>
  typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";

const normalizeSlug = (value) => slugify(String(value || ""));

const getPackageSlug = (pkg) => {
  const item = pkg?.package || pkg || {};
  return item.slug || slugify(item.title);
};

const normalizeCmsItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getCmsOgImage = (pageData) => {
  const sections = Array.isArray(pageData?.sections) ? pageData.sections : [];
  const gallerySection = sections.find(
    (section) =>
      section?.is_enabled !== false &&
      section?.type === "gallery" &&
      Array.isArray(section?.data?.galleryImages) &&
      section.data.galleryImages.length > 0
  );

  if (gallerySection) {
    return getMediaUrl(getMediaObject(gallerySection.data.galleryImages[0]), "large");
  }

  return getMediaUrl(getMediaObject(pageData?.content?.galleryImages?.[0]), "large");
};

const fetchPackageBySlug = cache(async (slug) => {
  if (!slug) return { tourRecord: null, tourData: null };

  const res = await fetch(`${BASE_URL}/package-tour/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return { tourRecord: null, tourData: null };
  }

  const data = await res.json();
  const allPackages = data?.data || [];
  const targetSlug = normalizeSlug(slug);
  const found = allPackages.find(
    (pkg) => normalizeSlug(getPackageSlug(pkg)) === targetSlug
  );

  return {
    tourRecord: found || null,
    tourData: found?.package || null,
  };
});

const getCmsBySlug = async (slug) => {
  try {
    const response = await fetch(`${BASE_URL}/cms/`, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json();
    const items = normalizeCmsItems(payload);
    const targetSlug = normalizeSlug(decodeURIComponent(slug));

    return (
      items.find((item) => {
        const statusValue = item?.status;
        const isExplicitlyUnpublished =
          statusValue === false ||
          statusValue === "Draft" ||
          statusValue === "draft" ||
          statusValue === "Unpublished" ||
          statusValue === "unpublished";
        if (isExplicitlyUnpublished) return false;

        const pageSlug =
          normalizeSlug(item?.slug) ||
          normalizeSlug(item?.section) ||
          normalizeSlug(item?.content?.title);
        return pageSlug === targetSlug;
      }) || null
    );
  } catch (error) {
    console.error("Error fetching CMS data:", error);
    return null;
  }
};

export const generateMetadata = async ({ params }) => {
  const { slug } = await params;
  const { tourData } = await fetchPackageBySlug(slug);
  if (tourData) {
    const metaTitle = tourData.meta_title || tourData.title || "Tour Package";
    const metaDescription =
      tourData.meta_description ||
      stripHtml(tourData.descriptions).slice(0, 160) ||
      "Explore this tour package and its day-by-day itinerary.";
    const metaKeywords =
      Array.isArray(tourData.tags) && tourData.tags.length > 0
        ? tourData.tags.join(", ")
        : "tour package, Nepal tours, Bhutan tours, Tibet tours";

    const mainImageMedia = getMediaObject(tourData.mainImage || tourData.image);
    const ogImage = getMediaUrl(mainImageMedia, "large");

    return {
      title: metaTitle,
      description: metaDescription,
      keywords: metaKeywords,
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: "website",
        images: ogImage ? [ogImage] : undefined,
      },
    };
  }

  const pageData = await getCmsBySlug(slug);
  if (!pageData) {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }

  const metaTitle =
    pageData.meta_title ||
    pageData.content?.title ||
    pageData.title ||
    pageData.section ||
    "Page";
  const metaDescription =
    pageData.meta_description ||
    stripHtml(pageData.content?.description || pageData.description).slice(
      0,
      160
    ) ||
    "Travel information and helpful details.";
  const metaKeywords = pageData.meta_keywords || "";
  const ogImage = getCmsOgImage(pageData);

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords || undefined,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
  };
};

const CmsPage = async ({ params }) => {
  const { slug } = await params;
  const { tourRecord, tourData } = await fetchPackageBySlug(slug);
  if (tourData) {
    return (
      <PackageDetailClient
        slugFromUrl={slug}
        initialTourRecord={tourRecord}
        initialTourData={tourData}
      />
    );
  }

  const pageData = await getCmsBySlug(slug);
  const error = pageData ? null : "Page not found";
  return <CmsContentRenderer pageData={pageData} error={error} />;
};

export default CmsPage;
