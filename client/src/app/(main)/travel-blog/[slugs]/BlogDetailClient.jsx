"use client";

import React, { useState } from "react";
import Link from "next/link";

const BlogDetailClient = ({ blogData, relatedBlogs = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!blogData) {
    return (
      <div className="p-20 text-center text-red-500">Blog post not found.</div>
    );
  }

  const title = blogData.mainTitle || "Blog Post";
  const date = formatDate(blogData.date || blogData.createdAt);
  const content = blogData.blogContant || "<p>Content not available.</p>";
  const bannerImage =
    blogData.coverImage || "https://placehold.co/1920x400?text=Blog+Banner";

  return (
    <div className="font-sans text-gray-700 bg-white min-h-screen">
      <div className="w-full h-48 md:h-80 overflow-hidden relative bg-blue-900">
        <img
          src={bannerImage}
          alt={title}
          className="w-full h-full object-cover opacity-90"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              {title}
            </h1>

            <div className="flex items-center text-teal-600 font-medium mb-8">
              <span className="mr-2 text-lg">📅</span> {date}
            </div>

            <div
              className="prose prose-sm md:prose-base max-w-none text-gray-600 leading-7"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {relatedBlogs.length > 0 && (
              <div className="mt-12 border-t pt-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Related Articles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedBlogs.map((relatedPost) => (
                    <Link
                      key={relatedPost.id || relatedPost.slug}
                      href={`/travel-blog/${relatedPost.slug}`}
                      className="group"
                    >
                      <div className="overflow-hidden rounded-lg mb-3 h-40 bg-gray-100">
                        <img
                          src={
                            relatedPost.coverImage ||
                            "https://placehold.co/400x300"
                          }
                          alt={relatedPost.mainTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="text-sm font-bold text-gray-800 group-hover:text-teal-600 transition line-clamp-2">
                        {relatedPost.mainTitle}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(relatedPost.date || relatedPost.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-10 space-y-8">
              <div className="relative">
                <form
                  onSubmit={handleSearch}
                  className="flex border border-gray-300 rounded overflow-hidden shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 px-3 text-sm focus:outline-none focus:bg-gray-50"
                  />
                  <button
                    type="submit"
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 flex items-center justify-center"
                  >
                    🔍
                  </button>
                </form>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">
                  Destinations
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="cursor-pointer hover:text-teal-600 transition">
                    › Bhutan Nepal Tours
                  </li>
                  <li className="cursor-pointer hover:text-teal-600 transition">
                    › Tibet Tours
                  </li>
                  <li className="cursor-pointer hover:text-teal-600 transition">
                    › Nepal Trekking
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailClient;
