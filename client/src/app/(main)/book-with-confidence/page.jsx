"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import Head from "next/head";

const BookWithConfidencePage = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectionName = encodeURIComponent("Book with Confidence");
        const response = await axios.get(`${BASE_URL}/cms/${sectionName}`);
        console.log("Book with Confidence Response:", response.data);
        console.log("response.data.data:", response.data?.data);
        console.log(
          "response.data.data.content:",
          response.data?.data?.content
        );

        if (response.data?.data?.content) {
          setContent(response.data.data.content);
        } else if (response.data?.content) {
          setContent(response.data.content);
        } else if (response.data?.data) {
          setContent(response.data.data);
        } else {
          console.warn("No content found in response");
        }
      } catch (err) {
        console.error("Error fetching Book with Confidence data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sections = content?.sections || {};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-20 text-center text-red-500">
        Content not available.
      </div>
    );
  }

  const stripHtml = (value) =>
    typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";
  const metaTitle = content.title || "Book With Confidence";
  const metaDescription =
    stripHtml(content.description).slice(0, 160) ||
    "Book with confidence with transparent policies, trusted guides, and reliable support.";
  const metaKeywords =
    "book with confidence, travel policies, Everest Vacation guarantee, safe booking";

  return (
    <div className="container mx-auto p-5 md:p-10 max-w-6xl font-sans text-gray-700">
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={metaKeywords} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
      </Head>
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
          {content.title}
        </h1>

        {content.description && content.description !== "<p><br></p>" && (
          <div
            className="prose prose-sm md:prose-base max-w-none mb-8 text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content.description }}
          />
        )}
      </div>

      {content.details && content.details !== "<p><br></p>" && (
        <div className="mb-12">
          <div
            className="prose prose-sm md:prose-base max-w-none text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content.details }}
          />
        </div>
      )}

      {content.activities && content.activities !== "<p><br></p>" && (
        <div className="mb-12">
          <div
            className="prose prose-sm md:prose-base max-w-none text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content.activities }}
          />
        </div>
      )}
    </div>
  );
};

export default BookWithConfidencePage;
