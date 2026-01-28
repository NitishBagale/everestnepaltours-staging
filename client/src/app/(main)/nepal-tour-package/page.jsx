"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import Popular from "@/components/Popular";
import Form from "@/components/Form";
import Head from "next/head";

const Page = () => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectionName = "Culture, Nature & Religion";

        const response = await axios.get(
          `${BASE_URL}/cms/${encodeURIComponent(sectionName)}`
        );

        if (response.data.success) {
          setCmsData(response.data.data);
          console.log(response);
        } else {
          setError("API responded with success: false");
        }
      } catch (err) {
        console.error("Error fetching CMS data:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return <div className="p-10 text-center">Loading Content...</div>;

  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (!cmsData)
    return <div className="p-10 text-center text-red-500">No data found.</div>;

  const stripHtml = (value) =>
    typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";
  const metaTitle =
    cmsData.meta_title || cmsData.content?.title || "Nepal Tour Packages";
  const metaDescription =
    cmsData.meta_description ||
    stripHtml(cmsData.content?.description).slice(0, 160) ||
    "Discover Nepal tour packages with cultural highlights, nature, and spirituality.";
  const metaKeywords =
    cmsData.meta_keywords ||
    "Nepal tour packages, Kathmandu tours, cultural tours, Everest Vacation";

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

        {cmsData.content?.description && (
          <div
            dangerouslySetInnerHTML={{ __html: cmsData.content.description }}
            className="text-sm text-gray-600 space-y-4 leading-relaxed text-justify whitespace-pre-line"
          />
        )}
      </div>

      <Popular
        tags={["kathmandu", "tours", "Tours", "nepal kathmandu"]}
        titleKeyword={cmsData?.content?.title}
        heading={cmsData?.content?.title}
      />

      {cmsData.content?.details &&
        Array.isArray(cmsData.content.details) &&
        cmsData.content.details.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Highlights
            </h2>
            <ul className="space-y-2 pl-6">
              {cmsData.content.details.map((item, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 leading-relaxed list-disc"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

      <Form />
    </div>
  );
};

export default Page;
