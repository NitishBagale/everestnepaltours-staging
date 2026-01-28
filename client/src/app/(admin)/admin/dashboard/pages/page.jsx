"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";
import toast, { Toaster } from "react-hot-toast";
import { ImagePlus, X, Plus, Trash2 } from "lucide-react";
import RichEditor from "@/components/editor/RichEditor";
import MediaPickerModal from "@/components/media/MediaPickerModal";

const initialFormData = {
  section: "",
  slug: "",
  status: true,
  title: "",
  subtitle: "",
  description: "",
  details: "",
  activities: "",
  category: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  galleryImages: [],
  faq: [],
  showBookingForm: false,
};

const normalizeMedia = (media) => {
  if (!media) return null;
  if (typeof media === "string") {
    return { mediaId: null, url: media, variants: {}, title: "", altText: "" };
  }
  return media;
};

const CmsAdminPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [editPageId, setEditPageId] = useState(null);
  const [pages, setPages] = useState([]);
  const [sortedPages, setSortedPages] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const slugify = (value) => {
    if (!value) return "";
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .ql-editor img {
        max-width: 45%;
        height: auto;
        display: inline-block;
        margin: 10px;
        vertical-align: top;
      }
      .ql-editor img.ql-align-center {
        display: block;
        margin: 10px auto;
        max-width: 100%;
      }
      .ql-editor img.ql-align-right {
        float: right;
        margin: 0 0 10px 20px;
      }
      .ql-editor img.ql-align-left {
        float: left;
        margin: 0 20px 10px 0;
      }
      .ql-container {
        overflow: visible !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/category/`);
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Fetch Categories Error:", error);
      toast.error("Failed to load categories.");
      setCategories([]);
    }
  }, []);

  const fetchCmsPages = useCallback(async () => {
    setListLoading(true);
    try {
      const token = Cookies.get("accessToken") || Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/cms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = response.data.data || [];
      setPages(list);
      setSortedPages(list);
    } catch (error) {
      console.error("Fetch Pages Error:", error);
      toast.error("Failed to load CMS pages.");
      setPages([]);
      setSortedPages([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchCmsPages();
  }, [fetchCategories, fetchCmsPages]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "section") {
        const previousAutoSlug = slugify(prev.section);
        if (!prev.slug || prev.slug === previousAutoSlug) {
          next.slug = slugify(value);
        }
      }

      return next;
    });
  };

  const handleQuillChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faq: [...prev.faq, { id: Date.now(), question: "", answer: "" }],
    }));
  };

  const removeFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index),
    }));
  };

  const handleFaqChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      faq: prev.faq.map((faq, i) =>
        i === index ? { ...faq, [field]: value } : faq
      ),
    }));
  };

  const handleCancelEdit = () => {
    setEditPageId(null);
    setFormData(initialFormData);
    setShowMoreDetails(false);
  };

  const getCategoryName = (categoryId) => {
    const target = categoryId != null ? String(categoryId) : "";
    const category = categories.find(
      (cat) => String(cat._id || cat.id) === target
    );
    return category ? category.name : "No Category";
  };

  const handleEdit = (pageData) => {
    setEditPageId(pageData.section);
    const nextForm = {
      section: pageData.section || "",
      slug: pageData.slug || "",
      status: pageData.status || false,
      title: pageData.content?.title || "",
      subtitle: pageData.content?.subtitle || "",
      description: pageData.content?.description || "",
      details: pageData.content?.details || "",
      activities: pageData.content?.activities || "",
      category:
        pageData.categoryId != null ? String(pageData.categoryId) : "",
      meta_title: pageData.meta_title || "",
      meta_description: pageData.meta_description || "",
      meta_keywords: pageData.meta_keywords || "",
      galleryImages: (pageData.content?.galleryImages || [])
        .map((img) => normalizeMedia(img))
        .filter(Boolean),
      faq: pageData.content?.faq || [],
      showBookingForm: pageData.content?.showBookingForm || false,
    };
    setFormData(nextForm);
    const hasExtras =
      !!nextForm.details ||
      !!nextForm.activities ||
      (nextForm.galleryImages || []).length > 0 ||
      (nextForm.faq || []).length > 0 ||
      !!nextForm.showBookingForm;
    setShowMoreDetails(hasExtras);
    const scrollContainer = document.getElementById("admin-scroll-area");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGallerySelect = (media) => {
    setFormData((prev) => {
      const existingIds = new Set(prev.galleryImages.map((img) => img.mediaId));
      if (existingIds.has(media.mediaId)) return prev;
      return { ...prev, galleryImages: [...prev.galleryImages, media] };
    });
  };

  const removeGalleryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
    toast.success("Image removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanedFaq = formData.faq.map(({ id, ...faq }) => faq);

    const metaTitle = formData.meta_title?.toString().trim() || "";
    const metaDescription = formData.meta_description?.toString().trim() || "";
    const metaKeywords = formData.meta_keywords?.toString().trim() || "";

    const payload = {
      section: formData.section,
      slug: formData.slug?.trim() || undefined,
      content: {
        subtitle: formData.subtitle?.trim() || "",
        title: formData.title?.trim() || "",
        description: formData.description,
        details: formData.details,
        activities: formData.activities,
        galleryImages: formData.galleryImages,
        faq: cleanedFaq,
        showBookingForm: formData.showBookingForm,
      },
      status: formData.status,
      categoryId: formData.category?.trim() || undefined,
      meta_title: metaTitle || undefined,
      meta_description: metaDescription || undefined,
      meta_keywords: metaKeywords || undefined,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    try {
      const token = Cookies.get("accessToken") || Cookies.get("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let successMessage;

      if (editPageId) {
        const encodedSection = encodeURIComponent(formData.section);
        await axios.put(`${BASE_URL}/cms/${encodedSection}`, payload, config);
        successMessage = "CMS Page updated successfully!";
      } else {
        const data = await axios.post(`${BASE_URL}/cms/`, payload, config);

        console.log(data.data);
        successMessage = "CMS Page created successfully!";
      }

      toast.success(successMessage);
      handleCancelEdit();
      fetchCmsPages();
    } catch (error) {
      console.error("API Error:", error);

      let errorMessage = `Failed to ${
        editPageId ? "update" : "create"
      } CMS page`;

      if (!error.response) {
        // Network error
        errorMessage =
          "Network error: Cannot connect to the server. Please ensure the backend server is running on " +
          BASE_URL;
      } else if (error.response?.status === 403) {
        errorMessage =
          "Authorization failed. Your admin role may not be properly configured. Contact an administrator.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (section) => {
    const pageToDelete = pages.find((p) => p.section === section);
    const title = pageToDelete?.content?.title || "This Page";

    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex items-center justify-center">
            <p className="text-sm font-semibold mb-2">
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
      const token = Cookies.get("accessToken") || Cookies.get("token");
      const encodedSection = encodeURIComponent(section);

      await axios.delete(`${BASE_URL}/cms/${encodedSection}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`${title} deleted successfully!`, { id: deleteToastId });
      fetchCmsPages();
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
    if (!searchQuery.trim()) return sortedPages;

    const query = searchQuery.toLowerCase();
    return sortedPages.filter((page) => {
      const title = page.content?.title?.toLowerCase() || "";
      const subtitle = page.content?.subtitle?.toLowerCase() || "";
      const section = page.section?.toLowerCase() || "";

      return (
        title.includes(query) ||
        subtitle.includes(query) ||
        section.includes(query)
      );
    });
  }, [sortedPages, searchQuery]);

  const isSearchActive = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setVisibleCount(10);
    }
  }, [searchQuery]);

  const handlePagesDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    let nextOrder = [];
    setSortedPages((items) => {
      const oldIndex = items.findIndex(
        (page) =>
          String(page._id || page.id || page.section) === String(active.id)
      );
      const newIndex = items.findIndex(
        (page) =>
          String(page._id || page.id || page.section) === String(over.id)
      );
      if (oldIndex === -1 || newIndex === -1) return items;
      nextOrder = arrayMove(items, oldIndex, newIndex);
      return nextOrder;
    });

    if (!nextOrder.length) return;
    try {
      const token = Cookies.get("accessToken") || Cookies.get("token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }
      await axios.post(
        `${BASE_URL}/cms/reorder`,
        {
          orderUpdates: nextOrder.map((page, index) => ({
            id: page._id || page.id,
            sort_order: index + 1,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error("Failed to save page order:", error);
      toast.error("Failed to save page order");
    }
  };

  const SortablePageRow = ({ page }) => {
    const id = String(page._id || page.id || page.section);
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="py-4 flex justify-between items-center"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className="mt-1 text-gray-400 cursor-grab select-none"
            {...attributes}
            {...listeners}
            aria-label="Drag handle"
          >
            ⋮⋮
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base md:text-lg font-semibold truncate">
              {page.content?.title || "N/A"}
            </p>
            {page.content?.subtitle && (
              <p className="text-sm md:text-base text-gray-600 truncate">
                {page.content.subtitle}
              </p>
            )}
            <p className="text-xs md:text-sm text-gray-500 truncate">
              {page.section} | Status: Status:{" "}
              {page.status ? "Published" : "Draft"}
            </p>
            {page.categoryId && (
              <p className="text-xs text-[var(--admin-primary)] mt-1">
                Category: {getCategoryName(page.categoryId)}
              </p>
            )}
          </div>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => handleEdit(page)}
            className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-strong)] font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(page.section)}
            className="text-red-600 hover:text-red-900 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  const inputClass =
    "w-full p-2 border border-gray-300 rounded focus:ring-[var(--admin-primary-ring)] focus:border-[var(--admin-primary-border)]";
  const selectClass =
    "w-full p-2 border border-gray-300 rounded bg-white pr-10 shadow-sm focus:ring-2 focus:ring-[var(--admin-primary-ring)] focus:border-[var(--admin-primary-border)] appearance-none";
  const labelClass = "block text-sm font-medium text-gray-700 mt-4";

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      <Toaster position="top-center" />

      <div className="bg-white shadow-xl rounded-lg p-6 mb-10">
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">
          {editPageId
            ? `Edit Page: ${formData.title || editPageId}`
            : "Create New Page Content"}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="section" className={labelClass}>
                Section Name
              </label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Adventure Sports"
                required
              />
            </div>
            <div>
              <label htmlFor="slug" className={labelClass}>
                Slug
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="adventure-sports"
              />
            </div>
            <div className="flex items-end pb-2">
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
                Publish Page
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={selectClass}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                <option
                  key={cat._id || cat.id}
                  value={String(cat._id || cat.id)}
                >
                  {cat.name}
                </option>
              ))}
            </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M6 8l4 4 4-4" />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="title" className={labelClass}>
              Content Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Easy to Hard Adventure Sports"
              required
            />
          </div>

          <div>
            <label htmlFor="subtitle" className={labelClass}>
              Content Subtitle
            </label>
            <input
              type="text"
              id="subtitle"
              name="subtitle"
              value={formData.subtitle ?? ""}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Enter subtitle here"
            />
          </div>

          <div>
            <label htmlFor="meta_title" className={labelClass}>
              Meta Title
            </label>
            <input
              type="text"
              id="meta_title"
              name="meta_title"
              value={formData.meta_title}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="SEO title for this page"
            />
          </div>

          <div>
            <label htmlFor="meta_description" className={labelClass}>
              Meta Description
            </label>
            <textarea
              id="meta_description"
              name="meta_description"
              value={formData.meta_description}
              onChange={handleInputChange}
              className={`${inputClass} min-h-[96px]`}
              placeholder="Short SEO description (150–160 chars)"
            />
          </div>

          <div>
            <label htmlFor="meta_keywords" className={labelClass}>
              Meta Keywords
            </label>
            <input
              type="text"
              id="meta_keywords"
              name="meta_keywords"
              value={formData.meta_keywords}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="comma,separated,keywords"
            />
          </div>

          <div>
            <label className={labelClass}>Description </label>
            <RichEditor
              value={formData.description}
              onChange={(value) => handleQuillChange("description", value)}
              height="h-80"
            />
          </div>

          <div className="mt-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                More Details
              </h3>
              <p className="text-sm text-gray-500">
                Optional sections: details, activities, gallery, FAQ, booking
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showMoreDetails}
                onChange={(e) => setShowMoreDetails(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {showMoreDetails && (
            <>
              <div>
                <label className={labelClass}>Details</label>
                <RichEditor
                  value={formData.details}
                  onChange={(value) => handleQuillChange("details", value)}
                  height="h-80"
                />
              </div>

              <div>
                <label className={labelClass}>Activities</label>
                <RichEditor
                  value={formData.activities}
                  onChange={(value) => handleQuillChange("activities", value)}
                  height="h-80"
                />
              </div>

              <div className="mt-8">
                <label className={labelClass}>
                  Photo Gallery Images
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Upload multiple images for the photo gallery)
                  </span>
                </label>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setGalleryModalOpen(true)}
                    className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[var(--admin-primary-border)] hover:bg-[var(--admin-primary-soft)] transition-colors"
                  >
                    <div className="text-center">
                      <ImagePlus className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Select gallery images
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Choose from Media Library
                      </p>
                    </div>
                  </button>
                </div>

                {formData.galleryImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Uploaded Images ({formData.galleryImages.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {formData.galleryImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-[var(--admin-primary-border)] transition-colors"
                        >
                          <img
                            src={image.variants?.thumbnail || image.url}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* FAQ Section */}
              <div className="mt-8 mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Frequently Asked Questions
                  </h3>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus size={18} />
                    Add FAQ
                  </button>
                </div>

                {formData.faq.length > 0 ? (
                  <div className="space-y-3">
                    {formData.faq.map((faq, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500">
                            FAQ #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFaq(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Remove FAQ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Question
                            </label>
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) =>
                                handleFaqChange(
                                  index,
                                  "question",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder="Enter your question"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Answer
                            </label>
                            <RichEditor
                              value={faq.answer}
                              onChange={(value) =>
                                handleFaqChange(index, "answer", value)
                              }
                              height="h-28"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No FAQs added yet. Click "Add FAQ" to create one.
                  </p>
                )}
              </div>

              {/* Show Booking Form Toggle */}
              <div className="mt-8 mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Show Booking Form
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Display the booking form on this page
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="showBookingForm"
                      checked={formData.showBookingForm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          showBookingForm: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>
            </>
          )}

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
                ? "Update CMS Page"
                : "Save New CMS Page"}
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
          Existing CMS Pages ({pages.length})
        </h2>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by title, subtitle, or section..."
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
            No CMS pages found. Start creating one!
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No pages match your search.
          </div>
        ) : (
          <>
            {isSearchActive ? (
              <div className="divide-y divide-gray-200">
                {filteredPages.slice(0, visibleCount).map((page) => (
                  <div
                    key={page._id || page.id || page.section}
                    className="py-4 flex justify-between items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-base md:text-lg font-semibold truncate">
                        {page.content?.title || "N/A"}
                      </p>
                      {page.content?.subtitle && (
                        <p className="text-sm md:text-base text-gray-600 truncate">
                          {page.content.subtitle}
                        </p>
                      )}
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {page.section} | Status: Status:{" "}
                        {page.status ? "Published" : "Draft"}
                      </p>
                      {page.categoryId && (
                        <p className="text-xs text-[var(--admin-primary)] mt-1">
                          Category: {getCategoryName(page.categoryId)}
                        </p>
                      )}
                    </div>
                    <div className="space-x-4">
                      <button
                        onClick={() => handleEdit(page)}
                        className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-strong)] font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(page.section)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handlePagesDragEnd}
              >
                <SortableContext
                  items={filteredPages.map((page) =>
                    String(page._id || page.id || page.section)
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-gray-200">
                    {filteredPages.slice(0, visibleCount).map((page) => (
                      <SortablePageRow
                        key={page._id || page.id || page.section}
                        page={page}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            {filteredPages.length > visibleCount && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="px-5 py-2.5 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-strong)] text-white font-semibold rounded-lg transition"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <MediaPickerModal
        open={galleryModalOpen}
        onOpenChange={setGalleryModalOpen}
        onSelect={handleGallerySelect}
        title="Add Gallery Image"
      />
    </div>
  );
};

export default CmsAdminPage;
