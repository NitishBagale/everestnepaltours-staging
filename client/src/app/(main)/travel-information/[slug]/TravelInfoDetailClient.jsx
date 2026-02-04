"use client";

import React from "react";
import Link from "next/link";
import { FaRegCalendarAlt } from "react-icons/fa";

const stripHtml = (value) => (value || "").replace(/<[^>]*>/g, "").trim();

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const TravelInfoDetailClient = ({ item, relatedItems = [] }) => {
  if (!item) {
    return (
      <div className="p-20 text-center text-red-500">
        Travel information not found.
      </div>
    );
  }

  const title = item.title || "Travel Information";
  const date = formatDate(item.createdAt || item.updatedAt);
  const content = item.description || "<p>Content not available.</p>";

  return (
    <div className="font-sans text-gray-700 bg-white min-h-screen">
      <div className="w-full bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          <div className="flex flex-col gap-3">
            <Link
              href="/travel-information"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              ← Back to Travel Information
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {title}
            </h1>
            {date && (
              <div className="flex items-center text-teal-600 font-medium hidden">
                <FaRegCalendarAlt className="mr-2 text-lg" />
                {date}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10 items-start">
          <div
            className="prose prose-base md:prose-lg max-w-none text-gray-600 leading-7"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          <aside className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Related Travel Info
            </h3>
            {relatedItems.length > 0 ? (
              <div className="space-y-4">
                {relatedItems.map((related) => (
                  <Link
                    key={related.id || related.slug}
                    href={`/travel-information/${related.slug}`}
                    className="block group"
                  >
                    <p className="text-base font-semibold text-gray-800 group-hover:text-emerald-600 transition">
                      {related.title}
                    </p>
                    {related.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {stripHtml(related.description).slice(0, 140)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No related travel information found.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TravelInfoDetailClient;
