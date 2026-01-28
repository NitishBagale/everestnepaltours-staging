"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import Image from "next/image";
import "@/app/quill.css";
import Form from "@/components/Form";
import Head from "next/head";

const KathmanduTourPage = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCmsPage = async () => {
      try {
        setLoading(true);

        // Fetch CMS page by section name
        const pageResponse = await axios.get(
          `${BASE_URL}/cms/${encodeURIComponent("Kathmandu Tour")}`
        );

        if (pageResponse.data.success && pageResponse.data.data) {
          setPageData(pageResponse.data.data);
          setError(null);
        } else {
          setError("Page not found");
        }
      } catch (err) {
        console.error("Error fetching CMS page:", err);
        if (err.response?.status === 404) {
          setError(
            "Page content not created yet. Please create a CMS page with section name 'Kathmandu Tour' in the admin dashboard."
          );
        } else {
          setError("Failed to load page content");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCmsPage();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen px-4">
        <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-gray-600 text-lg text-center max-w-2xl">
          {error || "Page not found"}
        </p>
        {error?.includes("admin dashboard") && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl">
            <p className="text-sm text-gray-700">
              <strong>How to fix:</strong> Go to Admin Dashboard → Pages →
              Create a new page with:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
              <li>
                Section:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  Kathmandu Tour
                </code>
              </li>
              <li>Add your content, FAQs, and settings</li>
              <li>Set Status to Published</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  const stripHtml = (value) =>
    typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";
  const metaTitle =
    pageData.meta_title || pageData.content?.title || "Kathmandu Tour";
  const metaDescription =
    pageData.meta_description ||
    stripHtml(pageData.content?.description).slice(0, 160) ||
    "Explore Kathmandu tours with cultural highlights, heritage sites, and local experiences.";
  const metaKeywords =
    pageData.meta_keywords ||
    "Kathmandu tour, Nepal culture, heritage sites, Everest Vacation";

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans text-gray-700">
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={metaKeywords} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
      </Head>
      <style>{`
        .content-with-images img {
          float: right;
          margin: 0 0 1rem 1.5rem !important;
          max-width: 45%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          clear: right;
        }
        .content-with-images img:first-of-type {
          margin-top: 0 !important;
        }
        @media (max-width: 768px) {
          .content-with-images img {
            float: none;
            max-width: 100%;
            margin: 1rem 0 !important;
          }
        }
      `}</style>

      <div className="mb-10">
        {(pageData.subtitle || pageData.content?.subtitle) && (
          <span className="text-lime-600 font-medium text-sm uppercase tracking-wide">
            {pageData.subtitle || pageData.content?.subtitle}
          </span>
        )}

        <h1 className="text-3xl font-bold text-gray-800 mt-1 mb-6">
          {pageData.content?.title || pageData.section}
        </h1>

        {/* Description Section */}
        {pageData.content?.description &&
          pageData.content.description !== "" &&
          pageData.content.description !== "<p><br></p>" && (
            <div
              className="content-with-images text-sm text-gray-600 space-y-4 leading-relaxed text-justify whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: pageData.content.description,
              }}
            />
          )}
      </div>

      {/* Details Section */}
      {pageData.content?.details &&
        pageData.content.details !== "" &&
        pageData.content.details !== "<p><br></p>" && (
          <div
            className="content-with-images text-sm text-gray-600 space-y-4 leading-relaxed text-justify whitespace-pre-line mb-8"
            dangerouslySetInnerHTML={{
              __html: pageData.content.details,
            }}
          />
        )}

      {/* Activities Section */}
      {pageData.content?.activities &&
        pageData.content.activities !== "" &&
        pageData.content.activities !== "<p><br></p>" && (
          <div
            className="content-with-images text-sm text-gray-600 space-y-4 leading-relaxed text-justify whitespace-pre-line mb-8"
            dangerouslySetInnerHTML={{
              __html: pageData.content.activities,
            }}
          />
        )}

      {/* Photo Gallery */}
      {pageData.content?.galleryImages &&
        pageData.content.galleryImages.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Photo Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageData.content.galleryImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <Image
                    src={imageUrl}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      {/* FAQ Section */}
      {pageData.content?.faq && pageData.content.faq.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {pageData.content.faq.map((faqItem, index) => (
              <details
                key={index}
                className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50">
                  <span className="text-sm sm:text-base pr-4">
                    {faqItem.question}
                  </span>
                  <svg
                    className="w-5 h-5 text-emerald-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faqItem.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Booking Form */}
      {pageData.content?.showBookingForm && <Form />}
    </div>
  );
};

export default KathmanduTourPage;
