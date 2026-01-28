"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import { getMediaUrl } from "@/lib/media";

// --- Star Rating Component --xf-
// A small helper component to generate the stars dynamically.
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: Math.round(rating || 0) }).map((_, index) => (
        <FaStar key={index} className="text-yellow-500" />
      ))}
    </div>
  );
};

// --- Main Review Component ---
const Review = () => {
  const [sectionTitle, setSectionTitle] = useState("Recent Review");
  const [selectedIds, setSelectedIds] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchSettingsAndReviews = async () => {
      try {
        const [settingsRes, reviewsRes] = await Promise.all([
          axios.get(`${BASE_URL}/settings/get`),
          axios.get(`${BASE_URL}/review/?limit=200`),
        ]);

        const heroSetting = settingsRes.data?.data?.find(
          (setting) => setting.name === "hero"
        );
        const reviewSection = heroSetting?.settings?.reviews || {};
        setSectionTitle(reviewSection.title || "Recent Review");
        setSelectedIds(
          Array.isArray(reviewSection.reviewIds)
            ? reviewSection.reviewIds.map(String)
            : []
        );

        setReviews(reviewsRes.data?.data || []);
      } catch (error) {
        console.error("Error fetching review section:", error);
      }
    };
    fetchSettingsAndReviews();
  }, []);

  const selectedReviews = useMemo(() => {
    if (!selectedIds.length) return [];
    const map = new Map(
      reviews.map((review) => [String(review.id || review._id), review])
    );
    return selectedIds.map((id) => map.get(String(id))).filter(Boolean);
  }, [reviews, selectedIds]);

  if (!selectedReviews.length) return null;

  return (
    <section className="font-sans bg-[#e9ecef] py-8 sm:py-12 lg:py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-screen-2xl mx-auto">
        {/* Section Header */}
        <div className="mb-4 sm:mb-5 lg:mb-7">
          <h2 className="flex items-center gap-2 sm:gap-3 text-3xl font-semibold text-[#3c9f87]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={20}
              height={20}
              className="sm:w-6 sm:h-6"
              viewBox="0 0 16 16"
            >
              <path
                fill="currentColor"
                d="M14 14.2c0-.6 2-1.8 2-3.1c0-1.5-1.4-2.7-3.1-3.2c.7-.8 1.1-1.7 1.1-2.8C14 2.3 11.1 0 7.4 0C3.9 0 0 2.1 0 5.1c0 2.1 1.6 3.6 2.3 4.2c-.1 1.2-.6 1.7-.6 1.7L.5 12H2c1.6 0 2.9-.5 3.7-1.1v.2c0 2 2.2 3.6 5 3.6h.6c.4.5 1.7 1.4 3.4 1.4c.1-.1-.7-.5-.7-1.9M7.4 1C10.5 1 13 2.9 13 5.1s-2.6 4.1-5.8 4.1H6.1l-.1.2c-.3.4-1.5 1.2-3.1 1.5c.1-.4.1-1 .1-1.8v-.3C2 8 .9 6.6.9 5.2C.9 3 4.1 1 7.4 1"
              ></path>
            </svg>
            {sectionTitle || "Recent Review"}
          </h2>
        </div>

        {selectedReviews.map((review, index) => {
          const reviewImage =
            getMediaUrl(review.image, "medium") ||
            getMediaUrl(review.image, "large") ||
            "/review.jpg";
          const travelDate = review.travelDate
            ? new Date(review.travelDate).toLocaleDateString()
            : "";

          return (
            <div
              key={review.id || review._id || index}
              className={`grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 md:grid-cols-3 ${
                index < selectedReviews.length - 1
                  ? "pb-10 sm:pb-12 lg:pb-14 border-b border-gray-200 mb-10 sm:mb-12 lg:mb-14"
                  : ""
              }`}
            >
              {/* Left Column: Image and Reviewer Info */}
              <div className="md:col-span-1">
                <div className="relative mb-4 sm:mb-6 aspect-3/4 w-full overflow-hidden rounded-lg shadow-md">
                  <Image
                    src={reviewImage}
                    alt={`Photo of ${review.guestName || "Guest"}`}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 33vw"
                    quality={90}
                  />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-gray-800">
                    {review.guestName || "Guest"}
                  </p>
                  <p className="text-base text-gray-600">
                    {review.country || ""}
                  </p>
                  {travelDate && (
                    <p className="text-base text-gray-400 mt-2 lg:mt-3">
                      Travel time: {travelDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Review Details */}
              <div className="md:col-span-2">
                <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-800 leading-tight mb-3 sm:mb-4 lg:mb-5">
                  {review.title || "Guest Review"}
                </h3>
                <div className="my-3 sm:my-4 lg:my-5">
                  <StarRating rating={Number(review.rating) || 0} />
                </div>
                <div
                  className="prose prose-slate max-w-none text-gray-600 text-lg leading-relaxed [&>p]:mb-5"
                  dangerouslySetInnerHTML={{
                    __html: review.reviewText || "",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Review;
