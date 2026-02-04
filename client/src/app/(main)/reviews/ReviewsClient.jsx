"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { BASE_URL } from "@/config/Config";
import { getMediaUrl } from "@/lib/media";

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: Math.round(rating || 0) }).map((_, index) => (
        <FaStar key={index} className="text-yellow-500" />
      ))}
    </div>
  );
};

const ReviewsClient = () => {
  const [reviews, setReviews] = useState([]);
  const [avgStats, setAvgStats] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cmsTitle, setCmsTitle] = useState("Reviews");
  const [cmsSubtitle, setCmsSubtitle] = useState("Guest Feedback");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [reviewsRes, ratingRes, cmsRes] = await Promise.all([
          axios.get(`${BASE_URL}/review/`),
          axios.get(`${BASE_URL}/review/average-rating`),
          axios.get(`${BASE_URL}/cms/`),
        ]);

        const rawData = reviewsRes.data;
        let validReviewsArray = [];

        if (Array.isArray(rawData)) {
          validReviewsArray = rawData;
        } else if (rawData && Array.isArray(rawData.data)) {
          validReviewsArray = rawData.data;
        } else if (rawData && Array.isArray(rawData.reviews)) {
          validReviewsArray = rawData.reviews;
        } else {
          console.warn("API did not return an array. Response was:", rawData);
        }

        setReviews(validReviewsArray);
        setAvgStats(ratingRes.data || {});

        const cmsList = cmsRes?.data?.data || [];
        const cmsPage = cmsList.find((item) => item.slug === "reviews");
        if (cmsPage?.content?.title) {
          setCmsTitle(cmsPage.content.title);
        }
        if (cmsPage?.content?.subtitle) {
          setCmsSubtitle(cmsPage.content.subtitle);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Could not load reviews.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const normalizedReviews = useMemo(
    () =>
      reviews.map((review) => ({
        ...review,
        guestName: review.guestName || review.userName || "Guest",
        travelDate: review.travelDate || review.date || "",
        reviewText: review.reviewText || review.comment || "",
      })),
    [reviews]
  );

  const totalReviews =
    avgStats.totalReviews || avgStats.count || reviews.length || 0;
  const averageRating =
    totalReviews > 0
      ? avgStats.averageRating || avgStats.average || 0
      : 5.0;
  const formattedAverage = Number(averageRating || 0).toFixed(1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-semibold text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-24 text-red-500">{error}</div>;
  }

  return (
    <section className="font-sans bg-[#e9ecef] py-8 sm:py-12 lg:py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-4 sm:mb-5 lg:mb-7">
          <p
            className="text-[#9dbc7a] text-2xl font-medium"
            style={{ fontFamily: "var(--font-museo)" }}
          >
            {cmsSubtitle}
          </p>
          <h2
            className="mt-2 text-4xl font-bold text-gray-700"
            style={{ fontFamily: "var(--font-museo)" }}
          >
            {cmsTitle}
          </h2>
          <p className="text-base text-gray-500 mt-2">
            Average {formattedAverage} (based on {totalReviews} reviews)
          </p>
        </div>

        {Array.isArray(normalizedReviews) && normalizedReviews.length > 0 ? (
          normalizedReviews.map((review, index) => {
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
                className={`grid grid-cols-1 gap-6 sm:gap-8 lg:gap-10 md:grid-cols-3 ${
                  index < normalizedReviews.length - 1
                    ? "pb-6 sm:pb-8 lg:pb-10 border-b border-gray-200 mb-6 sm:mb-8 lg:mb-10"
                    : ""
                }`}
              >
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

                <div className="md:col-span-2">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-800 leading-tight mb-3 sm:mb-4 lg:mb-5">
                    {review.title || "Guest Review"}
                  </h3>
                  <div className="my-3 sm:my-4 lg:my-5">
                    <StarRating rating={Number(review.rating) || 0} />
                  </div>
                  {review.reviewText ? (
                    <div
                      className="prose prose-slate max-w-none text-gray-600 text-lg leading-relaxed [&>p]:mb-5"
                      dangerouslySetInnerHTML={{ __html: review.reviewText }}
                    />
                  ) : (
                    <p className="italic text-gray-400">
                      No additional comments.
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 italic">
            No reviews found.
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsClient;
