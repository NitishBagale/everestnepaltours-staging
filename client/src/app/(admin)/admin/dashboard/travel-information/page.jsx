"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";
import toast, { Toaster } from "react-hot-toast";
import RichEditor from "@/components/editor/RichEditor";

const initialFormData = {
  title: "",
  slug: "",
  status: true,
  description: "",
  details: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
};

const TravelInformationAdminPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [editPageId, setEditPageId] = useState(null);
  const [pages, setPages] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .ql-editor img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 10px 0;
      }
      .ql-container {
        overflow: visible !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fetchTravelInfoPages = useCallback(async () => {
    setListLoading(true);
    try {
      const token = Cookies.get("accessToken") || Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/cms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter only travel information pages
      const travelPages =
        response.data.data?.filter((page) =>
          page.section?.startsWith("travel-info-")
        ) || [];

      setPages(travelPages);
    } catch (error) {
      console.error("Fetch Pages Error:", error);
      toast.error("Failed to load travel information pages.");
      setPages([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTravelInfoPages();
  }, [fetchTravelInfoPages]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "title" && !editPageId) {
      // Auto-generate slug from title
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      setFormData((prev) => ({
        ...prev,
        title: value,
        slug: autoSlug,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleQuillChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancelEdit = () => {
    setEditPageId(null);
    setFormData(initialFormData);
  };

  const handleEdit = (pageData) => {
    setEditPageId(pageData.section);
    setFormData({
      title: pageData.content?.title || "",
      slug: pageData.slug || "",
      status: pageData.status || false,
      description: pageData.content?.description || "",
      details: pageData.content?.details || "",
      meta_title: pageData.meta_title || "",
      meta_description: pageData.meta_description || "",
      meta_keywords: pageData.meta_keywords || "",
    });
    const scrollContainer = document.getElementById("admin-scroll-area");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const section = `travel-info-${formData.slug}`;

    const payload = {
      section: section,
      slug: formData.slug,
      content: {
        title: formData.title?.trim() || null,
        description: formData.description,
        details: formData.details,
      },
      status: formData.status,
      meta_title: formData.meta_title,
      meta_description: formData.meta_description,
      meta_keywords: formData.meta_keywords,
    };

    try {
      const token = Cookies.get("accessToken") || Cookies.get("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let successMessage;

      if (editPageId) {
        const encodedSection = encodeURIComponent(section);
        await axios.put(`${BASE_URL}/cms/${encodedSection}`, payload, config);
        successMessage = "Travel information updated successfully!";
      } else {
        await axios.post(`${BASE_URL}/cms/`, payload, config);
        successMessage = "Travel information created successfully!";
      }

      toast.success(successMessage);
      handleCancelEdit();
      fetchTravelInfoPages();
    } catch (error) {
      console.error("API Error:", error);
      let errorMessage = `Failed to ${
        editPageId ? "update" : "create"
      } travel information`;

      if (!error.response) {
        errorMessage =
          "Network error: Cannot connect to the server. Please ensure the backend server is running.";
      } else if (error.response?.status === 403) {
        errorMessage = "Authorization failed. Contact an administrator.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (section, title) => {
    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold mb-3">
              Delete <span className="text-red-600">"{title}"</span>?
            </p>
            <div className="flex gap-2">
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

    if (!confirmed) return;

    const deleteToastId = toast.loading(`Deleting ${title}...`);
    try {
      const token = Cookies.get("accessToken") || Cookies.get("token");
      const encodedSection = encodeURIComponent(section);

      await axios.delete(`${BASE_URL}/cms/${encodedSection}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`${title} deleted successfully!`, { id: deleteToastId });
      fetchTravelInfoPages();
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


  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages;

    const query = searchQuery.toLowerCase();
    return pages.filter((page) => {
      const title = page.content?.title?.toLowerCase() || "";
      const slug = page.slug?.toLowerCase() || "";
      return title.includes(query) || slug.includes(query);
    });
  }, [pages, searchQuery]);

  const inputClass =
    "w-full p-2 border border-gray-300 rounded focus:ring-[var(--admin-primary-ring)] focus:border-[var(--admin-primary-border)]";
  const labelClass = "block text-sm font-medium text-gray-700 mt-4";

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      <Toaster position="top-center" />

      <div className="bg-white shadow-xl rounded-lg p-6 mb-10">
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">
          {editPageId
            ? `Edit: ${formData.title || editPageId}`
            : "Create New Travel Info"}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="title" className={labelClass}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="e.g., Communication"
                required
              />
            </div>
            <div>
              <label htmlFor="slug" className={labelClass}>
                Slug (URL) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="communication"
                required
                disabled={editPageId}
              />
              <p className="text-xs text-gray-500 mt-1">
                URL: /travel-information/{formData.slug || "slug"}
              </p>
            </div>
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="status"
              name="status"
              checked={formData.status}
              onChange={handleInputChange}
              className="h-4 w-4 text-[var(--admin-primary)] border-gray-300 rounded mr-2"
            />
            <label
              htmlFor="status"
              className="text-sm font-medium text-gray-700"
            >
              Publish (visible on website)
            </label>
          </div>

          <div>
            <label className={labelClass}>Description / Overview</label>
            <RichEditor
              value={formData.description}
              onChange={(value) => handleQuillChange("description", value)}
              height="h-80"
            />
          </div>

          <div>
            <label className={labelClass}>Detailed Content</label>
            <RichEditor
              value={formData.details}
              onChange={(value) => handleQuillChange("details", value)}
              height="h-80"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className={labelClass}>Meta Title</label>
              <input
                type="text"
                name="meta_title"
                value={formData.meta_title}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="SEO title"
              />
            </div>
            <div>
              <label className={labelClass}>Meta Keywords</label>
              <input
                type="text"
                name="meta_keywords"
                value={formData.meta_keywords}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="keyword1, keyword2"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Meta Description</label>
            <textarea
              name="meta_description"
              value={formData.meta_description}
              onChange={handleInputChange}
              className={inputClass}
              rows={3}
              placeholder="Short SEO description"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-md text-white font-semibold transition duration-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-strong)]"
              }`}
            >
              {loading
                ? "Saving..."
                : editPageId
                ? "Update Travel Info"
                : "Create Travel Info"}
            </button>

            {editPageId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-3 px-4 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold transition duration-200"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-10 bg-white shadow-xl rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">
          Existing Travel Info Pages ({pages.length})
        </h2>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
          />
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Found {filteredPages.length} page
              {filteredPages.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {listLoading ? (
          <div className="p-4 text-center">Loading pages...</div>
        ) : pages.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No travel information pages found. Start creating one!
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No pages match your search.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPages.map((page, index) => (
              <div
                key={page._id || `page-${index}`}
                className="py-4 flex justify-between items-center"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base md:text-lg font-semibold truncate">
                    {page.content?.title || "N/A"}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 truncate">
                    Slug: {page.slug} | Status:{" "}
                    {page.status ? "Published" : "Draft"}
                  </p>
                  <a
                    href={`/travel-information/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--admin-primary)] hover:underline"
                  >
                    View on website →
                  </a>
                </div>
                <div className="space-x-4">
                  <button
                    onClick={() => handleEdit(page)}
                    className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-strong)] font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(page.section, page.content?.title || "Page")
                    }
                    className="text-red-600 hover:text-red-900 font-medium"
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
  );
};

export default TravelInformationAdminPage;
