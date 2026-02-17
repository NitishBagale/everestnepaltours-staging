"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { getMediaObject, getMediaUrl } from "@/lib/media";
import {
  buildReviewCountMap,
  getPackageCardAlt,
  getPackageReviewCount,
  normalizePackageRecord,
} from "@/lib/packageListing";

// Filter popular packages by tags / seo keywords / title keyword
const Popular = ({
  tags = [],
  seoKeywords = [],
  titleKeyword = "",
  heading = "Recommended Tours",
}) => {
  const [data, setData] = useState([]);
  const [reviewCountMap, setReviewCountMap] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAllPackages = async () => {
      try {
        const packagesRes = await axios.get(`${BASE_URL}/package-tour/`);
        const packageList = packagesRes.data?.data || packagesRes.data || [];
        setData(packageList.map(normalizePackageRecord));

        const reviewsRes = await axios
          .get(`${BASE_URL}/review/?limit=5000`)
          .catch(() => null);
        const reviewList = reviewsRes
          ? reviewsRes.data?.data || reviewsRes.data?.reviews || reviewsRes.data || []
          : [];
        setReviewCountMap(buildReviewCountMap(reviewList));
      } catch (error) {
        console.error("Error fetching popular packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPackages();
  }, []);

  const filtered = useMemo(() => {
    const norm = (val) => (val || "").toString().toLowerCase().trim();
    const tagList = tags.map(norm);
    const seoList = seoKeywords.map(norm);
    const titleNeedle = norm(titleKeyword);

    return (data || []).filter((pkg) => {
        const pkgTags = Array.isArray(pkg.tags) ? pkg.tags.map(norm) : [];
        const pkgSeo = Array.isArray(pkg.seoKeywords)
          ? pkg.seoKeywords.map(norm)
          : norm(pkg.seoKeywords || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
        const pkgTitle = norm(pkg.title);

        const matchesTags = tagList.length
          ? tagList.some((t) => pkgTags.includes(t))
          : false;
        const matchesSeo = seoList.length
          ? seoList.some((s) => pkgSeo.includes(s))
          : false;
        const matchesTitle = titleNeedle
          ? pkgTitle.includes(titleNeedle)
          : false;

        const noFilters = !tagList.length && !seoList.length && !titleNeedle;
        const matchesAny = matchesTags || matchesSeo || matchesTitle;

        return noFilters ? true : matchesAny;
      });
  }, [data, tags, seoKeywords, titleKeyword]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        Loading popular tours...
      </div>
    );
  }

  return (
    <section className="font-sans bg-white py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 text-left">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-800">
            {heading}
          </h2>
          {/* <hr className="mt-2 w-16 border-2 border-[#3c9f87]" /> */}
        </div>

        {filtered.length === 0 ? (
          <p className="text-base text-gray-600">No matching popular packages.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, index) => {
              const slug = item.title
                ? item.title
                    .toLowerCase()
                    .replace(/,/g, "")
                    .replace(/\s+/g, "-")
                : "";
              const media = getMediaObject(item.mainImage || item.image);
              const imageSrc = getMediaUrl(media, "medium") || "bhutan.jpg";
              const reviewCount = getPackageReviewCount(item, reviewCountMap);
              const imageAlt = getPackageCardAlt(media, item);

              return (
                <div
                  key={item.id ?? index}
                  className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200"
                >
                  <div
                    className="relative h-56 w-full overflow-hidden cursor-pointer"
                    onClick={() => slug && router.push(`/${slug}`)}
                  >
                    <img
                      src={imageSrc}
                      alt={imageAlt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="pt-5 px-4 pb-4 flex flex-col grow">
                    <h3 className="text-xl font-medium text-gray-900 mb-2 leading-tight">
                      {item.title || "Popular Tour Package"}
                    </h3>

                    <div className="mb-4">
                      <p className="text-base text-emerald-600 inline leading-relaxed">
                        {item.sub_description || item.subDescription
                          ? item.sub_description || item.subDescription
                          : "Experience the best of this destination."}
                      </p>
                      <span className="text-base text-gray-400 ml-1">
                        ({reviewCount} reviews)
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 text-gray-600 text-base">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>
                          {item.duration || "5 Days"},{" "}
                          {item.tourType || item.type || "Private Tour"}
                        </span>
                      </div>

                      <button
                        onClick={() => slug && router.push(`/${slug}`)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-base font-medium px-4 py-2 rounded shadow-sm transition-colors duration-200"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Popular;
