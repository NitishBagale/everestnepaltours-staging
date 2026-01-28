"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import Link from "next/link";
import Head from "next/head";

const TravelInformationPage = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTravelInformationPages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/cms/`);

        // Filter pages with section starting with "travel-info-"
        const travelPages =
          response.data.data?.filter(
            (page) =>
              page.section?.startsWith("travel-info-") && page.status === true
          ) || [];

        setPages(travelPages);
        setError(null);
      } catch (err) {
        console.error("Error fetching travel information pages:", err);
        setError("Failed to load travel information pages");
        setPages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelInformationPages();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-linear-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-semibold text-slate-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-linear-to-br from-slate-50 to-slate-100">
        <p className="text-center text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Travel Information | Everest Vacation</title>
        <meta
          name="description"
          content="Helpful travel information, tips, and guides for planning your Nepal, Bhutan, or Tibet journey."
        />
        <meta
          name="keywords"
          content="travel information, Nepal travel tips, Bhutan guide, Tibet travel advice"
        />
        <meta
          property="og:title"
          content="Travel Information | Everest Vacation"
        />
        <meta
          property="og:description"
          content="Helpful travel information, tips, and guides for planning your Nepal, Bhutan, or Tibet journey."
        />
        <meta property="og:type" content="website" />
      </Head>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Travel Information
          </h1>
        </div>

        {/* Grid Layout */}
        {pages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <Link key={page.id} href={`/${page.section}`}>
                <div className="h-full p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-green-600 transition-colors">
                    {page.content?.title || page.section}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-slate-600">
              No travel information pages available yet.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelInformationPage;
