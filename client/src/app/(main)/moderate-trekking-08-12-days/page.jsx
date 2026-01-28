"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import Popular from "@/components/Popular";
import Form from "@/components/Form";
import Head from "next/head";

const TourPage = () => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const routeSlug = "moderate-trekking-08-12-days";
      const sections = [
        "moderate-trekking",
        "moderate-trekking-08-12-days",
        "Moderate Trekking (08-12 Days)",
        "Moderate Trekking (08 - 12 Days)",
      ];

      const slugify = (value) => {
        if (!value) return "";
        return value
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
      };

      try {
        const response = await axios.get(`${BASE_URL}/cms/`);
        const list = response.data?.data || [];
        const page = list.find((item) => {
          const pageSlug = item.slug || slugify(item.section);
          return pageSlug === routeSlug || sections.includes(item.section);
        });

        if (page) {
          setCmsData(page);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Error fetching CMS list:", err?.message);
      }

      setError("Failed to fetch data");
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading)
    return <div className="p-10 text-center">Loading Content...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!cmsData)
    return <div className="p-10 text-center text-red-500">No data found.</div>;

  const { content } = cmsData;
  const stripHtml = (value) =>
    typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";
  const metaTitle =
    cmsData.meta_title || content?.title || "Moderate Trekking (08-12 Days)";
  const metaDescription =
    cmsData.meta_description ||
    stripHtml(content?.description).slice(0, 160) ||
    "Browse moderate trekking adventures lasting 8 to 12 days with rewarding trails.";
  const metaKeywords =
    cmsData.meta_keywords ||
    "moderate trekking, Nepal trek, 8-12 days trek, Everest Vacation";

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
      <div className="mb-10">
        {(cmsData.subtitle || content?.title) && (
          <span className="text-lime-600 font-medium text-sm uppercase tracking-wide">
            {cmsData.subtitle || content?.title}
          </span>
        )}

        <h1 className="text-3xl font-bold text-gray-800 mt-1 mb-6">
          {content?.title || cmsData.section}
        </h1>

        {content.description && content.description !== "<p><br></p>" && (
          <div
            dangerouslySetInnerHTML={{ __html: content.description }}
            className="text-sm text-gray-600 space-y-4 leading-relaxed text-justify whitespace-pre-line"
          />
        )}
      </div>

      <Popular
        tags={["moderate", "trekking", "08-12 days"]}
        titleKeyword={content.title}
        heading={content.title}
      />

      {content.details && content.details !== "<p><br></p>" && (
        <div className="mt-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Details</h2>
          <div
            className="text-sm text-gray-600 space-y-4 leading-relaxed text-justify"
            dangerouslySetInnerHTML={{ __html: content.details }}
          />
        </div>
      )}

      {content.activities && content.activities !== "<p><br></p>" && (
        <div className="mt-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Activities</h2>
          <div
            className="text-sm text-gray-600 space-y-4 leading-relaxed text-justify"
            dangerouslySetInnerHTML={{ __html: content.activities }}
          />
        </div>
      )}

      <Form />
    </div>
  );
};

export default TourPage;
