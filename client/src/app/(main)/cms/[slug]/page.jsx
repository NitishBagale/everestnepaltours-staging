"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import { useParams } from "next/navigation";
import Link from "next/link";
import "@/app/quill.css";
import Head from "next/head";
import {
  getMediaAlt,
  getMediaObject,
  getMediaSrcSet,
  getMediaUrl,
} from "@/lib/media";

const CmsPageDetail = () => {
  const params = useParams();
  // Rename to avoid shadowing/TDZ
  const slugParam = decodeURIComponent(params.slug);

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPackages, setRelatedPackages] = useState([]);

  useEffect(() => {
    const fetchCmsPage = async () => {
      try {
        setLoading(true);

        const categoriesResponse = await axios.get(`${BASE_URL}/category/`);
        if (!categoriesResponse.data.success) {
          setError("Failed to load categories");
          setLoading(false);
          return;
        }

        let sectionName = null;

        for (const category of categoriesResponse.data.data) {
          if (category.id) {
            try {
              const cmsResponse = await axios.get(
                `${BASE_URL}/cms/category/${category.id}`
              );

              console.log(cmsResponse.data);
              if (
                cmsResponse.data.success &&
                Array.isArray(cmsResponse.data.data)
              ) {
                const createSlug = (text) => {
                  if (!text) return "";
                  return text
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, "")
                    .replace(/[\s_-]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                };

                // Use slugParam from route; do NOT shadow it
                const matchingPage = cmsResponse.data.data.find((page) => {
                  const pageSlug = page.slug || createSlug(page.section);
                  return pageSlug === slugParam;
                });

                if (matchingPage) {
                  sectionName = matchingPage.section;
                  break;
                }
              }
            } catch (error) {
              console.error(
                `Error fetching CMS for category ${category.id}:`,
                error
              );
            }
          }
        }

        if (!sectionName) {
          setError("Page not found");
          setLoading(false);
          return;
        }

        // IMPORTANT: fetch by sectionName, not by slug
        const pageResponse = await axios.get(
          `${BASE_URL}/cms/${encodeURIComponent(sectionName)}`
        );

        if (pageResponse.data.success && pageResponse.data.data) {
          setPageData(pageResponse.data.data);
          setError(null);

          // Related packages (kept as-is; will only run if tags exist)
          if (
            pageResponse.data.data.tags &&
            pageResponse.data.data.tags.length > 0
          ) {
            try {
              const allPackages = [];
              for (const tag of pageResponse.data.data.tags) {
                try {
                  const packagesResponse = await axios.get(
                    `${BASE_URL}/package-tour/tags/${tag}`
                  );
                  if (
                    packagesResponse.data.success &&
                    packagesResponse.data.data
                  ) {
                    allPackages.push(...packagesResponse.data.data);
                  }
                } catch (tagError) {
                  console.error(
                    `Error fetching packages for tag ${tag}:`,
                    tagError
                  );
                }
              }
              const uniquePackages = allPackages.filter(
                (pkg, index, self) =>
                  index === self.findIndex((p) => p.id === pkg.id)
              );
              setRelatedPackages(uniquePackages);
            } catch (packagesError) {
              console.error("Error fetching related packages:", packagesError);
            }
          }
        } else {
          setError("Page not found");
        }
      } catch (err) {
        console.error("Error fetching CMS page:", err);
        setError("Failed to load page content");
      } finally {
        setLoading(false);
      }
    };

    if (slugParam) {
      fetchCmsPage();
    }
  }, [slugParam]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-gray-600 text-lg">{error || "Page not found"}</p>
      </div>
    );
  }

  const metaTitle =
    pageData.meta_title ||
    pageData.content?.title ||
    pageData.section ||
    "Page";
  const metaDescription =
    pageData.meta_description ||
    pageData.content?.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
    "Explore our travel content and highlights.";
  const metaKeywords = pageData.meta_keywords || "";
  const ogImage = getMediaUrl(
    getMediaObject(pageData.content?.galleryImages?.[0]),
    "large"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{metaTitle}</title>
        {metaDescription && (
          <meta name="description" content={metaDescription} />
        )}
        {metaKeywords && <meta name="keywords" content={metaKeywords} />}
        <meta property="og:title" content={metaTitle} />
        {metaDescription && (
          <meta property="og:description" content={metaDescription} />
        )}
        <meta property="og:type" content="website" />
        {ogImage && <meta property="og:image" content={ogImage} />}
      </Head>
      <style>{`
        .prose {
          position: relative;
        }
        .prose img {
          float: right;
          margin: 0 0 1rem 1.5rem !important;
          max-width: 45%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          clear: right;
        }
        .prose img:first-of-type {
          margin-top: 0 !important;
        }
        @media (max-width: 768px) {
          .prose img {
            float: none;
            max-width: 100%;
            margin: 1rem 0 !important;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          {(pageData.subtitle || pageData.content?.subtitle) && (
            <p className="text-2xl md:text-xl text-green-600 font-semibold mb-2">
              {pageData.subtitle || pageData.content?.subtitle}
            </p>
          )}
          <h3 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            {pageData.content?.title || pageData.section}
          </h3>
        </div>

        {pageData.content?.description &&
          pageData.content.description !== "" &&
          pageData.content.description !== "<p><br></p>" && (
            <div
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{
                __html: pageData.content.description,
              }}
            />
          )}

        {pageData.content?.details && (
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{
              __html: pageData.content.details,
            }}
          />
        )}

        {pageData.content?.activities && (
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{
              __html: pageData.content.activities,
            }}
          />
        )}

        {/* Related Packages Section */}
        {relatedPackages.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-6">
              Related Tour Packages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPackages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/${encodeURIComponent(
                    pkg.package?.slug ||
                      (pkg.package?.title || "")
                        .toLowerCase()
                        .replace(/,/g, "")
                        .replace(/\s+/g, "-")
                  )}`}
                  className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  {pkg.package?.mainImage && (
                    <div className="relative h-48 w-full overflow-hidden bg-white">
                      {(() => {
                        const media = getMediaObject(pkg.package.mainImage);
                        const src = getMediaUrl(media, "medium");
                        if (!src) return null;
                        return (
                          <img
                            src={src}
                            srcSet={getMediaSrcSet(media)}
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            alt={getMediaAlt(media, pkg.package?.title || "Package")}
                            className="object-contain w-full h-48 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        );
                      })()}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {pkg.package?.title}
                    </h3>
                    {pkg.package?.duration && (
                      <p className="text-sm text-gray-600 mb-2">
                        Duration: {pkg.package.duration}
                      </p>
                    )}
                    {pkg.package?.tour_type && (
                      <p className="text-sm text-gray-500">
                        Type: {pkg.package.tour_type}
                      </p>
                    )}
                    {pkg.package?.tags && pkg.package.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {pkg.package.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CmsPageDetail;
