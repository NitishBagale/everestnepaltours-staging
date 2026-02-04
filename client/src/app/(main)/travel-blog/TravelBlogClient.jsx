"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getMediaObject, getMediaUrl } from "@/lib/media";
import { FaRegCalendarAlt } from "react-icons/fa";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1920&auto=format&fit=crop";

const TravelBlogClient = ({
  posts = [],
  bannerImage = "",
  contentTitle = "Travel Blog",
  contentSubtitle = "Travel Blog",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const [visibleCount, setVisibleCount] = useState(9);
  const loaderRef = useRef(null);
  const bannerUrl = useMemo(() => {
    if (!bannerImage) return "";
    return getMediaUrl(getMediaObject(bannerImage), "large") || "";
  }, [bannerImage]);

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

  useEffect(() => {
    const param = searchParams?.get("search") || "";
    setSearchQuery(param);
  }, [searchParams]);

  useEffect(() => {
    setVisibleCount(9);
  }, [searchQuery, posts]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + 9);
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, []);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) => {
      const title = (post.mainTitle || post.title || "").toLowerCase();
      const excerpt = (post.excerpt || post.description || "").toLowerCase();
      return title.includes(query) || excerpt.includes(query);
    });
  }, [posts, searchQuery]);

  return (
    <div className="font-sans text-gray-700 bg-white min-h-screen">
      <div className="w-full h-48 md:h-64 relative overflow-hidden bg-sky-200">
        <img
          src={bannerUrl || DEFAULT_IMAGE}
          alt="Himalayas Banner"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 pb-4 mb-8">
          <div className="mb-4 md:mb-0">
            <h2
              className="text-2xl font-bold text-gray-800"
              style={{ fontFamily: "var(--font-museo)" }}
            >
              {contentTitle}
            </h2>
            {contentSubtitle && (
              <span
                className="text-teal-500 text-base font-medium"
                style={{ fontFamily: "var(--font-museo)" }}
              >
                {contentSubtitle}
              </span>
            )}
          </div>

          <div className="w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex items-center">
              <label className="text-sm font-bold text-gray-500 mr-2 uppercase">
                Search
              </label>
              <div className="flex border border-yellow-400 rounded-sm overflow-hidden">
                <input
                  type="text"
                  className="px-3 py-2 text-base focus:outline-none w-56"
                  placeholder="Enter Keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

        {filteredPosts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No posts found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {filteredPosts.slice(0, visibleCount).map((post) => {
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

                <div className="flex items-center text-sm text-gray-400 mb-2">
                  <FaRegCalendarAlt className="mr-1 text-gray-400" />
                  {formatDate(post.date || post.createdAt)}
                </div>

                <h3 className="text-lg font-bold text-gray-800 leading-snug group-hover:text-teal-600 transition-colors">
                  <Link href={linkUrl}>{post.mainTitle}</Link>
                </h3>

                {post.description && (
                  <p className="text-base text-gray-600 mt-2 line-clamp-2">
                    {post.description}
                  </p>
                )}
              </div>
            );
            })}
          </div>
        )}

        {filteredPosts.length > visibleCount && (
          <div
            ref={loaderRef}
            className="mt-12 flex justify-center text-sm text-gray-400"
          >
            Loading more posts...
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelBlogClient;
