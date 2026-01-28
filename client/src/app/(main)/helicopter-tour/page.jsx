"use client";
import React, { useEffect, useState } from "react";
import { BASE_URL } from "@/config/Config";
import Popular from "@/components/Popular";
import Form from "@/components/Form";
import Head from "next/head";

const HelicopterToursPage = () => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const IMAGE_BASE_URL = `${BASE_URL}/uploads/`;

  const API_URL = `${BASE_URL}/cms/${encodeURIComponent("Helicopter Tour")}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);

        if (response.ok) {
          const responseJson = await response.json();
          console.log("API Response:", responseJson);

          if (responseJson.success && responseJson.data) {
            setCmsData(responseJson.data);
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

  const tours = cmsData.content?.tours || [];
  const stripHtml = (value) =>
    typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";
  const metaTitle =
    cmsData.meta_title || cmsData.content?.title || "Helicopter Tours";
  const metaDescription =
    cmsData.meta_description ||
    stripHtml(cmsData.content?.description).slice(0, 160) ||
    "Experience scenic helicopter tours in Nepal with expert support and unforgettable views.";
  const metaKeywords =
    cmsData.meta_keywords ||
    "helicopter tour, Nepal flights, Everest views, Everest Vacation";

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
        tags={["helicopter", "flight"]}
        titleKeyword={cmsData?.content?.title}
        heading={cmsData?.content?.title}
      />

      {tours.length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {cmsData.section}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {tours.map((tour, index) => {
              const imageUrl = tour.image.startsWith("http")
                ? tour.image
                : `${IMAGE_BASE_URL}${tour.image}`;

              return (
                <div
                  key={index}
                  className="bg-white rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-48 overflow-hidden relative bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={tour.name}
                      onError={(e) =>
                        (e.target.src =
                          "https://placehold.co/600x400?text=No+Image")
                      }
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-lg mb-1 leading-tight h-12 line-clamp-2">
                      {tour.name}
                    </h3>

                    <div className="text-xs text-gray-400 mb-3">
                      ( {tour.reviews} reviews )
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="mr-1">🕒</span> {tour.duration},{" "}
                        {tour.difficulty}
                      </div>
                      <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1 px-3 rounded-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <Form />

      {/* Inquiry form removed as requested */}
    </div>
  );
};

export default HelicopterToursPage;
