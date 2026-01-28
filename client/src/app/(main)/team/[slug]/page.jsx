"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import { useParams } from "next/navigation";
import Head from "next/head";

const TeamMemberDetailPage = () => {
  const params = useParams();
  const memberName = decodeURIComponent(params.slug);

  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/team/`);
        const members = response.data?.teams || response.data?.data || [];
        const member = members.find((m) => m.name === memberName);

        if (member) {
          setMemberData(member);
          setError(null);
        } else {
          setError("Team member not found");
        }
      } catch (err) {
        console.error("Error fetching team member:", err);
        setError("Failed to load team member data");
      } finally {
        setLoading(false);
      }
    };

    if (memberName) {
      fetchMemberData();
    }
  }, [memberName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !memberData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500 font-semibold">
        {error || "Team member not found"}
      </div>
    );
  }

  const metaTitle =
    memberData.meta_title || `${memberData.name} | Team Member`;
  const metaDescription =
    memberData.meta_description ||
    memberData.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
    "Meet our team member and learn about their experience.";
  const metaKeywords = memberData.meta_keywords || "";
  const ogImage = memberData.imageUrl || "";

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{metaTitle}</title>
        {metaDescription && (
          <meta name="description" content={metaDescription} />
        )}
        {metaKeywords && <meta name="keywords" content={metaKeywords} />}
        <meta property="og:title" content={metaTitle} />
        {metaDescription && (
          <meta property="og:description" content={metaDescription} />
        )}
        <meta property="og:type" content="profile" />
        {ogImage && <meta property="og:image" content={ogImage} />}
      </Head>
      <main className="grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1 md:pr-12">
              <h4 className="text-lg font-semibold text-green-600 tracking-wide">
                Biography of
              </h4>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-8">
                {memberData.name}
              </h1>
              <div
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: memberData.description || "No description available.",
                }}
              />
            </div>
            <div className="w-full md:w-96 shrink-0 relative">
              <div className="relative w-full h-auto">
                <img
                  src={memberData.imageUrl || "/placeholder-team.jpg"}
                  alt={memberData.name}
                  className="w-full h-auto object-cover rounded-lg shadow-lg"
                />
              </div>
              <div className="border-l-4 border-green-600 pl-4 py-2 mt-4">
                <p className="text-gray-700 font-medium">
                  {memberData.name} | {memberData.designation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamMemberDetailPage;
