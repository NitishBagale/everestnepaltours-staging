"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import Head from "next/head";

const PaymentPolicyPage = () => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all CMS pages and find the payment policy one
        const response = await axios.get(`${BASE_URL}/cms/`);
        console.log("All CMS Data:", response.data);

        // Find the page with section "payment-cancellation-policy"
        const paymentPage = response.data.data?.find(
          (page) =>
            page.section === "payment-cancellation-policy" ||
            page.section?.toLowerCase().includes("payment") ||
            page.section?.toLowerCase().includes("cancellation")
        );

        console.log("Found Payment Page:", paymentPage);

        if (paymentPage?.content) {
          setCmsData(paymentPage.content);
        }
      } catch (err) {
        console.error("Error fetching Payment & Cancellation data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!cmsData) {
    return (
      <div className="p-20 text-center text-red-500">
        Content not available.
      </div>
    );
  }

  const stripHtml = (value) =>
    typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";
  const metaTitle = cmsData.title || "Payment & Cancellation Policy";
  const metaDescription =
    stripHtml(cmsData.description).slice(0, 160) ||
    "Review payment terms, cancellation policy, and booking guidelines for Everest Vacation tours.";
  const metaKeywords =
    "payment policy, cancellation policy, booking terms, Everest Vacation";

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
          {cmsData.title || "Payment & Cancellation Policy"}
        </h1>

        {cmsData.description && cmsData.description !== "<p><br></p>" && (
          <div
            className="prose prose-sm md:prose-base max-w-none mb-8 text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: cmsData.description }}
          />
        )}
      </div>

      {cmsData.details && cmsData.details !== "<p><br></p>" && (
        <div className="mb-12">
          <div
            className="prose prose-sm md:prose-base max-w-none text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: cmsData.details }}
          />
        </div>
      )}

      {cmsData.activities && cmsData.activities !== "<p><br></p>" && (
        <div className="mb-12">
          <div
            className="prose prose-sm md:prose-base max-w-none text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: cmsData.activities }}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentPolicyPage;
