"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import Head from "next/head";
import { getMediaObject, getMediaUrl } from "@/lib/media";

const TravelInformationDetailPage = () => {
  const params = useParams();
  const slug = params.slug;

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/cms/`);

        // Find page with matching slug
        const page = response.data.data?.find(
          (p) => p.slug === slug && p.status === true
        );

        if (!page) {
          setError("Page not found");
          setPageData(null);
        } else {
          setPageData(page);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching page data:", err);
        setError("Failed to load page");
        setPageData(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPageData();
    }
  }, [slug]);

  const sanitizeHtml = (html) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "b",
        "i",
        "em",
        "strong",
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "a",
        "img",
        "blockquote",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-semibold text-slate-600">Loading...</p>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">
            {error || "Page not found"}
          </p>
          <Link
            href="/travel-information"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ← Back to Travel Information
          </Link>
        </div>
      </div>
    );
  }

  const metaTitle =
    pageData.meta_title || pageData.content?.title || "Travel Information";
  const metaDescription =
    pageData.meta_description ||
    pageData.content?.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
    "Travel information and helpful details.";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/travel-information"
            className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Travel Information
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Page Title */}
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                <h1 className="text-3xl font-bold text-gray-900">
                  {pageData.content?.title || "Travel Information"}
                </h1>
              </div>

              {/* Content Body */}
              <div className="px-6 py-8">
                {/* Description Section */}
                {pageData.content?.description && (
                  <div className="mb-8">
                    <div
                      className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(pageData.content.description),
                      }}
                    />
                  </div>
                )}

                {/* Details Section */}
                {pageData.content?.details && (
                  <div className="mb-8">
                    <div
                      className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(pageData.content.details),
                      }}
                    />
                  </div>
                )}

                {/* Empty State */}
                {!pageData.content?.description &&
                  !pageData.content?.details && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">
                        No content available for this page.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            {/* Search Box */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">
                Search
              </h3>
              <input
                type="text"
                placeholder="Enter keywords"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Contact CTA */}
            <div className="bg-linear-to-br from-green-600 to-indigo-700 text-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-xl font-bold mb-3">Need Help?</h3>
              <p className="text-sm text-green-100 mb-4">
                Have questions about your travel? Our team is here to assist
                you.
              </p>
              <Link
                href="/contact-form"
                className="block w-full text-center px-4 py-2 bg-white text-green-600 rounded-md hover:bg-gray-100 transition-colors font-semibold"
              >
                Contact Us
              </Link>
            </div>

            {/* Related Topics */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">
                More Travel Info
              </h3>
              <Link
                href="/travel-information"
                className="block text-green-600 hover:text-green-800 text-sm py-2 border-b border-gray-100 last:border-0"
              >
                View All Topics →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelInformationDetailPage;
