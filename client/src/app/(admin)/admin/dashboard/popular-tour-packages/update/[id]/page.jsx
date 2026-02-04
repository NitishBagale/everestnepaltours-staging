"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  Save,
  MapPin,
  Calendar,
  Star,
  Layout,
  ImageIcon,
  Loader2,
  DollarSign,
  GripVertical,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import MediaPickerModal from "@/components/media/MediaPickerModal";
import RichEditor from "@/components/editor/RichEditor";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const createItineraryDay = (index) => ({
  id: crypto.randomUUID(),
  order: index + 1,
  day: "",
  title: "",
  richText: "",
  accommodation: "",
  meal: "",
  elevation: "",
  activities: [""],
  image: null,
});

const SortableItineraryCard = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {children({ attributes, listeners })}
    </div>
  );
};

const SortableFaqCard = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {children({ attributes, listeners })}
    </div>
  );
};

const normalizeMedia = (media) => {
  if (!media) return null;
  if (typeof media === "string") {
    return { mediaId: null, url: media, variants: {}, title: "", altText: "" };
  }
  return media;
};

const EditPackage = () => {
  const router = useRouter();
  const params = useParams();
  const packageId = params?.id;
  const [slugTouched, setSlugTouched] = useState(false);

  const [mainImageModalOpen, setMainImageModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [itineraryImageModalOpen, setItineraryImageModalOpen] = useState(false);
  const [overviewImageModalOpen, setOverviewImageModalOpen] = useState(false);
  const [activeItineraryIndex, setActiveItineraryIndex] = useState(null);
  const [itineraryOpen, setItineraryOpen] = useState(false);
  const [includedExcludedOpen, setIncludedExcludedOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    sub_description: "",
    descriptions: "",
    overviewImage: null,
    trip_highlights_title: "",
    trip_highlights: "",
    itinerary_title: "",
    duration: "",
    trip_type_level: "",
    trip_attractions: "",
    trip_max_elevation: "",
    trip_best_season: "",
    trip_meals: "",
    trip_accommodation: "",
    trip_transportations: "",
    tour_type: "Challenging",
    rating: "Excellent",
    category: "",
    cost: "",
    mainImage: null,
    itinerary: [createItineraryDay(0)],
    imageGallary: [],
    tags: [],
    faq: [],
    faq_section_title: "",
    showBookingForm: false,
    customSections: [],
    meta_title: "",
    meta_description: "",
  });

  useEffect(() => {
    console.log("FormData updated:", formData);
  }, [formData]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/category/`);
        setCategories(response.data.data || []);
      } catch (error) {
        console.error("Fetch Categories Error:", error);
        toast.error("Failed to load categories.");
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log("Update page - packageId:", packageId);
    if (packageId) {
      fetchPackageData();
    } else {
      console.log("No packageId found in params");
      setIsLoading(false);
    }
  }, [packageId]);

  const resolveCategoryId = (value) => {
    if (!value) return "";
    if (typeof value === "number") return String(value);
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return (
        value.id ||
        value._id ||
        value.categoryId ||
        value.category_id ||
        ""
      );
    }
    return "";
  };

  const fetchPackageData = async () => {
    try {
      setIsLoading(true);
      const accessToken = Cookies.get("accessToken") || Cookies.get("token");
      console.log("Fetching package data for ID:", packageId);
      console.log("Access token:", accessToken ? "Present" : "Missing");

      const response = await axios.get(
        `${BASE_URL}/package-tour/${packageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("API Response:", response.data);

      // The database stores all package data inside a 'package' JSONB field
      const packageRecord = response.data?.data;
      const packageData = packageRecord?.package || packageRecord;

      console.log("Package record:", packageRecord);
      console.log("Package data extracted:", packageData);
      console.log("Package data type:", typeof packageData);
      console.log("Package title:", packageData?.title);
      console.log("Package descriptions:", packageData?.descriptions);

      if (!packageData || typeof packageData !== "object") {
        console.error("Invalid package data structure");
        toast.error("Invalid package data received");
        setIsLoading(false);
        return;
      }

      setFormData({
        title: packageData.title || "",
        slug: packageData.slug || "",
        sub_description: packageData.sub_description || "",
        descriptions: packageData.descriptions || "",
        overviewImage: normalizeMedia(packageData.overviewImage),
        trip_highlights_title: packageData.trip_highlights_title || "",
        trip_highlights: packageData.trip_highlights || "",
        itinerary_title: packageData.itinerary_title || "",
        duration: packageData.duration || "",
        trip_type_level: packageData.trip_type_level || "",
        trip_attractions: packageData.trip_attractions || "",
        trip_max_elevation: packageData.trip_max_elevation || "",
        trip_best_season: packageData.trip_best_season || "",
        trip_meals: packageData.trip_meals || "",
        trip_accommodation: packageData.trip_accommodation || "",
        trip_transportations: packageData.trip_transportations || "",
        tour_type: packageData.tour_type || "Challenging",
        rating: packageData.rating || "Excellent",
        category: resolveCategoryId(
          packageData.categoryId ?? packageData.category ?? ""
        ),
        cost: packageData.cost || "",
        mainImage: normalizeMedia(packageData.mainImage),
        itinerary: (packageData.itinerary || [createItineraryDay(0)]).map(
          (item, index) => ({
            id: item.id || crypto.randomUUID(),
            order: item.order || index + 1,
            day:
              item.day ||
              item.dayNumber ||
              item.day_no ||
              item.dayNo ||
              "",
            title: item.title || "",
            richText: item.richText || item.description || "",
            accommodation: item.accommodation || "",
            meal: item.meal || "",
            elevation: item.elevation || "",
            activities: item.activities?.length ? item.activities : [""],
            image: normalizeMedia(item.image),
          })
        ),
        imageGallary: (packageData.imageGallary || [])
          .map((img) => normalizeMedia(img))
          .filter(Boolean),
        tags: packageData.tags || [],
        faq: (packageData.faq || []).map((item) => ({
          id: item.id || crypto.randomUUID(),
          question: item.question || "",
          answer: item.answer || "",
        })),
        faq_section_title: packageData.faq_section_title || "",
        showBookingForm: packageData.showBookingForm || false,
        customSections: (packageData.customSections || []).map((section) => {
          const content = Array.isArray(section.content)
            ? section.content
            : section.content
              ? [section.content]
              : [];
          const listFallback =
            !section.note && content.length
              ? `<ul>${content
                  .filter(Boolean)
                  .map((item) => `<li>${item}</li>`)
                  .join("")}</ul>`
              : "";
          const description =
            section.description ||
            (section.type === "list" ? section.note || listFallback : "");
          return {
            id: section.id || crypto.randomUUID(),
            type: section.type || "paragraph",
            title: section.title || "",
            note: section.note || "",
            description,
            content:
              section.type === "paragraph"
                ? content.length
                  ? content
                  : [""]
                : [],
          };
        }),
        meta_title: packageData.meta_title || "",
        meta_description: packageData.meta_description || "",
      });

      console.log("Form data set successfully");
      console.log("Final formData:", formData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching package:", error);
      console.error("Error details:", error.response?.data);
      toast.error("Failed to load package data");
      setIsLoading(false);
    }
  };

  const handleMainImageSelect = (media) => {
    setFormData((prev) => ({
      ...prev,
      mainImage: {
        ...(media || {}),
        altText: media?.altText || "",
      },
    }));
  };

  const handleOverviewImageSelect = (media) => {
    setFormData((prev) => ({
      ...prev,
      overviewImage: media,
    }));
  };

  const removeMainImage = () => {
    setFormData({ ...formData, mainImage: null });
  };

  const removeOverviewImage = () => {
    setFormData({ ...formData, overviewImage: null });
  };

  const handleGallerySelect = (media) => {
    setFormData((prev) => {
      const existingIds = new Set(prev.imageGallary.map((img) => img.mediaId));
      if (existingIds.has(media.mediaId)) return prev;
      return { ...prev, imageGallary: [...prev.imageGallary, media] };
    });
  };

  const removeGalleryImage = (index) => {
    setFormData({
      ...formData,
      imageGallary: formData.imageGallary.filter((_, i) => i !== index),
    });
  };

  const handleItineraryImageSelect = (media) => {
    if (activeItineraryIndex === null) return;
    setFormData((prev) => {
      const updated = [...prev.itinerary];
      updated[activeItineraryIndex] = {
        ...updated[activeItineraryIndex],
        image: media,
      };
      return { ...prev, itinerary: updated };
    });
    setItineraryImageModalOpen(false);
  };

  const handleItineraryDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFormData((prev) => {
      const oldIndex = prev.itinerary.findIndex((item) => item.id === active.id);
      const newIndex = prev.itinerary.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(prev.itinerary, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          order: index + 1,
        })
      );
      return { ...prev, itinerary: reordered };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const slugify = (text) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "title" && !slugTouched
        ? { slug: slugify(value) }
        : null),
    }));
  };

  const handleDescriptionChange = (value) => {
    setFormData({ ...formData, descriptions: value });
  };

  const addItineraryDay = () => {
    setFormData({
      ...formData,
      itinerary: [
        ...formData.itinerary,
        createItineraryDay(formData.itinerary.length),
      ],
    });
  };

  const removeItineraryDay = (index) => {
    const newItinerary = formData.itinerary.filter((_, i) => i !== index);
    const reindexed = newItinerary.map((item, i) => ({
      ...item,
      order: i + 1,
    }));
    setFormData({ ...formData, itinerary: reindexed });
  };

  const handleItineraryChange = (index, field, value) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[index][field] = value;
    setFormData({ ...formData, itinerary: newItinerary });
  };

  const handleActivityChange = (dayIndex, activityIndex, value) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[dayIndex].activities[activityIndex] = value;
    setFormData({ ...formData, itinerary: newItinerary });
  };

  const addActivity = (dayIndex) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[dayIndex].activities.push("");
    setFormData({ ...formData, itinerary: newItinerary });
  };

  const removeActivity = (dayIndex, activityIndex) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[dayIndex].activities = newItinerary[
      dayIndex
    ].activities.filter((_, i) => i !== activityIndex);
    setFormData({ ...formData, itinerary: newItinerary });
  };

  const [tempTag, setTempTag] = useState("");
  const addTag = (e) => {
    if ((e.key === "Enter" || e.type === "click") && tempTag) {
      e.preventDefault();
      if (!formData.tags.includes(tempTag)) {
        setFormData({ ...formData, tags: [...formData.tags, tempTag] });
      }
      setTempTag("");
    }
  };
  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const addFaq = () => {
    setFormData({
      ...formData,
      faq: [...formData.faq, { id: Date.now(), question: "", answer: "" }],
    });
  };

  const removeFaq = (index) => {
    setFormData({
      ...formData,
      faq: formData.faq.filter((_, i) => i !== index),
    });
  };

  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...formData.faq];
    newFaqs[index][field] = value;
    setFormData({ ...formData, faq: newFaqs });
  };

  const handleFaqDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFormData((prev) => {
      const oldIndex = prev.faq.findIndex((item) => item.id === active.id);
      const newIndex = prev.faq.findIndex((item) => item.id === over.id);
      return { ...prev, faq: arrayMove(prev.faq, oldIndex, newIndex) };
    });
  };

  const handleAdditionalInfoDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFormData((prev) => {
      const paragraphIndices = prev.customSections
        .map((section, index) => (section.type === "paragraph" ? index : null))
        .filter((index) => index !== null);
      const paragraphSections = paragraphIndices.map(
        (index) => prev.customSections[index]
      );
      const oldIndex = paragraphSections.findIndex(
        (section) => section.id === active.id
      );
      const newIndex = paragraphSections.findIndex(
        (section) => section.id === over.id
      );
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(paragraphSections, oldIndex, newIndex);
      const nextSections = [...prev.customSections];
      paragraphIndices.forEach((index, pos) => {
        nextSections[index] = reordered[pos];
      });
      return { ...prev, customSections: nextSections };
    });
  };

  // Custom Sections Handlers
  const addIncludedSection = () => {
    setFormData({
      ...formData,
      customSections: [
        ...formData.customSections,
        {
          id: Date.now(),
          title: "",
          type: "list",
          content: [],
          note: "",
          description: "",
        },
      ],
    });
  };

  const addCustomTextSection = () => {
    setFormData({
      ...formData,
      customSections: [
        ...formData.customSections,
        { id: Date.now(), title: "", type: "paragraph", content: [""] },
      ],
    });
  };

  const removeCustomSection = (index) => {
    setFormData({
      ...formData,
      customSections: formData.customSections.filter((_, i) => i !== index),
    });
  };

  const handleCustomSectionChange = (index, field, value) => {
    const newSections = [...formData.customSections];
    newSections[index][field] = value;
    setFormData({ ...formData, customSections: newSections });
  };

  const addCustomSectionItem = (sectionIndex) => {
    const newSections = [...formData.customSections];
    newSections[sectionIndex].content.push("");
    setFormData({ ...formData, customSections: newSections });
  };

  const handleCustomSectionItemChange = (sectionIndex, itemIndex, value) => {
    const newSections = [...formData.customSections];
    newSections[sectionIndex].content[itemIndex] = value;
    setFormData({ ...formData, customSections: newSections });
  };

  const removeCustomSectionItem = (sectionIndex, itemIndex) => {
    const newSections = [...formData.customSections];
    newSections[sectionIndex].content = newSections[
      sectionIndex
    ].content.filter((_, i) => i !== itemIndex);
    setFormData({ ...formData, customSections: newSections });
  };

  const handleSubmit = async ({ redirect = true } = {}) => {
    setIsUpdating(true);

    const updatingToast = toast.loading("Updating package...", {
      duration: Infinity,
    });

    try {
      const nextErrors = {};
      if (!formData.meta_title || !formData.meta_title.trim()) {
        nextErrors.meta_title = "Meta title is required";
      }
      if (!formData.meta_description || !formData.meta_description.trim()) {
        nextErrors.meta_description = "Meta description is required";
      }
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        toast.dismiss(updatingToast);
        toast.error("Please fill in required SEO fields");
        setIsUpdating(false);
        return;
      }

      if (
        formData.mainImage &&
        (!formData.mainImage.altText || !formData.mainImage.altText.trim())
      ) {
        toast.dismiss(updatingToast);
        toast.error("Cover image alt text is required");
        setIsUpdating(false);
        return;
      }

      const accessToken = Cookies.get("accessToken") || Cookies.get("token");
      if (!accessToken) {
        toast.dismiss(updatingToast);
        toast.error("Authentication token not found. Please log in again.");
        setIsUpdating(false);
        return;
      }

      toast.loading("Updating package details...", { id: updatingToast });
      const normalizedItinerary = formData.itinerary.map((day, index) => ({
        ...day,
        order: day.order || index + 1,
        day:
          day.day?.toString().trim() ||
          `Day ${day.order || index + 1}`,
      }));

      // Clean up custom sections - remove empty ones and filter empty content
      const cleanedCustomSections = formData.customSections
        .filter((section) => section.title && section.title.trim() !== "")
        .map((section) => {
          if (section.type === "list") {
            return {
              ...section,
              note: section.note || "",
              description: section.description || "",
              content: [],
            };
          }
          return {
            ...section,
            note: section.note || "",
            content: section.content.filter((item) => item && item.trim() !== ""),
          };
        })
        .filter(
          (section) =>
            section.note ||
            section.description ||
            section.content.length > 0
        );

      // Clean FAQ data - remove id field for backend
      const cleanedFaq = formData.faq.map(({ id, ...faq }) => faq);

      const categoryId = Number(formData.category);
      const payload = {
        package: {
          title: formData.title,
          slug:
            formData.slug?.trim() ||
            formData.title
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-"),
          descriptions: formData.descriptions,
          sub_description: formData.sub_description,
          overviewImage: formData.overviewImage,
          duration: formData.duration,
          trip_type_level: formData.trip_type_level,
          trip_attractions: formData.trip_attractions,
          trip_max_elevation: formData.trip_max_elevation,
          trip_best_season: formData.trip_best_season,
          trip_meals: formData.trip_meals,
          trip_accommodation: formData.trip_accommodation,
          trip_transportations: formData.trip_transportations,
          trip_highlights_title: formData.trip_highlights_title,
          trip_highlights: formData.trip_highlights,
          trip_highlights_description: formData.trip_highlights,
          itinerary_title: formData.itinerary_title,
          tour_type: formData.tour_type,
          rating: formData.rating,
          cost: formData.cost ? String(formData.cost) : "",
          ...(Number.isFinite(categoryId) && categoryId > 0 && { categoryId }),
          mainImage: formData.mainImage,
          itinerary: normalizedItinerary,
          imageGallary: formData.imageGallary,
          tags: formData.tags,
          faq: cleanedFaq,
          faq_section_title: formData.faq_section_title,
          showBookingForm: formData.showBookingForm,
          customSections: cleanedCustomSections,
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
        },
      };

      console.log("Sending update payload:", payload);
      console.log("Update URL:", `${BASE_URL}/package-tour/${packageId}`);

      const response = await axios.put(
        `${BASE_URL}/package-tour/${packageId}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Update Response:", response.data);
      toast.success("Package updated successfully!", {
        id: updatingToast,
        duration: 2000,
      });

      if (redirect) {
        setTimeout(() => {
          router.push("/admin/dashboard/popular-tour-packages");
        }, 1500);
      } else {
        setIsUpdating(false);
      }
    } catch (error) {
      console.error(" Error updating package:", error);
      console.error(" Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to update package", {
        id: updatingToast,
      });
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--admin-primary)] mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading package data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-4 md:p-6 font-sans">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-4 sm:mb-6 md:mb-8 bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-[var(--admin-primary-soft-strong)] p-1.5 sm:p-2 rounded-lg text-[var(--admin-primary)]">
              <Layout className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                Edit Package
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Update package information
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit({ redirect: false })}
              disabled={isUpdating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-800 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-900 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Update</span>
                  <span className="sm:hidden">Update</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleSubmit({ redirect: true })}
              disabled={isUpdating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--admin-primary)] text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-[var(--admin-primary-strong)] shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Update & Continue</span>
              <span className="sm:hidden">Continue</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Package Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full text-base sm:text-lg p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--admin-primary-ring)] outline-none"
                placeholder="e.g. Jomsom Muktinath Trekking"
              />
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  handleChange(e);
                }}
                className="w-full text-base sm:text-lg p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--admin-primary-ring)] outline-none"
                placeholder="e.g. jomsom-muktinath-trekking"
              />
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Sub Description <span className="text-gray-400">(Quote)</span>
              </label>
              <textarea
                name="sub_description"
                value={formData.sub_description}
                onChange={handleChange}
                rows={3}
                placeholder="Short quote or highlight"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--admin-primary-ring)] outline-none text-sm"
              />
            </div>


          </div>

          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--admin-primary)]" />
                Overview
              </h2>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Detailed Description
              </label>
              <RichEditor
                value={formData.descriptions}
                onChange={handleDescriptionChange}
                height="h-56"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Overview Image
              </label>
              {formData.overviewImage ? (
                <div className="flex items-center gap-4">
                  <img
                    src={
                      formData.overviewImage.variants?.medium ||
                      formData.overviewImage.url
                    }
                    alt="Overview"
                    className="w-28 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOverviewImageModalOpen(true)}
                      className="text-xs font-semibold text-[var(--admin-primary)]"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={removeOverviewImage}
                      className="text-xs font-semibold text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOverviewImageModalOpen(true)}
                  className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm text-gray-500"
                >
                  Select Overview Image
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--admin-primary)]" />
                Trip Highlights
              </h2>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.trip_highlights_title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    trip_highlights_title: e.target.value,
                  }))
                }
                placeholder="Trip highlights"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--admin-primary-ring)] outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Highlights
              </label>
              <RichEditor
                value={formData.trip_highlights}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    trip_highlights: value,
                  }))
                }
                height="h-36"
              />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
              <button
                type="button"
                onClick={() => setItineraryOpen((prev) => !prev)}
                className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--admin-primary)]" />
                Day-to-Day Itinerary
                {itineraryOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                type="button"
                onClick={addItineraryDay}
                className="text-sm bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] px-3 py-1.5 rounded-lg font-medium hover:bg-[var(--admin-primary-soft-strong)] transition flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Day
              </button>
            </div>

            {!itineraryOpen && (
              <p className="text-sm text-gray-500">
                {formData.itinerary.length > 0
                  ? "Click the arrow next to the title to update the day-by-day itinerary."
                  : "Click the arrow next to the title to add the day-by-day itinerary."}
              </p>
            )}

            {itineraryOpen && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Itinerary Title
                  </label>
                  <input
                    type="text"
                    value={formData.itinerary_title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        itinerary_title: e.target.value,
                      }))
                    }
                    placeholder="Sample Itinerary (Customizable)"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--admin-primary-ring)]/20 focus:border-[var(--admin-primary-border)] outline-none transition-all text-sm"
                  />
                </div>

                {formData.itinerary.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm text-gray-500">
                      Add day-by-day itinerary here.
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleItineraryDragEnd}
                  >
                    <SortableContext
                      items={formData.itinerary.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-6">
                        {formData.itinerary.map((day, dIndex) => (
                        <SortableItineraryCard key={day.id} id={day.id}>
                          {({ attributes, listeners }) => (
                            <div className="relative pl-6 sm:pl-12">
                          <div className="absolute left-0 sm:left-2 top-0 bottom-0 w-0.5 bg-gray-200 rounded-full" />
                          <div className="absolute left-[-5px] sm:left-px top-6 w-6 h-6 bg-white border-2 border-[var(--admin-primary-border)] rounded-full flex items-center justify-center z-10">
                            <span className="w-2 h-2 bg-[var(--admin-primary)] rounded-full" />
                          </div>

                          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[var(--admin-primary-border)] hover:shadow-md transition-all duration-300 group">
                            <div className="flex flex-col sm:flex-row mb-4">
                              <div className="w-24 pt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  className="p-2 rounded-md border border-gray-200 text-gray-400 hover:text-[var(--admin-primary)] hover:border-[var(--admin-primary-soft-strong)]"
                                  {...attributes}
                                  {...listeners}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                  {day.day || `Day ${day.order || dIndex + 1}`}
                                </span>
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">
                                  Day
                                </label>
                                <input
                                  type="text"
                                  placeholder="Add Day"
                                  value={day.day || `Day ${day.order || dIndex + 1}`}
                                  onChange={(e) =>
                                    handleItineraryChange(dIndex, "day", e.target.value)
                                  }
                                  className="mb-3 w-40 text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--admin-primary-ring)] outline-none"
                                />
                                <label className="block text-sm font-semibold text-gray-600 mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  placeholder="Add Title"
                                  value={day.title}
                                  onChange={(e) =>
                                    handleItineraryChange(dIndex, "title", e.target.value)
                                  }
                                  className="w-full text-base font-semibold text-gray-900 border-b border-gray-200 focus:border-[var(--admin-primary-border)] outline-none pb-1 placeholder-gray-300 transition-colors"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItineraryDay(dIndex)}
                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="pl-0 sm:pl-24 mb-4">
                              <label className="text-xs font-semibold text-gray-600 mb-2 block">
                                Description
                              </label>
                              <RichEditor
                                value={day.richText || ""}
                                onChange={(value) =>
                                  handleItineraryChange(dIndex, "richText", value)
                                }
                                height="h-40"
                              />
                            </div>

                            <div className="pl-0 sm:pl-24 mb-4">
                              <label className="text-xs font-semibold text-gray-600 mb-2 block">
                                Day Image (optional)
                              </label>
                              {day.image ? (
                                <div className="flex items-center gap-3">
                                  <img
                                    src={day.image.variants?.thumbnail || day.image.url}
                                    alt={day.image.title || "Day image"}
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveItineraryIndex(dIndex);
                                        setItineraryImageModalOpen(true);
                                      }}
                                      className="text-xs font-semibold text-[var(--admin-primary)]"
                                    >
                                      Change
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleItineraryChange(dIndex, "image", null)}
                                      className="text-xs font-semibold text-red-500"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveItineraryIndex(dIndex);
                                    setItineraryImageModalOpen(true);
                                  }}
                                  className="text-xs font-semibold text-[var(--admin-primary)] bg-[var(--admin-primary-soft)] px-3 py-2 rounded-lg hover:bg-[var(--admin-primary-soft-strong)]"
                                >
                                  Select Image
                                </button>
                              )}
                            </div>

                            <div className="pl-0 sm:pl-24 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                  Accommodation
                                </label>
                                <input
                                  type="text"
                                  value={day.accommodation || ""}
                                  onChange={(e) =>
                                    handleItineraryChange(
                                      dIndex,
                                      "accommodation",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., 3star to Luxury hotels"
                                  className="w-full text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] focus:border-[var(--admin-primary-border)] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                  Meal
                                </label>
                                <input
                                  type="text"
                                  value={day.meal || ""}
                                  onChange={(e) =>
                                    handleItineraryChange(dIndex, "meal", e.target.value)
                                  }
                                  placeholder="e.g., Breakfast"
                                  className="w-full text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] focus:border-[var(--admin-primary-border)] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                  Elevation
                                </label>
                                <input
                                  type="text"
                                  value={day.elevation || ""}
                                  onChange={(e) =>
                                    handleItineraryChange(dIndex, "elevation", e.target.value)
                                  }
                                  placeholder="e.g., 3656m"
                                  className="w-full text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] focus:border-[var(--admin-primary-border)] outline-none"
                                />
                              </div>
                            </div>

                            <div className="pl-0 sm:pl-24 space-y-2">
                              <label className="text-xs font-semibold text-gray-600 block">
                                Activities (Optional)
                              </label>
                              {day.activities.map((activity, aIndex) => (
                                <div key={aIndex} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0"></div>
                                  <input
                                    type="text"
                                    value={activity}
                                    onChange={(e) =>
                                      handleActivityChange(
                                        dIndex,
                                        aIndex,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Activity detail"
                                    className="flex-1 text-xs sm:text-sm bg-transparent border-b border-gray-200 focus:border-[var(--admin-primary-border)] outline-none py-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeActivity(dIndex, aIndex)}
                                    className="text-gray-300 hover:text-red-500 shrink-0"
                                    disabled={day.activities.length === 1}
                                  >
                                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addActivity(dIndex)}
                                className="text-xs text-[var(--admin-primary)] font-medium mt-2 hover:underline flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add Activity
                              </button>
                            </div>

                          </div>
                            </div>
                          )}
                        </SortableItineraryCard>
                      ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </>
            )}
          </div>

          {/* Custom Sections */}
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setIncludedExcludedOpen((prev) => !prev)}
                className="font-bold text-sm sm:text-base text-gray-800 flex items-center gap-2"
              >
                Included / Excluded Sections
                {includedExcludedOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                type="button"
                onClick={addIncludedSection}
                className="text-sm bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] px-3 py-1.5 rounded-lg font-medium hover:bg-[var(--admin-primary-soft-strong)] transition flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>
            {!includedExcludedOpen && (
              <p className="text-xs text-gray-500">
                {formData.customSections.filter((section) => section.type === "list")
                  .length > 0
                  ? "Click the arrow next to the title to update included/excluded sections."
                  : "Click the arrow next to the title to add included/excluded sections."}
              </p>
            )}

            {includedExcludedOpen && (
              <>
                {formData.customSections.filter((section) => section.type === "list")
                  .length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No include/exclude sections yet. Click "Add Section" to create
                    one.
                  </div>
                )}

                <div className="space-y-6">
                  {formData.customSections
                    .map((section, sIndex) => ({ section, sIndex }))
                    .filter(({ section }) => section.type === "list")
                    .map(({ section, sIndex }) => (
                      <div
                        key={section.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-[var(--admin-primary-border)] transition"
                      >
                        <div className="flex justify-between items-start gap-2 mb-4">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              placeholder="Section Title (e.g., Includes)"
                              value={section.title}
                              onChange={(e) =>
                                handleCustomSectionChange(
                                  sIndex,
                                  "title",
                                  e.target.value
                                )
                              }
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm font-semibold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCustomSection(sIndex)}
                            className="text-gray-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-gray-600 mb-2">
                            Note
                          </label>
                          <RichEditor
                            value={section.note || ""}
                            onChange={(value) =>
                              handleCustomSectionChange(sIndex, "note", value)
                            }
                            height="h-24"
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-gray-600 mb-2">
                            Description
                          </label>
                          <RichEditor
                            value={section.description || ""}
                            onChange={(value) =>
                              handleCustomSectionChange(
                                sIndex,
                                "description",
                                value
                              )
                            }
                            height="h-28"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Frequently Asked Questions */}
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setFaqOpen((prev) => !prev)}
                className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2"
              >
                Frequently Asked Questions
                {faqOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                type="button"
                onClick={addFaq}
                className="px-3 py-1.5 bg-[var(--admin-primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--admin-primary-strong)] transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} />
                Add FAQ
              </button>
            </div>
            {!faqOpen && (
              <p className="text-xs text-gray-500 mb-4">
                {formData.faq.length > 0
                  ? "Click the arrow next to the title to update the FAQs."
                  : "Click the arrow next to the title to add FAQs for this package."}
              </p>
            )}

            {faqOpen && (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={formData.faq_section_title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        faq_section_title: e.target.value,
                      }))
                    }
                    placeholder="FAQs"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--admin-primary-ring)] focus:border-transparent transition-all"
                  />
                </div>

                {formData.faq.length > 0 ? (
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleFaqDragEnd}
                  >
                    <SortableContext
                      items={formData.faq.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {formData.faq.map((faq, index) => (
                          <SortableFaqCard key={faq.id} id={faq.id}>
                            {({ attributes, listeners }) => (
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="text-gray-400 hover:text-gray-600"
                                      {...attributes}
                                      {...listeners}
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-semibold text-gray-500">
                                      FAQ #{index + 1}
                                    </span>
                                  </div>
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
                                      placeholder="Enter the question..."
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--admin-primary-ring)] focus:border-transparent transition-all"
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
                            )}
                          </SortableFaqCard>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">
                      No FAQs added yet. Click "Add FAQ" to create one.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setAdditionalInfoOpen((prev) => !prev)}
                className="font-bold text-sm sm:text-base text-gray-800 flex items-center gap-2"
              >
                Additional Info Sections
                {additionalInfoOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                type="button"
                onClick={addCustomTextSection}
                className="text-sm bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] px-3 py-1.5 rounded-lg font-medium hover:bg-[var(--admin-primary-soft-strong)] transition flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>
            {!additionalInfoOpen && (
              <p className="text-xs text-gray-500">
                {formData.customSections.filter(
                  (section) => section.type === "paragraph"
                ).length > 0
                  ? "Click the arrow next to the title to update additional info sections."
                  : "Click the arrow next to the title to add additional info sections."}
              </p>
            )}

            {additionalInfoOpen && (
              <>
                {formData.customSections.filter(
                  (section) => section.type === "paragraph"
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No custom sections yet. Click "Add Section" to create one.
                  </div>
                )}

                {formData.customSections.filter(
                  (section) => section.type === "paragraph"
                ).length > 0 && (
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleAdditionalInfoDragEnd}
                  >
                    <SortableContext
                      items={formData.customSections
                        .filter((section) => section.type === "paragraph")
                        .map((section) => section.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-6">
                        {formData.customSections
                          .map((section, sIndex) => ({ section, sIndex }))
                          .filter(({ section }) => section.type === "paragraph")
                          .map(({ section, sIndex }) => (
                            <SortableFaqCard key={section.id} id={section.id}>
                              {({ attributes, listeners }) => (
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-[var(--admin-primary-border)] transition">
                                  <div className="flex justify-between items-start gap-2 mb-4">
                                    <div className="flex-1 flex items-center gap-2">
                                      <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600"
                                        {...attributes}
                                        {...listeners}
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </button>
                                      <input
                                        type="text"
                                        placeholder="Section Title (e.g., Extra Info)"
                                        value={section.title}
                                        onChange={(e) =>
                                          handleCustomSectionChange(
                                            sIndex,
                                            "title",
                                            e.target.value
                                          )
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm font-semibold"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeCustomSection(sIndex)}
                                      className="text-gray-400 hover:text-red-500 transition"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>

                                  <RichEditor
                                    value={section.content[0] || ""}
                                    onChange={(value) =>
                                      handleCustomSectionItemChange(sIndex, 0, value)
                                    }
                                    height="h-32"
                                  />
                                </div>
                              )}
                            </SortableFaqCard>
                          ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-3 sm:mb-4">
              Category
            </h3>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full appearance-none text-sm sm:text-base p-2.5 pr-10 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-[var(--admin-primary-ring)] focus:border-[var(--admin-primary-border)] outline-none"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-3 sm:mb-4">
              Main Cover Image
            </h3>

            {!formData.mainImage ? (
              <button
                type="button"
                onClick={() => setMainImageModalOpen(true)}
                className="border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition h-40 sm:h-48"
              >
                <div className="bg-[var(--admin-primary-soft)] p-2 sm:p-3 rounded-full text-[var(--admin-primary)] mb-2 sm:mb-3">
                  <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  Select from Media Library
                </span>
              </button>
            ) : (
              <div className="relative rounded-lg sm:rounded-xl overflow-hidden group h-40 sm:h-48">
                <img
                  src={
                    formData.mainImage.variants?.medium ||
                    formData.mainImage.url
                  }
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => setMainImageModalOpen(true)}
                    className="bg-white/90 text-gray-900 px-3 py-1.5 rounded-full text-xs font-semibold"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={removeMainImage}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            )}
            {formData.mainImage && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Cover Image Alt Text
                </label>
                <input
                  type="text"
                  value={formData.mainImage.altText || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mainImage: {
                        ...(prev.mainImage || {}),
                        altText: e.target.value,
                      },
                    }))
                  }
                  placeholder="Describe the image for accessibility"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>

          {/* Gallery Upload */}
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="font-bold text-sm sm:text-base text-gray-800">
                Gallery Images
              </h3>
              <button
                type="button"
                onClick={() => setGalleryModalOpen(true)}
                className="text-xs sm:text-sm text-[var(--admin-primary)] font-medium hover:underline"
              >
                + Add Images
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {formData.imageGallary.map((img, index) => (
                <div
                  key={`new-${index}`}
                  className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200"
                >
                  <img
                    src={img.variants?.thumbnail || img.url}
                    alt="Gallery"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {formData.imageGallary.length === 0 && (
                <div className="col-span-3 py-4 sm:py-6 text-center text-gray-400 text-xs sm:text-sm italic bg-gray-50 rounded-lg">
                  No gallery images yet
                </div>
              )}
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 space-y-3 sm:space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-gray-800 border-b pb-2">
              Trip Facts
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Duration
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full pl-9 p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. 13 Days"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Total Cost
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  className="w-full pl-9 p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Enter total cost (e.g. 1400)"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Trip Type/Level
              </label>
              <input
                type="text"
                name="trip_type_level"
                value={formData.trip_type_level}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: Adventure / Moderate"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Trip Attractions
              </label>
              <input
                type="text"
                name="trip_attractions"
                value={formData.trip_attractions}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: Kathmandu, Pokhara, Chitwan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Trip Max Elevation
              </label>
              <input
                type="text"
                name="trip_max_elevation"
                value={formData.trip_max_elevation}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: 5364m"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Trip Best Season
              </label>
              <input
                type="text"
                name="trip_best_season"
                value={formData.trip_best_season}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: Mar-May, Sep-Nov"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Trip Meals
              </label>
              <input
                type="text"
                name="trip_meals"
                value={formData.trip_meals}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: Breakfast, Lunch, Dinner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Trip Accommodation
              </label>
              <input
                type="text"
                name="trip_accommodation"
                value={formData.trip_accommodation}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: 3-star hotels"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Trip Transportations
              </label>
              <input
                type="text"
                name="trip_transportations"
                value={formData.trip_transportations}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: Private vehicle, Flight"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Difficulty
                </label>
                <select
                  name="tour_type"
                  value={formData.tour_type}
                  onChange={handleChange}
                  className="w-full pr-9 p-2 border border-gray-300 rounded-lg text-sm bg-white appearance-none"
                >
                  <option>Easy</option>
                  <option>Moderate</option>
                  <option>Challenging</option>
                  <option>Strenuous</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ marginTop: "10px" }} />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Rating
                </label>
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400 fill-yellow-400" size={18} style={{ marginTop: "10px" }} />
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  className="w-full pl-9 pr-9 p-2 border border-gray-300 rounded-lg text-sm bg-white appearance-none"
                >
                  <option>Good</option>
                  <option>Very Good</option>
                  <option>Excellent</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ marginTop: "10px" }} />
              </div>
            </div>

            {/* Show Booking Form Toggle */}
            <div className="pt-3 border-t border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
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
                  className="w-4 h-4 text-[var(--admin-primary)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--admin-primary-ring)]"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Show Booking Form
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Display "Ask to Expert" booking form on this package page
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Tags & SEO */}
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-3">
              Tags & SEO
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={tempTag}
                onChange={(e) => setTempTag(e.target.value)}
                onKeyDown={addTag}
                placeholder="Add tag..."
                className="flex-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={addTag}
                className="bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-lg text-sm whitespace-nowrap w-full sm:w-auto"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1 border border-gray-200"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, meta_title: value });
                    if (errors.meta_title && value.trim()) {
                      setErrors((prev) => ({ ...prev, meta_title: "" }));
                    }
                  }}
                  className={`w-full p-2 border rounded-lg text-sm ${
                    errors.meta_title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="SEO title for this package"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Meta Description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, meta_description: value });
                    if (errors.meta_description && value.trim()) {
                      setErrors((prev) => ({ ...prev, meta_description: "" }));
                    }
                  }}
                  className={`w-full p-2 border rounded-lg text-sm ${
                    errors.meta_description ? "border-red-500" : "border-gray-300"
                  }`}
                  rows={3}
                  placeholder="Short SEO description"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
      <MediaPickerModal
        open={mainImageModalOpen}
        onOpenChange={setMainImageModalOpen}
        onSelect={handleMainImageSelect}
        title="Select Cover Image"
      />
      <MediaPickerModal
        open={galleryModalOpen}
        onOpenChange={setGalleryModalOpen}
        onSelect={handleGallerySelect}
        title="Add Gallery Image"
      />
      <MediaPickerModal
        open={itineraryImageModalOpen}
        onOpenChange={setItineraryImageModalOpen}
        onSelect={handleItineraryImageSelect}
        title="Select Day Image"
      />
      <MediaPickerModal
        open={overviewImageModalOpen}
        onOpenChange={setOverviewImageModalOpen}
        onSelect={handleOverviewImageSelect}
        title="Select Overview Image"
      />
    </div>
  );
};

export default EditPackage;
