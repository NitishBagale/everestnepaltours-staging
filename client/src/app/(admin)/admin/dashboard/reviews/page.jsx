
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import MediaPickerModal from "@/components/media/MediaPickerModal";
import RichEditor from "@/components/editor/RichEditor";

const initialFormData = {
  guestName: "",
  country: "",
  travelDate: new Date().toISOString().split("T")[0],
  packageIds: [],
  image: "",
  title: "",
  reviewText: "",
  rating: "5",
};

const toDateInputValue = (value) => {
  if (!value) return new Date().toISOString().split("T")[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  return parsed.toISOString().split("T")[0];
};

const normalizeMedia = (media) => {
  if (!media) return "";
  if (typeof media === "string") {
    return { mediaId: null, url: media, variants: {}, title: "", altText: "" };
  }
  return media;
};

const mapReviewToForm = (review) => ({
  guestName: review?.guestName || "",
  country: review?.country || "",
  travelDate: toDateInputValue(review?.travelDate),
  packageIds: Array.isArray(review?.packageIds)
    ? review.packageIds.map((id) => String(id))
    : [],
  image: normalizeMedia(review?.image),
  title: review?.title || "",
  reviewText: review?.reviewText || "",
  rating: String(review?.rating || "5"),
});

const ReviewAdminPage = () => {
  const [reviews, setReviews] = useState([]);
  const [sortedReviews, setSortedReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editReviewId, setEditReviewId] = useState(null);
  const [packageOptions, setPackageOptions] = useState([]);
  const [packageLoading, setPackageLoading] = useState(true);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

 
  const getToken = () => {
    return Cookies.get("accessToken") || Cookies.get("token");
  };

  const fetchReviewsAndRating = useCallback(async () => {
    setListLoading(true);
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const reviewsResponse = await axios.get(
        `${BASE_URL}/review/?limit=1000`,
        {
          headers,
        }
      );
      const list = reviewsResponse.data.data || [];
      const sorted = [...list].sort((a, b) => {
        const aOrder = Number(a.sort_order) || 0;
        const bOrder = Number(b.sort_order) || 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });
      setReviews(list);
      setSortedReviews(sorted);

      const ratingResponse = await axios.get(
        `${BASE_URL}/review/average-rating`,
        {
          headers,
        }
      );

      const avgRating = parseFloat(ratingResponse.data.averageRating) || 0;
      setAverageRating(avgRating);
    } catch (error) {
      console.error("Fetch Reviews Error:", error);
      toast.error("Failed to load reviews or average rating.");
      setReviews([]);
      setSortedReviews([]);
      setAverageRating(0);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewsAndRating();
  }, [fetchReviewsAndRating]);

  const fetchPackages = useCallback(async () => {
    setPackageLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/package-tour/`);
      const list = res.data?.data || res.data || [];
      const byId = new Map();
      list.forEach((item, index) => {
        const pkg = item.package || item;
        const id = item.id || item._id || pkg?.id || pkg?._id;
        if (!id) return;
        const title = pkg?.title || pkg?.name || `Package ${index + 1}`;
        const key = String(id);
        if (!byId.has(key)) {
          byId.set(key, { id: key, title });
        }
      });
      setPackageOptions(Array.from(byId.values()));
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      setPackageOptions([]);
    } finally {
      setPackageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);


  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReviewTextChange = (content) => {
    setFormData((prev) => ({ ...prev, reviewText: content }));
  };

  const handlePackageChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, packageIds: selected }));
  };

  const handleImageSelect = (media) => {
    setFormData((prev) => ({ ...prev, image: media }));
  };

  const handleAddReview = () => {
    setEditReviewId(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
    const scrollContainer = document.getElementById("admin-scroll-area");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleEditReview = (review) => {
    setEditReviewId(review?.id || review?._id || null);
    setFormData(mapReviewToForm(review));
    setIsFormOpen(true);
    const scrollContainer = document.getElementById("admin-scroll-area");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditReviewId(null);
    setFormData(initialFormData);
    setIsFormOpen(false);
  };

  const getPackageTitleById = (id) => {
    const match = packageOptions.find((pkg) => String(pkg.id) === String(id));
    return match?.title || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const normalizedPackageIds = formData.packageIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));
      const packageTitles = normalizedPackageIds
        .map((id) => getPackageTitleById(id))
        .filter(Boolean)
        .join(", ");
      const payload = {
        ...formData,
        packageIds: normalizedPackageIds,
        tourTitle: packageTitles || "",
        rating: parseFloat(formData.rating) || 5,
      };

      if (editReviewId) {
        await axios.put(`${BASE_URL}/review/${editReviewId}`, payload, {
          headers,
        });
        toast.success("Review updated successfully!");
      } else {
        await axios.post(`${BASE_URL}/review/`, payload, {
          headers,
        });
        toast.success("Review added successfully!");
      }
      handleCancelEdit();
      fetchReviewsAndRating();
    } catch (error) {
      console.error("Save Review Error:", error);
      toast.error(
        error.response?.data?.message || "Failed to save review."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId, guestName) => {
    const title = guestName || "This Review";

 
    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col p-2 bg-white rounded-lg shadow-lg">
            <p className="text-sm font-semibold mb-3">
              Are you sure you want to delete{" "}
              <span className="text-red-600 font-bold">"{title}"</span>'s
              review?
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

 
    const deleteToastId = toast.loading(`Deleting review by ${title}...`);
    try {
      const token = getToken();

      
      await axios.delete(`${BASE_URL}/review/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Review by ${title} deleted successfully!`, {
        id: deleteToastId,
      });
    
      fetchReviewsAndRating();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error(
        error.response?.data?.message || `Failed to delete review by ${title}`,
        {
          id: deleteToastId,
        }
      );
    }
  };

  const handleReviewsDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    let nextOrder = [];
    setSortedReviews((items) => {
      const oldIndex = items.findIndex(
        (review) => String(review.id || review._id) === String(active.id)
      );
      const newIndex = items.findIndex(
        (review) => String(review.id || review._id) === String(over.id)
      );
      if (oldIndex === -1 || newIndex === -1) return items;
      nextOrder = arrayMove(items, oldIndex, newIndex);
      return nextOrder;
    });

    if (!nextOrder.length) return;
    try {
      const token = getToken();
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }
      await axios.post(
        `${BASE_URL}/review/reorder`,
        {
          orderUpdates: nextOrder.map((review, index) => ({
            id: review.id || review._id,
            sort_order: index + 1,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error("Failed to save review order:", error);
      toast.error("Failed to save review order");
    }
  };

  const SortableReviewRow = ({ review }) => {
    const id = String(review.id || review._id);
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    const packageLabels = (review.packageIds || [])
      .map((id) => getPackageTitleById(id))
      .filter(Boolean);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="py-4 md:py-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 cursor-grab"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
          <div className="min-w-0">
            <p className="text-sm md:text-base font-semibold truncate">
              {review.title || "Untitled Review"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Rating: {review.rating || "N/A"} / 5
            </p>
            {packageLabels.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {packageLabels.map((label) => (
                  <span
                    key={label}
                    className="text-xs bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)] px-2 py-0.5 rounded border border-[var(--admin-primary-border)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">No packages selected</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 sm:gap-4 shrink-0">
          <button
            onClick={() => handleEditReview(review)}
            className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-strong)] font-medium text-sm px-3 py-1.5 border border-[var(--admin-primary-border)] rounded hover:bg-[var(--admin-primary-soft)] transition"
          >
            Edit
          </button>
          <button
            onClick={() =>
              handleDeleteReview(review.id || review._id, review.guestName)
            }
            className="text-red-600 hover:text-red-900 font-medium text-sm px-3 py-1.5 border border-red-600 rounded hover:bg-red-50 transition"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-center" />

      <div className="w-full">
        <div className="w-full max-w-7xl">
          <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Customer Reviews
              </h1>
              <button
                type="button"
                onClick={handleAddReview}
                className="inline-flex items-center justify-center rounded-md bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--admin-primary-strong)]"
              >
                Add Review
              </button>
            </div>
            <div className="mb-6" />

            {isFormOpen && (
              <form
                onSubmit={handleSubmit}
                className="mb-6 rounded-lg border border-gray-200 p-4 md:p-6 bg-white"
              >
                <h2 className="text-lg md:text-xl font-bold mb-4 border-b pb-2">
                  {editReviewId ? "Edit Review" : "Add Review"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleFormChange}
                      className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                      placeholder="Guest name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleFormChange}
                      className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                      placeholder="Country"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Travel Date
                    </label>
                    <input
                      type="date"
                      name="travelDate"
                      value={formData.travelDate}
                      onChange={handleFormChange}
                      className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">
                      Review Package
                    </label>
                    <select
                      multiple
                      name="packageIds"
                      value={formData.packageIds}
                      onChange={handlePackageChange}
                      className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm min-h-[120px]"
                      disabled={packageLoading}
                    >
                      {packageLoading ? (
                        <option>Loading packages...</option>
                      ) : packageOptions.length === 0 ? (
                        <option>No packages found</option>
                      ) : (
                        packageOptions.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.title}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Hold Ctrl/Cmd to select multiple packages.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">
                      Review Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                      placeholder="Review title"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">
                      Review Text
                    </label>
                    <RichEditor
                      value={formData.reviewText}
                      onChange={handleReviewTextChange}
                      height="h-64"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">
                      Review Image
                    </label>
                    {formData.image ? (
                      <div className="mb-3 relative inline-block">
                        <img
                          src={
                            formData.image.variants?.medium ||
                            formData.image.url ||
                            formData.image
                          }
                          alt="Review"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, image: "" }))
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
                        className="w-full h-32 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm text-gray-500"
                      >
                        Select from Media Library
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaModalOpen(true)}
                      className="mt-3 text-xs font-semibold text-[var(--admin-primary)] hover:underline"
                    >
                      Choose / Change Image
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Rating
                    </label>
                    <input
                      type="number"
                      name="rating"
                      value={formData.rating}
                      onChange={handleFormChange}
                      className="w-full border p-2 md:p-3 rounded focus:outline-[var(--admin-primary)] text-sm"
                      min="1"
                      max="5"
                      step="0.1"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[var(--admin-primary)] text-white font-bold py-2.5 md:py-3 rounded hover:bg-[var(--admin-primary-strong)] transition disabled:opacity-50 text-sm md:text-base"
                  >
                    {saving
                      ? "Saving..."
                      : editReviewId
                      ? "Update Review"
                      : "Add Review"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="sm:w-40 bg-gray-300 text-gray-800 font-bold py-2.5 md:py-3 rounded hover:bg-gray-400 transition text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {listLoading ? (
              <div className="p-4 text-center">Loading reviews...</div>
            ) : sortedReviews.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No customer reviews found.
              </div>
            ) : (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleReviewsDragEnd}
              >
                <SortableContext
                  items={sortedReviews.map((review) =>
                    String(review.id || review._id)
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-gray-200">
                    {sortedReviews.map((review) => (
                      <SortableReviewRow
                        key={review.id || review._id}
                        review={review}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
      <MediaPickerModal
        open={mediaModalOpen}
        onOpenChange={setMediaModalOpen}
        onSelect={handleImageSelect}
        title="Select Review Image"
      />
    </>
  );
};

export default ReviewAdminPage;
