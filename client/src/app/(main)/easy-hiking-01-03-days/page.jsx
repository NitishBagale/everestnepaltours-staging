"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import Popular from "@/components/Popular";
import Head from "next/head";

const EasyHikingPage = () => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const routeSlug = "easy-hiking-01-03-days";
        const sections = [
          "Easy Hiking (01-03 Days)",
          "Easy Hiking (01 - 03 Days)",
          "easy-hiking-01-03-days",
          "easy hiking 01-03 days",
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
    cmsData.meta_title || content.title || "Easy Hiking (01-03 Days)";
  const metaDescription =
    cmsData.meta_description ||
    stripHtml(content.description).slice(0, 160) ||
    "Browse easy hiking trips of 1 to 3 days with relaxed routes and scenic views.";
  const metaKeywords =
    cmsData.meta_keywords ||
    "easy hiking, short hikes, Nepal hiking, Everest Vacation";

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
        {(cmsData.subtitle || cmsData.content?.title) && (
          <span className="text-lime-600 font-medium text-sm uppercase tracking-wide">
            {cmsData.subtitle || cmsData.content?.title}
          </span>
        )}

        <h1 className="text-3xl font-bold text-gray-800 mt-1 mb-6">
          {cmsData.content?.title || cmsData.section}
        </h1>

        <div className="text-sm text-gray-600 space-y-4 leading-relaxed text-justify whitespace-pre-line">
          {content.description && content.description !== "<p><br></p>" && (
            <div dangerouslySetInnerHTML={{ __html: content.description }} />
          )}
        </div>
      </div>

      <Popular
        tags={[
          "hike",
          "easy hiking",
          "easy hiking (01-03 days)",
          "short hiking",
        ]}
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
    </div>
  );
};

export default EasyHikingPage;
