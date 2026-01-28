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
  description: "",
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
    description: source.description || "",
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

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                  rows="3"
                  placeholder="Short summary for the blog"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Blog Content
                </label>
                <RichEditor
                  value={formData.blogContant}
                  onChange={handleEditorChange}
                  height="h-[520px]"
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

          <div className="bg-white shadow-xl rounded-lg p-4 md:p-6 lg:p-8">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 border-b pb-2">
              Your Blog Posts ({blogPosts.length})
            </h2>

            {listLoading ? (
              <div className="p-4 text-center text-sm md:text-base">
                Loading blog posts...
              </div>
            ) : blogPosts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm md:text-base">
                No blog posts found.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {blogPosts.map((post) => (
                  <div
                    key={post.slug}
                    className="py-3 md:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="flex items-start grow min-w-0 w-full sm:w-auto">
                      <img
                        src={post.coverImage || "/default-blog-cover.jpg"}
                        alt={post.mainTitle}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded mr-3 sm:mr-4 shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-blog-cover.jpg";
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm md:text-base font-semibold truncate">
                          {post.mainTitle}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {new Date(post.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          Slug: {post.slug}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-strong)] font-medium text-sm px-3 py-1.5 border border-[var(--admin-primary-border)] rounded hover:bg-[var(--admin-primary-soft)] transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.mainTitle)}
                        className="text-red-600 hover:text-red-900 font-medium text-sm px-3 py-1.5 border border-red-600 rounded hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
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
