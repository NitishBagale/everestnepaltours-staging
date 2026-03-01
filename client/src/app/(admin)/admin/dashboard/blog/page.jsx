"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";
import toast, { Toaster } from "react-hot-toast";
import MediaPickerModal from "@/components/media/MediaPickerModal";
import RichEditor from "@/components/editor/RichEditor";

const initialFormData = {
  mainTitle: "",
  slug: "",
  excerpt: "",
  date: new Date().toISOString().split("T")[0],
  blogContant: "",
  coverImage: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
};

const toDateInputValue = (value) => {
  if (!value) return new Date().toISOString().split("T")[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  return parsed.toISOString().split("T")[0];
};

const normalizeCoverMedia = (media) => {
  if (!media) return "";
  if (typeof media === "string") {
    return { mediaId: null, url: media, variants: {}, title: "", altText: "" };
  }
  return media;
};

const resolveBlogSource = (postData) =>
  postData?.dataValues ||
  postData?.attributes ||
  postData?.blog ||
  postData?.data ||
  postData ||
  {};

const mapBlogToForm = (postData) => {
  const source = resolveBlogSource(postData);
  const resolvedSlug = source.slug || source.Slug || source.slugName || "";
  const resolvedTitle = source.mainTitle || source.title || source.name || "";

  return {
    mainTitle: resolvedTitle,
    slug: resolvedSlug,
    excerpt: source.excerpt || source.description || "",
    date: toDateInputValue(source.date),
    blogContant: source.blogContant || "",
    coverImage: normalizeCoverMedia(source.coverImage),
    meta_title: source.meta_title || "",
    meta_description: source.meta_description || "",
    meta_keywords: source.meta_keywords || "",
  };
};

const BlogAdminPage = () => {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [blogPosts, setBlogPosts] = useState([]);
  const [editBlogSlug, setEditBlogSlug] = useState(null);
  const [editBlogTitle, setEditBlogTitle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getToken = () => {
    return Cookies.get("accessToken") || Cookies.get("token");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditorChange = (content) => {
    setFormData({ ...formData, blogContant: content });
  };

  const handleCancelEdit = () => {
    setEditBlogSlug(null);
    setEditBlogTitle(null);
    setFormData(initialFormData);
  };

  const fetchBlogPosts = useCallback(async () => {
    setListLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${BASE_URL}/blog/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogPosts(response.data.data || response.data || []);
    } catch (error) {
      console.error("Fetch Blogs Error:", error);
      toast.error("Failed to load blog posts.");
      setBlogPosts([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  useEffect(() => {
    if (!editBlogSlug && !editBlogTitle) return;
    const selected = blogPosts.find(
      (post) =>
        post?.slug === editBlogSlug ||
        post?.mainTitle === editBlogTitle ||
        post?.title === editBlogTitle
    );
    if (selected) {
      setFormData(mapBlogToForm(selected));
    }
  }, [blogPosts, editBlogSlug, editBlogTitle]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, blogPosts.length]);

  const handleEdit = (postData) => {
    const source = resolveBlogSource(postData);
    const resolvedSlug = source.slug || source.Slug || source.slugName || "";
    const resolvedTitle = source.mainTitle || source.title || source.name || "";
    setEditBlogSlug(resolvedSlug || resolvedTitle || null);
    setEditBlogTitle(resolvedTitle || null);
    setFormData(mapBlogToForm(postData));
    const scrollContainer = document.getElementById("admin-scroll-area");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCoverSelect = (media) => {
    setFormData((prev) => ({ ...prev, coverImage: media }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = getToken();
      if (!accessToken) {
        toast.error("Authentication required");
        setLoading(false);
        return;
      }

      if (!formData.coverImage) {
        toast.error("Cover image is required");
        setLoading(false);
        return;
      }

      const finalCoverImageUrl =
        formData.coverImage?.url || formData.coverImage || "";

      const payload = {
        ...formData,
        description: formData.excerpt || "",
        coverImage: finalCoverImageUrl,
      };

      let successMessage;

      if (editBlogSlug) {
        const targetName = editBlogTitle || formData.mainTitle;
        await axios.put(
          `${BASE_URL}/blog/by-name?name=${encodeURIComponent(targetName)}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        successMessage = "Blog updated successfully!";
      } else {
        await axios.post(`${BASE_URL}/blog/`, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        successMessage = "Blog published successfully!";
      }

      toast.success(successMessage);
      handleCancelEdit();
      fetchBlogPosts();
    } catch (error) {
      console.error("Submit Error:", error);
      const msg =
        error.response?.data?.message ||
        `Failed to ${editBlogSlug ? "update" : "publish"}`;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postTitle) => {
    const title = postTitle || "This Blog Post";

    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col p-2 bg-white rounded-lg shadow-lg">
            <p className="text-sm font-semibold mb-3">
              Are you sure you want to delete{" "}
              <span className="text-red-600 font-bold">"{title}"</span>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

    if (!confirmed) {
      return;
    }

    const deleteToastId = toast.loading(`Deleting ${title}...`);
    try {
      const token = getToken();

      await axios.delete(
        `${BASE_URL}/blog/by-name?name=${encodeURIComponent(postTitle)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(`${title} deleted successfully!`, { id: deleteToastId });
      fetchBlogPosts();
      handleCancelEdit();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error(
        error.response?.data?.message || `Failed to delete ${title}`,
        {
          id: deleteToastId,
        }
      );
    }
  };

  const filteredBlogPosts = blogPosts.filter((post) => {
    const title = post?.mainTitle || "";
    const slug = post?.slug || "";
    const query = searchTerm.trim().toLowerCase();
    return (
      title.toLowerCase().includes(query) || slug.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBlogPosts.length / itemsPerPage)
  );

  const pagedBlogPosts = filteredBlogPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <Toaster position="top-center" />

      <div className="w-full">
        <div className="w-full max-w-7xl">
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-md mb-6 md:mb-10">
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6 text-gray-800 border-b pb-2">
              {editBlogSlug
                ? `Edit Blog: ${formData.mainTitle}`
                : "Add New Blog"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Main Title
                  </label>
                  <input
                    type="text"
                    name="mainTitle"
                    value={formData.mainTitle}
                    onChange={handleChange}
                    className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                    placeholder="Enter blog title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] bg-gray-100 text-sm"
                    placeholder="auto-generated-from-title"
                    required
                    readOnly={!!editBlogSlug}
                  />
                  {editBlogSlug && (
                    <p className="text-xs text-gray-500 mt-1">
                      Slug cannot be changed
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold mb-2">
                  Excerpt
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                  rows="3"
                  placeholder="Short summary for the blog"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Cover Image
                </label>
                {formData.coverImage ? (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={
                        formData.coverImage.variants?.medium ||
                        formData.coverImage.url ||
                        formData.coverImage
                      }
                      alt="Current cover"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, coverImage: "" }))
                      }
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMediaModalOpen(true)}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm text-gray-500"
                  >
                    Select from Media Library
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(true)}
                  className="mt-3 text-xs font-semibold text-[var(--admin-primary)] hover:underline"
                >
                  Choose / Change Cover Image
                </button>
              </div>

              <div className="mb-16">
                <label className="block text-sm font-semibold mb-2">
                  Blog Content
                </label>
                <RichEditor
                  value={formData.blogContant}
                  onChange={handleEditorChange}
                  height="h-[520px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleChange}
                    className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                    placeholder="SEO title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    name="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={handleChange}
                    className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                    placeholder="keyword1, keyword2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Meta Description
                </label>
                <textarea
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                  rows="3"
                  placeholder="SEO description"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[var(--admin-primary)] text-white font-bold py-2.5 md:py-3 rounded hover:bg-[var(--admin-primary-strong)] transition disabled:opacity-50 text-sm md:text-base"
                >
                  {loading
                    ? "Processing..."
                    : editBlogSlug
                    ? "Update Blog Post"
                    : "Publish New Blog"}
                </button>

                {editBlogSlug && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="sm:w-40 bg-gray-300 text-gray-800 font-bold py-2.5 md:py-3 rounded hover:bg-gray-400 transition text-sm md:text-base"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-4 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                Your Blog Posts ({filteredBlogPosts.length})
              </h2>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or slug..."
                className="w-full sm:w-72 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]/30 focus:border-[var(--admin-primary-border)]"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-[var(--admin-primary-soft-strong)] text-left text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Image</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listLoading ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                        Loading blog posts...
                      </td>
                    </tr>
                  ) : pagedBlogPosts.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                        No blog posts found.
                      </td>
                    </tr>
                  ) : (
                    pagedBlogPosts.map((post) => (
                      <tr key={post.slug} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <img
                            src={post.coverImage || "/default-blog-cover.jpg"}
                            alt={post.mainTitle}
                            className="w-16 h-12 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/default-blog-cover.jpg";
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-800 max-w-[420px]">
                          <div className="font-semibold line-clamp-1">
                            {post.mainTitle || "Untitled"}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            Slug: {post.slug || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {post.date ? new Date(post.date).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(post)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] hover:bg-[var(--admin-primary-soft-strong)] text-xs font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(post.mainTitle)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredBlogPosts.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Showing {pagedBlogPosts.length} of {filteredBlogPosts.length} posts
                  {" • "}
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <MediaPickerModal
        open={mediaModalOpen}
        onOpenChange={setMediaModalOpen}
        onSelect={handleCoverSelect}
        title="Select Cover Image"
      />
    </>
  );
};

export default BlogAdminPage;
