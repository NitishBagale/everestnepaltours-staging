"use client";
import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
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
import {
  Upload,
  X,
  Image as ImageIcon,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import MediaPickerModal from "@/components/media/MediaPickerModal";
import RichEditor from "@/components/editor/RichEditor";

const HeroImageCard = ({ image, onDelete, onChange }) => (
  <div className="w-full">
    <div className="group relative w-full h-64 overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200">
      <img
        src={image.url}
        alt={image.title || image.alt || "Hero image"}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <button
        onClick={() => onDelete(image.id || image.mediaId || image.url)}
        className="absolute top-3 right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-300"
      >
        <Trash2 size={18} />
      </button>
    </div>
    <div className="mt-3 space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-600">
          Banner Title
        </label>
        <input
          type="text"
          value={image.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g., Lhasa, Tibet"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600">
          Banner Caption
        </label>
        <input
          type="text"
          value={image.caption || ""}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Short supporting line"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  </div>
);

const NewImagePreview = ({ media, onRemove, onChange }) => (
  <div className="w-full">
    <div className="relative w-full h-64 overflow-hidden rounded-xl shadow-lg border-2 border-indigo-400">
      <img
        src={media.variants?.medium || media.url}
        alt={media.title || "New image"}
        className="w-full h-full object-cover"
      />
      <span className="absolute top-3 left-3 bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-full font-semibold">
        New
      </span>
      <button
        onClick={() => onRemove(media.mediaId || media.id)}
        className="absolute top-3 right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
      >
        <X size={18} />
      </button>
    </div>
    <div className="mt-3 space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-600">
          Banner Title
        </label>
        <input
          type="text"
          value={media.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g., Lhasa, Tibet"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600">
          Banner Caption
        </label>
        <input
          type="text"
          value={media.caption || ""}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Short supporting line"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  </div>
);

const SortableSelectedItem = ({ id, title, onRemove }) => {
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
      className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700 bg-white shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span
          className="cursor-grab text-gray-400"
          {...attributes}
          {...listeners}
          aria-label="Drag handle"
        >
          ⋮⋮
        </span>
        <span className="line-clamp-1">{title}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs font-semibold text-red-500 hover:text-red-600"
      >
        Remove
      </button>
    </div>
  );
};

const AdminHomePage = () => {
  const [savedImages, setSavedImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingId, setSettingId] = useState(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [welcomeSubtitle, setWelcomeSubtitle] = useState("");
  const [welcomeTitle, setWelcomeTitle] = useState("");
  const [welcomeDescription, setWelcomeDescription] = useState("");
  const [whyTitle, setWhyTitle] = useState("");
  const [whyDescription, setWhyDescription] = useState("");
  const [whyItems, setWhyItems] = useState([]);
  const [featuredTitle, setFeaturedTitle] = useState("");
  const [featuredDescription, setFeaturedDescription] = useState("");
  const [featuredPackageIds, setFeaturedPackageIds] = useState([]);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewIds, setReviewIds] = useState([]);
  const [reviewOptions, setReviewOptions] = useState([]);
  const [reviewSelectId, setReviewSelectId] = useState("");
  const [packageOptions, setPackageOptions] = useState([]);
  const [featuredSelectId, setFeaturedSelectId] = useState("");
  const [initialImages, setInitialImages] = useState("[]");
  const [initialWelcome, setInitialWelcome] = useState("{}");
  const [initialWhy, setInitialWhy] = useState("{}");
  const [initialFeatured, setInitialFeatured] = useState("{}");
  const [initialReviews, setInitialReviews] = useState("{}");
  const getImageKey = (img) => img.id || img.mediaId || img.url;

  const iconOptions = [
    { value: "Medal", label: "Medal" },
    { value: "HandCoins", label: "Holding Dollar" },
    { value: "UserCheck", label: "User Professional" },
    { value: "Users", label: "Users" },
    { value: "Map", label: "Holiday Asia" },
    { value: "CalendarDays", label: "Date Calendar" },
  ];

  const getPackageKey = (pkg, index) => {
    const raw =
      pkg.id ??
      pkg._id ??
      pkg.packageId ??
      pkg.package_id ??
      pkg.slug ??
      pkg.title;
    if (raw == null || raw === "") return `local-${index}`;
    return String(raw);
  };

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/settings/get`);
        console.log(response.data);
        const settings = response.data?.data || [];
        const heroSetting = settings.find((s) => s.name === "hero");

        if (heroSetting) {
          setSettingId(heroSetting.id);
          const loadedImages = heroSetting.settings?.images || [];
          const loadedWelcome = heroSetting.settings?.welcome || {};
          const loadedWhy = heroSetting.settings?.whyWithUs || {};
          const loadedFeatured = heroSetting.settings?.featuredPackages || {};
          const loadedReviews = heroSetting.settings?.reviews || {};
          setSavedImages(loadedImages);
          setWelcomeSubtitle(loadedWelcome.subtitle || "");
          setWelcomeTitle(loadedWelcome.title || "");
          setWelcomeDescription(loadedWelcome.description || "");
          setWhyTitle(loadedWhy.title || "");
          setWhyDescription(loadedWhy.description || "");
          setWhyItems(Array.isArray(loadedWhy.items) ? loadedWhy.items : []);
          setFeaturedTitle(loadedFeatured.title || "");
          setFeaturedDescription(loadedFeatured.description || "");
          setFeaturedPackageIds(
            Array.isArray(loadedFeatured.packageIds)
              ? loadedFeatured.packageIds
              : []
          );
          setReviewTitle(loadedReviews.title || "");
          setReviewIds(
            Array.isArray(loadedReviews.reviewIds)
              ? loadedReviews.reviewIds.map((id) => String(id))
              : []
          );
          setInitialImages(JSON.stringify(loadedImages));
          setInitialWelcome(JSON.stringify(loadedWelcome));
          setInitialWhy(JSON.stringify(loadedWhy));
          setInitialFeatured(JSON.stringify(loadedFeatured));
          setInitialReviews(
            JSON.stringify({
              title: loadedReviews.title || "",
              reviewIds: Array.isArray(loadedReviews.reviewIds)
                ? loadedReviews.reviewIds.map((id) => String(id))
                : [],
            })
          );
        }
      } catch (error) {
        console.error("Failed to fetch hero images:", error);
        toast.error("Failed to load hero images");
      } finally {
        setLoading(false);
      }
    };

    fetchHeroImages();
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/package-tour/`);
        const list = res.data?.data || res.data || [];
        const normalized = list.map((pkg) => pkg.package || pkg);
        const byKey = new Map();
        normalized.forEach((pkg, idx) => {
          const key = getPackageKey(pkg, idx);
          if (!byKey.has(key)) {
            byKey.set(key, { ...pkg, __key: key });
          }
        });
        setPackageOptions(Array.from(byKey.values()));
      } catch (error) {
        console.error("Failed to fetch packages:", error);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = Cookies.get("accessToken") || Cookies.get("token");
        const res = await axios.get(`${BASE_URL}/review/?limit=200`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const list = res.data?.data || [];
        const normalized = list.map((review) => ({
          id: String(review.id || review._id),
          title: review.title || "Untitled Review",
          guestName: review.guestName || "Guest",
        }));
        setReviewOptions(normalized);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        setReviewOptions([]);
      }
    };
    fetchReviews();
  }, []);

  const handleMediaSelect = (media) => {
    setNewFiles((prev) => {
      const existingIds = new Set(prev.map((img) => img.id || img.mediaId));
      const normalized = {
        ...media,
        id: media.mediaId || media.url,
        title: media.title || "",
        caption: media.caption || "",
      };
      if (existingIds.has(normalized.id)) return prev;
      return [...prev, normalized];
    });
  };

  const handleRemoveNewFile = (id) => {
    setNewFiles(newFiles.filter((file) => (file.id || file.mediaId) !== id));
  };

  const handleUpdateSavedImage = (id, updates) => {
    setSavedImages((prev) =>
      prev.map((img) => (getImageKey(img) === id ? { ...img, ...updates } : img))
    );
  };

  const handleUpdateNewFile = (id, updates) => {
    setNewFiles((prev) =>
      prev.map((img) => (getImageKey(img) === id ? { ...img, ...updates } : img))
    );
  };

  const handleWhyItemChange = (index, updates) => {
    setWhyItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const handleAddWhyItem = () => {
    setWhyItems((prev) => [...prev, { title: "", icon: "Medal" }]);
  };

  const handleRemoveWhyItem = (index) => {
    setWhyItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleFeaturedPackage = (id) => {
    const normalizedId = String(id);
    setFeaturedPackageIds((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((pid) => pid !== normalizedId)
        : [...prev, normalizedId]
    );
  };

  const handleAddFeaturedPackage = () => {
    if (!featuredSelectId) return;
    const normalizedId = String(featuredSelectId);
    if (normalizedId === "undefined") return;
    setFeaturedPackageIds((prev) =>
      prev.includes(normalizedId) ? prev : [...prev, normalizedId]
    );
    setFeaturedSelectId("");
  };

  const handleRemoveFeaturedPackage = (id) => {
    const normalizedId = String(id);
    setFeaturedPackageIds((prev) => prev.filter((pid) => pid !== normalizedId));
  };

  const handleAddReview = () => {
    if (!reviewSelectId) return;
    const normalizedId = String(reviewSelectId);
    if (normalizedId === "undefined") return;
    setReviewIds((prev) =>
      prev.includes(normalizedId) ? prev : [...prev, normalizedId]
    );
    setReviewSelectId("");
  };

  const handleRemoveReview = (id) => {
    const normalizedId = String(id);
    setReviewIds((prev) => prev.filter((rid) => rid !== normalizedId));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFeaturedPackageIds((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleReviewDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setReviewIds((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const buildSettings = (images) => ({
    images,
    welcome: {
      subtitle: welcomeSubtitle,
      title: welcomeTitle,
      description: welcomeDescription,
    },
    whyWithUs: {
      title: whyTitle,
      description: whyDescription,
      items: whyItems.filter((item) => item.title?.trim()),
    },
    featuredPackages: {
      title: featuredTitle,
      description: featuredDescription,
      packageIds: featuredPackageIds,
    },
    reviews: {
      title: reviewTitle,
      reviewIds,
    },
  });

  const handleUpload = async () => {
    if (newFiles.length === 0) {
      const imagesChanged = JSON.stringify(savedImages) !== initialImages;
      const welcomeChanged =
        JSON.stringify({
          subtitle: welcomeSubtitle,
          title: welcomeTitle,
          description: welcomeDescription,
        }) !== initialWelcome;
      const whyChanged =
        JSON.stringify({
          title: whyTitle,
          description: whyDescription,
          items: whyItems.filter((item) => item.title?.trim()),
        }) !== initialWhy;
      const featuredChanged =
        JSON.stringify({
          title: featuredTitle,
          description: featuredDescription,
          packageIds: featuredPackageIds,
        }) !== initialFeatured;
      const reviewsChanged =
        JSON.stringify({
          title: reviewTitle,
          reviewIds,
        }) !== initialReviews;
      if (
        !imagesChanged &&
        !welcomeChanged &&
        !whyChanged &&
        !featuredChanged &&
        !reviewsChanged
      ) {
        toast.info("No changes to save");
        return;
      }
    }

    try {
      const token = Cookies.get("accessToken") || Cookies.get("token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      toast.loading("Saving images...");

      const merged = [...savedImages, ...newFiles];
      const seen = new Set();
      const allImages = merged.filter((img) => {
        const key = img.id || img.mediaId || img.url;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Save to database
      if (settingId) {
        await axios.patch(
          `${BASE_URL}/settings/update?id=${settingId}`,
          { name: "hero", settings: buildSettings(allImages) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const response = await axios.post(
          `${BASE_URL}/settings/create`,
          { name: "hero", settings: buildSettings(allImages) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSettingId(response.data?.data?.id);
      }

      setSavedImages(allImages);
      setNewFiles([]);
      setInitialImages(JSON.stringify(allImages));
      setInitialWelcome(
        JSON.stringify({
          subtitle: welcomeSubtitle,
          title: welcomeTitle,
          description: welcomeDescription,
        })
      );
      setInitialWhy(
        JSON.stringify({
          title: whyTitle,
          description: whyDescription,
          items: whyItems.filter((item) => item.title?.trim()),
        })
      );
      setInitialFeatured(
        JSON.stringify({
          title: featuredTitle,
          description: featuredDescription,
          packageIds: featuredPackageIds,
        })
      );
      setInitialReviews(
        JSON.stringify({
          title: reviewTitle,
          reviewIds,
        })
      );

      toast.dismiss();
      toast.success(`Successfully saved ${newFiles.length} image(s)!`);
    } catch (error) {
      console.error("Upload Error:", error);
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to upload images");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      const updatedImages = savedImages.filter(
        (img) => (img.id || img.mediaId || img.url) !== id
      );

      // Update database
      const token = Cookies.get("accessToken") || Cookies.get("token");
      if (token && settingId) {
        await axios.patch(
          `${BASE_URL}/settings/update?id=${settingId}`,
          { name: "hero", settings: buildSettings(updatedImages) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setSavedImages(updatedImages);
      toast.success("Image deleted successfully!");
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Failed to delete image");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const imagesChanged = JSON.stringify(savedImages) !== initialImages;
  const welcomeChanged =
    JSON.stringify({
      subtitle: welcomeSubtitle,
      title: welcomeTitle,
      description: welcomeDescription,
    }) !== initialWelcome;
  const whyChanged =
    JSON.stringify({
      title: whyTitle,
      description: whyDescription,
      items: whyItems.filter((item) => item.title?.trim()),
    }) !== initialWhy;
  const featuredChanged =
    JSON.stringify({
      title: featuredTitle,
      description: featuredDescription,
      packageIds: featuredPackageIds,
    }) !== initialFeatured;
  const reviewsChanged =
    JSON.stringify({
      title: reviewTitle,
      reviewIds,
    }) !== initialReviews;
  const hasChanges =
    newFiles.length > 0 ||
    imagesChanged ||
    welcomeChanged ||
    whyChanged ||
    featuredChanged ||
    reviewsChanged;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <Toaster />
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Hero Images</h1>
          <p className="text-gray-600">
            Upload and manage your home page hero images
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <div className="flex justify-end mb-6">
            <button
              onClick={handleUpload}
              disabled={!hasChanges}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                !hasChanges
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl"
              }`}
            >
              <Upload size={20} />
              Save {newFiles.length > 0 && `(${newFiles.length})`}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {savedImages.map((img, index) => (
              <HeroImageCard
                key={(img.id || img.mediaId || img.url) ?? index}
                image={img}
                onDelete={handleDelete}
                onChange={(updates) =>
                  handleUpdateSavedImage(getImageKey(img), updates)
                }
              />
            ))}
            {newFiles.map((media, index) => (
              <NewImagePreview
                key={`${media.mediaId || media.url}-${index}`}
                media={media}
                onRemove={handleRemoveNewFile}
                onChange={(updates) =>
                  handleUpdateNewFile(getImageKey(media), updates)
                }
              />
            ))}
          </div>

          <div className="relative p-16 mb-10 rounded-2xl border-4 border-dashed transition-all text-center border-gray-300 bg-gray-50">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="text-indigo-600" size={36} />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Add Hero Images
              </h4>
              <p className="text-gray-600 mb-2">
                Choose from Media Library
              </p>
              <p className="text-sm text-gray-500">Supports: JPG, PNG, JPEG</p>
              <button
                type="button"
                onClick={() => setMediaModalOpen(true)}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Select Images
              </button>
            </div>
          </div>

          <div className="mb-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Welcome Section
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={welcomeSubtitle}
                  onChange={(e) => setWelcomeSubtitle(e.target.value)}
                  placeholder="e.g., Welcome to wonderful lands"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Title
                </label>
                <input
                  type="text"
                  value={welcomeTitle}
                  onChange={(e) => setWelcomeTitle(e.target.value)}
                  placeholder="e.g., Nepal, Bhutan & Tibet"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Description
                </label>
                <div className="mt-2">
                  <RichEditor
                    value={welcomeDescription}
                    onChange={setWelcomeDescription}
                    placeholder="Add the welcome description..."
                    height="h-52"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Why With Us Section
              </h3>
              <button
                type="button"
                onClick={handleAddWhyItem}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--admin-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--admin-primary-strong)] transition"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Title
                </label>
                <input
                  type="text"
                  value={whyTitle}
                  onChange={(e) => setWhyTitle(e.target.value)}
                  placeholder="e.g., What makes us your preferred choice?"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Short Description
                </label>
                <textarea
                  value={whyDescription}
                  onChange={(e) => setWhyDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional supporting line"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {whyItems.map((item, index) => (
                  <div
                    key={`${item.icon}-${index}`}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500">
                        Item {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWhyItem(index)}
                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <label className="text-xs font-semibold text-gray-600">
                      Title
                    </label>
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(e) =>
                        handleWhyItemChange(index, { title: e.target.value })
                      }
                      placeholder="e.g., High-Standard Services"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
                    />
                    <label className="mt-3 block text-xs font-semibold text-gray-600">
                      Icon
                    </label>
                    <select
                      value={item.icon || "Medal"}
                      onChange={(e) =>
                        handleWhyItemChange(index, { icon: e.target.value })
                      }
                      className="mt-1 w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)] focus:border-[var(--admin-primary-border)]"
                    >
                      {iconOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Featured Packages Section
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Title
                </label>
                <input
                  type="text"
                  value={featuredTitle}
                  onChange={(e) => setFeaturedTitle(e.target.value)}
                  placeholder="e.g., Popular Tours for 2026"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Description
                </label>
                <div className="mt-2">
                  <RichEditor
                    value={featuredDescription}
                    onChange={setFeaturedDescription}
                    placeholder="Short intro paragraph"
                    height="h-44"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Select Packages
                </label>
                <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <label className="text-xs font-semibold text-gray-500">
                      Available Packages
                    </label>
                    <div className="mt-2 flex gap-2">
                      <select
                        value={featuredSelectId}
                        onChange={(e) => setFeaturedSelectId(e.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)] focus:border-[var(--admin-primary-border)]"
                      >
                        <option value="">Select a package</option>
                        {packageOptions.map((pkg, idx) => {
                          const id = pkg.__key || getPackageKey(pkg, idx);
                          const label = pkg.title || "Untitled Package";
                          const optionKey = id || `${label}-${idx}`;
                          return (
                            <option key={optionKey} value={id}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddFeaturedPackage}
                        className="h-12 px-4 rounded-xl bg-[var(--admin-primary)] text-white text-sm font-semibold hover:bg-[var(--admin-primary-strong)] transition"
                      >
                        Add
                      </button>
                    </div>
                    {packageOptions.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">
                        No packages found.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <label className="text-xs font-semibold text-gray-500">
                      Selected Featured Packages
                    </label>
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={featuredPackageIds}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                          {featuredPackageIds.map((id, idx) => {
                            const pkg = packageOptions.find(
                              (item) => String(item.__key) === String(id)
                            );
                            return (
                              <SortableSelectedItem
                                key={`${id}-${idx}`}
                                id={id}
                                title={pkg?.title || "Selected Package"}
                                onRemove={() => handleRemoveFeaturedPackage(id)}
                              />
                            );
                          })}
                          {featuredPackageIds.length === 0 && (
                            <p className="text-sm text-gray-500">
                              No featured packages selected.
                            </p>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Review Section
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Section Title
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g., Recent Reviews"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Select Reviews
                </label>
                <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <label className="text-xs font-semibold text-gray-500">
                      Available Reviews
                    </label>
                    <div className="mt-2 flex gap-2">
                      <select
                        value={reviewSelectId}
                        onChange={(e) => setReviewSelectId(e.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)] focus:border-[var(--admin-primary-border)]"
                      >
                        <option value="">Select a review</option>
                        {reviewOptions.map((review) => (
                          <option key={review.id} value={review.id}>
                            {review.title} — {review.guestName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddReview}
                        className="h-12 px-4 rounded-xl bg-[var(--admin-primary)] text-white text-sm font-semibold hover:bg-[var(--admin-primary-strong)] transition"
                      >
                        Add
                      </button>
                    </div>
                    {reviewOptions.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">
                        No reviews found.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <label className="text-xs font-semibold text-gray-500">
                      Selected Reviews
                    </label>
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={handleReviewDragEnd}
                    >
                      <SortableContext
                        items={reviewIds}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                          {reviewIds.map((id) => {
                            const review = reviewOptions.find(
                              (item) => String(item.id) === String(id)
                            );
                            return (
                              <SortableSelectedItem
                                key={id}
                                id={id}
                                title={
                                  review
                                    ? `${review.title} — ${review.guestName}`
                                    : "Selected Review"
                                }
                                onRemove={() => handleRemoveReview(id)}
                              />
                            );
                          })}
                          {reviewIds.length === 0 && (
                            <p className="text-sm text-gray-500">
                              No reviews selected.
                            </p>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
        <MediaPickerModal
          open={mediaModalOpen}
          onOpenChange={setMediaModalOpen}
          onSelect={handleMediaSelect}
          title="Select Hero Image"
        />
      </div>
    </div>
  );
};

export default AdminHomePage;
