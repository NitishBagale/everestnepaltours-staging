"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";

const AboutUsClient = ({ initialData = null }) => {
  const [cmsData, setCmsData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;

    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/cms/${encodeURIComponent("About Us")}`
        );
        console.log("About Us Response:", response.data);

        if (response.data?.data?.content) {
          setCmsData(response.data.data.content);
        } else if (response.data?.content) {
          setCmsData(response.data.content);
        } else if (response.data?.data) {
          setCmsData(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching About Us data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData]);

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

  return (
    <div className="container mx-auto p-5 md:p-10 max-w-6xl font-sans text-gray-700">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
          {cmsData.title || "About Us"}
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

export default AboutUsClient;
