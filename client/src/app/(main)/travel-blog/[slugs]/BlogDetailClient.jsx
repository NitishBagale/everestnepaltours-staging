"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaRegCalendarAlt } from "react-icons/fa";
import Script from "next/script";

const BlogDetailClient = ({ blogData, relatedBlogs = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/travel-blog?search=${encodeURIComponent(query)}`);
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
  const disqusShortname = "himalayanadventureholidays-com";
  const disqusIdentifier =
    blogData.slug || blogData.id || blogData._id || title;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.disqus_config = function () {
      this.page.url = window.location.href;
      this.page.identifier = disqusIdentifier;
    };

    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: window.disqus_config,
      });
      return;
    }
  }, [disqusIdentifier, disqusShortname]);

  const filteredRecentPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return relatedBlogs;
    return relatedBlogs.filter((post) => {
      const titleText = (post.mainTitle || post.title || "").toLowerCase();
      const excerptText = (post.excerpt || post.description || "").toLowerCase();
      return titleText.includes(query) || excerptText.includes(query);
    });
  }, [relatedBlogs, searchQuery]);

  return (
    <div className="font-sans text-gray-700 bg-white min-h-screen">
      <div className="w-full h-48 md:h-80 overflow-hidden relative bg-blue-900">
        <img
          src={bannerImage}
          alt={title}
          className="w-full h-full object-cover opacity-90"
        />
      </div>

      <div className="w-full bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {title}
              </h1>
              <div className="flex items-center text-teal-600 font-medium">
                <FaRegCalendarAlt className="mr-2 text-lg" />
                {date}
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <form onSubmit={handleSearch} className="flex items-center">
                <label className="text-sm font-bold text-gray-500 mr-2 uppercase">
                  Search
                </label>
                <div className="flex border border-yellow-400 rounded-sm overflow-hidden bg-white">
                  <input
                    type="text"
                    placeholder="Enter Keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 text-base focus:outline-none w-full lg:w-56 bg-white"
                  />
                  <button
                    type="submit"
                    className="bg-yellow-400 hover:bg-yellow-500 px-3 flex items-center justify-center text-white transition-colors"
                    aria-label="Search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div
          className="prose prose-base md:prose-lg max-w-none text-gray-600 leading-7"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <div className="pt-10">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Comments</h3>
          <div id="disqus_thread"></div>
          <noscript>
            Please enable JavaScript to view the comments powered by Disqus.
          </noscript>
        </div>
      </div>

      <Script
        id="disqus-embed-script"
        src={`https://${disqusShortname}.disqus.com/embed.js`}
        strategy="lazyOnload"
        data-timestamp={String(+new Date())}
      />

      {filteredRecentPosts.length > 0 && (
        <div className="w-full bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Recent Posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
              {filteredRecentPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id || relatedPost.slug}
                  href={`/travel-blog/${relatedPost.slug}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-lg mb-4 h-48 bg-gray-100">
                    <img
                      src={
                        relatedPost.coverImage ||
                        "https://placehold.co/400x300"
                      }
                      alt={relatedPost.mainTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <FaRegCalendarAlt className="mr-1 text-gray-400" />
                    {formatDate(relatedPost.date || relatedPost.createdAt)}
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 group-hover:text-teal-600 transition line-clamp-2">
                    {relatedPost.mainTitle}
                  </h4>
                  {(relatedPost.excerpt || relatedPost.description) && (
                    <p className="text-base text-gray-600 mt-2 line-clamp-2">
                      {relatedPost.excerpt || relatedPost.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetailClient;
