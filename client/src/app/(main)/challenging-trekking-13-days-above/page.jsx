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

      try {
        const routeSlug = "challenging-trekking-13-days-above";
        const sections = [
          "Challenging Trekking (13 Days & Above)",
          "Challenging Trekking (13+ Days)",
          "challenging-trekking-13-days-above",
          "challenging trekking 13 days above",
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

        const response = await axios.get(`${BASE_URL}/cms/`);
        const list = response.data?.data || [];
        const page = list.find((item) => {
          const pageSlug = item.slug || slugify(item.section);
          return pageSlug === routeSlug || sections.includes(item.section);
        });

        if (page) {
          setCmsData(page);
        } else {
          setError("Page not found");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
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
    cmsData.meta_title || content?.title || "Challenging Trekking (13+ Days)";
  const metaDescription =
    cmsData.meta_description ||
    stripHtml(content?.description).slice(0, 160) ||
    "Take on challenging trekking adventures of 13 days or more with expert guides.";
  const metaKeywords =
    cmsData.meta_keywords ||
    "challenging trekking, high altitude treks, Nepal trekking, Everest Vacation";

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
        tags={["challenging", "trekking", "13 days", "above"]}
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
