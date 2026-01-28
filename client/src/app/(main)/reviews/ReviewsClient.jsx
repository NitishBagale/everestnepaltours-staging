"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { BASE_URL } from "@/config/Config";

const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-1 mb-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={`${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
};

const ReviewsClient = () => {
  const [reviews, setReviews] = useState([]);
  const [avgStats, setAvgStats] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
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

  const shownReviews = reviews.slice(0, visibleCount);
  const hasMore = reviews.length > visibleCount;

  return (
    <section className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12 font-sans bg-white">
      <div className="mb-10">
        <h4 className="text-sm font-semibold text-green-600 mb-1">
          {cmsSubtitle}
        </h4>
        <h2 className="text-3xl font-bold text-gray-800">{cmsTitle}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Average {avgStats.averageRating || avgStats.average || 0} (based on{" "}
          {avgStats.totalReviews || avgStats.count || 0} reviews)
        </p>
      </div>

      <div className="flex flex-col gap-14">
        {Array.isArray(reviews) && reviews.length > 0 ? (
          shownReviews.map((review, index) => (
            <div
              key={review._id || review.id || index}
              className="flex flex-col md:flex-row gap-8 md:gap-12 border-b border-gray-100 pb-12 last:border-0"
            >
              <div className="md:w-[280px] flex flex-col items-center text-center shrink-0">
                <div className="w-full aspect-4/3 bg-gray-100 rounded-lg overflow-hidden mb-4 shadow-sm relative">
                  <img
                    src={
                      review.image?.variants?.medium ||
                      review.image?.url ||
                      review.image ||
                      "/bhutan.jpg"
                    }
                    alt={review.userName || "Guest"}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />
                </div>

                <h4 className="font-bold text-gray-900 text-sm">
                  {review.userName || "Valued Guest"}
                </h4>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                  {review.country || "International"}
                </p>
                <p className="text-[12px] text-gray-400 mt-1">
                  Travel Date:{" "}
                  {review.date
                    ? new Date(review.date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {review.title || "Everest Vacation Experience"}
                </h3>

                <StarRating rating={review.rating || 5} />

                <div className="text-sm text-gray-600 leading-7 space-y-4 text-justify">
                  {review.reviewText || review.comment ? (
                    (review.reviewText || review.comment)
                      .split("\n")
                      .map(
                        (paragraph, i) =>
                          paragraph.trim() !== "" && <p key={i}>{paragraph}</p>
                      )
                  ) : (
                    <p className="italic text-gray-400">
                      No additional comments.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 italic">
            No reviews found.
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
};

export default ReviewsClient;
