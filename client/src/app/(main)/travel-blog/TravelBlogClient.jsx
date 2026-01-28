"use client";

import React, { useState } from "react";
import Link from "next/link";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1920&auto=format&fit=crop";

const TravelBlogClient = ({ posts = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="font-sans text-gray-700 bg-white min-h-screen">
      <div className="w-full h-48 md:h-64 relative overflow-hidden bg-sky-200">
        <img
          src={DEFAULT_IMAGE}
          alt="Himalayas Banner"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 pb-4 mb-8">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-gray-800">Category:</h2>
            <span className="text-teal-500 text-sm font-medium">
              Travel Blog
            </span>
          </div>

          <div className="w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex items-center">
              <label className="text-xs font-bold text-gray-500 mr-2 uppercase">
                Search
              </label>
              <div className="flex border border-yellow-400 rounded-sm overflow-hidden">
                <input
                  type="text"
                  className="px-3 py-1 text-sm focus:outline-none w-48"
                  placeholder="Enter Keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 px-3 flex items-center justify-center text-white transition-colors"
                ></button>
              </div>
            </form>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No posts found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {posts.map((post) => {
              const imageUrl =
                post.coverImage ||
                "https://placehold.co/600x400/0EA5E9/ffffff?text=Blog+Post";
              const linkUrl = `/travel-blog/${post.slug}`;

              return (
                <div key={post.id || post._id} className="group">
                  <Link
                    href={linkUrl}
                    className="block overflow-hidden rounded-sm mb-4 relative h-52 bg-gray-100"
                  >
                    <img
                      src={imageUrl}
                      alt={post.mainTitle || "Blog post"}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/600x400/0EA5E9/ffffff?text=Blog+Post";
                      }}
                      className="w-full h-full object-cover"
                      style={{ display: "block" }}
                    />
                  </Link>

                  <div className="flex items-center text-xs text-gray-400 mb-2">
                    <span className="mr-1">📅</span>
                    {formatDate(post.date || post.createdAt)}
                  </div>

                  <h3 className="text-sm md:text-base font-bold text-gray-800 leading-snug group-hover:text-teal-600 transition-colors">
                    <Link href={linkUrl}>{post.mainTitle}</Link>
                  </h3>

                  {post.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 border-t border-gray-100 pt-6 flex justify-between text-xs font-bold text-teal-500 uppercase tracking-wide">
          <button className="hover:text-teal-700 transition-colors cursor-pointer">
            &larr; Older posts
          </button>

          <button
            className="hover:text-teal-700 transition-colors cursor-pointer disabled:text-gray-300"
            disabled
          >
            Newer posts &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default TravelBlogClient;
