import React from "react";
import Link from "next/link";
import { getMediaObject, getMediaUrl } from "@/lib/media";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const DEFAULT_TITLE = "Travel Information | Everest Vacation";
const DEFAULT_DESCRIPTION =
  "Helpful travel information, tips, and guides for planning your Nepal, Bhutan, or Tibet journey.";
const DEFAULT_KEYWORDS =
  "travel information, Nepal travel tips, Bhutan guide, Tibet travel advice";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fetchTravelInfoList = async () => {
  try {
    const response = await fetch(`${BASE_URL}/travel-info/?published=true`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = await response.json();
    const travelPages = payload?.data || payload || [];
    const normalized = Array.isArray(travelPages) ? travelPages : [];
    return normalized.sort((a, b) => {
      const orderA = Number.isFinite(a.sort_order) ? a.sort_order : 9999;
      const orderB = Number.isFinite(b.sort_order) ? b.sort_order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } catch (err) {
    console.error("Error fetching travel information pages:", err);
    return [];
  }
};

const fetchTravelInfoCms = async () => {
  try {
    const res = await fetch(`${BASE_URL}/cms/`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const list = json?.data || [];
    return list.find((item) => item.slug === "travel-information") || null;
  } catch {
    return null;
  }
};

export const generateMetadata = async () => {
  const [pages, cms] = await Promise.all([
    fetchTravelInfoList(),
    fetchTravelInfoCms(),
  ]);
  const cmsTitle = cms?.meta_title || DEFAULT_TITLE;
  const cmsDescription = cms?.meta_description || DEFAULT_DESCRIPTION;
  const cmsKeywords = cms?.meta_keywords || DEFAULT_KEYWORDS;
  const bannerMedia = cms?.content?.pageBannerImage || cms?.content?.coverImage;
  const bannerImage =
    getMediaUrl(getMediaObject(bannerMedia), "large") ||
    pages?.[0]?.coverImage ||
    DEFAULT_IMAGE;

  return {
    title: cmsTitle,
    description: cmsDescription,
    keywords: cmsKeywords,
    openGraph: {
      title: cmsTitle,
      description: cmsDescription,
      type: "website",
      images: bannerImage ? [{ url: bannerImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: cmsTitle,
      description: cmsDescription,
      images: bannerImage ? [bannerImage] : undefined,
    },
  };
};

const TravelInformationPage = async () => {
  const [pages, cms] = await Promise.all([
    fetchTravelInfoList(),
    fetchTravelInfoCms(),
  ]);
  const contentTitle = cms?.content?.title || "Travel Information";
  const contentSubtitle = cms?.content?.subtitle || "";

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          <div className="flex flex-col gap-3 text-left">
            {contentSubtitle && (
              <p className="text-sm uppercase tracking-wide text-emerald-600">
                {contentSubtitle}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {contentTitle}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12">

        {/* Grid Layout */}
        {pages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <Link
                key={page.id || page.slug}
                href={`/travel-information/${page.slug}`}
              >
                <div className="h-full p-6 bg-slate-50 rounded-lg shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 cursor-pointer group border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-green-600 transition-colors">
                    {page.title || page.slug}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-slate-600">
              No travel information pages available yet.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelInformationPage;
