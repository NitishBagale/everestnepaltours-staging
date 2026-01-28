"use client";
import React, { useEffect, useState } from "react";
import { BASE_URL } from "@/config/Config";
import Head from "next/head";

const MeetOurOwnerPage = () => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = `${BASE_URL}/cms/${encodeURIComponent("Meet the Owner")}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            setCmsData(json.data);
          }
        } else {
          console.error("Server Error:", response.status);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return <div className="p-10 text-center">Loading Content...</div>;
  if (!cmsData)
    return <div className="p-10 text-center text-red-500">No data found.</div>;

  const content = cmsData.content || {};
  const stripHtml = (value) =>
    typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";
  const metaTitle =
    cmsData.meta_title || content.title || cmsData.section || "Meet the Owner";
  const metaDescription =
    cmsData.meta_description ||
    stripHtml(content.description).slice(0, 160) ||
    "Meet the owner of Everest Vacation and learn about our journey and values.";
  const metaKeywords =
    cmsData.meta_keywords ||
    "meet the owner, Everest Vacation founder, Nepal travel experts";

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
      <style jsx global>{`
        .owner-content {
          clear: both;
        }
        .owner-content img {
          float: left;
          margin: 0 1.5rem 1.5rem 0;
          max-width: 45%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .owner-content p {
          margin: 0.75rem 0;
          line-height: 1.8;
        }
        .owner-content ul {
          list-style-type: disc;
          padding-left: 2rem;
          margin: 1rem 0;
        }
        .owner-content ol {
          list-style-type: decimal;
          padding-left: 2rem;
          margin: 1rem 0;
        }
        .owner-content li {
          margin: 0.25rem 0;
        }
        .owner-content h2 {
          font-size: 1.875rem;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #1f2937;
          clear: both;
        }
        .owner-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        @media (max-width: 768px) {
          .owner-content img {
            float: none;
            max-width: 100%;
            margin: 1rem 0;
          }
        }
      `}</style>

      <div className="mb-10">
        {(cmsData.subtitle || cmsData.content?.title) && (
          <span className="text-lime-600 font-medium text-sm uppercase tracking-wide">
            {cmsData.subtitle || cmsData.content?.title}
          </span>
        )}

        <h1 className="text-3xl font-bold text-gray-800 mt-1 mb-6">
          {cmsData.content?.title || cmsData.section}
        </h1>

        {content.description && content.description !== "<p><br></p>" && (
          <div
            dangerouslySetInnerHTML={{ __html: content.description }}
            className="owner-content text-sm text-gray-600 space-y-4 leading-relaxed text-justify"
          />
        )}
      </div>

      {content.details && content.details !== "<p><br></p>" && (
        <div className="mt-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Details</h2>
          <div
            className="owner-content text-sm text-gray-600 space-y-4 leading-relaxed text-justify"
            dangerouslySetInnerHTML={{ __html: content.details }}
          />
        </div>
      )}

      {content.activities && content.activities !== "<p><br></p>" && (
        <div className="mt-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Activities</h2>
          <div
            className="owner-content text-sm text-gray-600 space-y-4 leading-relaxed text-justify"
            dangerouslySetInnerHTML={{ __html: content.activities }}
          />
        </div>
      )}
    </div>
  );
};

export default MeetOurOwnerPage;
