"use client";

import React from "react";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import Gallery from "@/components/Gallery";

const sanitizeHtml = (html) =>
  DOMPurify.sanitize(html, {
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

const CmsPageClient = ({ pageData, error }) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
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
                  {pageData.content?.title ||
                    pageData.title ||
                    pageData.section ||
                    "Travel Information"}
                </h1>
              </div>

              {/* Content Body */}
              <div className="px-6 py-8">
                {/* Description Section */}
                {(pageData.content?.description || pageData.description) && (
                  <div className="mb-8">
                    <div
                      className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(
                          pageData.content?.description || pageData.description
                        ),
                      }}
                    />
                  </div>
                )}

                {/* Details Section */}
                {(pageData.content?.details || pageData.details) && (
                  <div className="mb-8">
                    <div
                      className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(
                          pageData.content?.details || pageData.details
                        ),
                      }}
                    />
                  </div>
                )}

                {/* Empty State */}
                {!pageData.content?.description &&
                  !pageData.content?.details &&
                  !pageData.description &&
                  !pageData.details && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">
                        No content available for this page.
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {/* Gallery Section - After Details */}
            {pageData.content?.galleryImages &&
              pageData.content.galleryImages.length > 0 && (
                <div className="mt-8">
                  <Gallery
                    galleryImages={pageData.content.galleryImages}
                    title="Photo Gallery"
                  />
                </div>
              )}
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

export default CmsPageClient;
