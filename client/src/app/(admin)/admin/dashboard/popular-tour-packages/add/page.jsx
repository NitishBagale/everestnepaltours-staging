"use client";
import React, { useState } from "react";
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
  DollarSign,
  Type,
  CheckCircle2,
  AlertCircle,
  Image as ImageIconLucide,
  ArrowLeft,
  GripVertical,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
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
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const createItineraryDay = (index) => ({
  id: crypto.randomUUID(),
  order: index + 1,
  day: "",
  title: "",
  richText: "",
  driveTime: "",
  accommodation: "",
  meal: "",
  elevation: "",
  activities: [""],
  images: [],
});

const normalizeItineraryPayload = (itinerary = []) =>
  itinerary.map((day, index) => {
    const order = day.order || index + 1;
    const parsedDay = Number(day.day);
    const dayNumber =
      Number.isFinite(parsedDay) && parsedDay > 0 ? parsedDay : order;
    const normalized = {
      ...day,
      order,
      day: dayNumber,
    };

    const sourceImages = Array.isArray(normalized.images)
      ? normalized.images
      : normalized.image
        ? [normalized.image]
        : [];
    const normalizedImages = sourceImages
      .map((image) => {
        if (!image) return null;
        if (typeof image === "string") {
          if (!image.trim()) return null;
          return {
            mediaId: null,
            url: image,
            variants: {},
            title: "",
            altText: "",
            caption: "",
            sizePercent: 100,
          };
        }
        if (typeof image !== "object" || !image.url) return null;
        const {
          caption = "",
          sizePercent = 100,
          altText,
          ...rest
        } = image;
        const cleaned = { ...rest, url: image.url };
        if (altText && String(altText).trim()) {
          cleaned.altText = altText;
        }
        return {
          ...cleaned,
          caption: String(caption || ""),
          sizePercent: Number(sizePercent) || 100,
        };
      })
      .filter(Boolean);
    normalized.images = normalizedImages;
    delete normalized.image;

    if (Array.isArray(normalized.activities)) {
      const cleaned = normalized.activities
        .map((item) => (typeof item === "string" ? item.trim() : item))
        .filter((item) => {
          if (typeof item === "string") return item.length > 0;
          return item != null;
        });
      normalized.activities = cleaned;
    }

    return normalized;
  });

const itemChevronToggleClass =
  "h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center justify-center transition-colors";

const BASE_PACKAGE_BLOCKS = [
  { id: "itinerary", label: "Day-by-Day Itinerary" },
  { id: "includeExclude", label: "Include / Exclude" },
  { id: "faq", label: "Frequently Asked Questions" },
  { id: "travelInfo", label: "Travel Info" },
];
const BASE_PACKAGE_BLOCK_IDS = BASE_PACKAGE_BLOCKS.map((item) => item.id);
const additionalInfoToken = (id) => `additionalInfo:${String(id)}`;
const normalizePackageSectionOrder = (value, sections) => {
  const additionalTokens = (Array.isArray(sections) ? sections : [])
    .filter((section) => section?.type === "paragraph")
    .map((section) => additionalInfoToken(section.id));
  const allowed = new Set([...BASE_PACKAGE_BLOCK_IDS, ...additionalTokens]);
  const incoming = Array.isArray(value) ? value.map(String) : [];
  const picked = incoming.filter((item) => allowed.has(item));
  const missingBase = BASE_PACKAGE_BLOCK_IDS.filter((item) => !picked.includes(item));
  const missingAdditional = additionalTokens.filter((item) => !picked.includes(item));
  return [...picked, ...missingBase, ...missingAdditional];
};


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

const SortablePackageBlockCard = ({ id, label }) => {
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
      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50"
    >
      <button
        type="button"
        className="text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
};

const getGalleryImageId = (image, index = 0) =>
  String(image?.mediaId || image?.id || image?.url || `gallery-${index}`);

const SortableGalleryImage = ({ id, image, index, onRemove }) => {
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
      className="relative aspect-square rounded-lg overflow-hidden group shadow-sm border border-gray-100"
    >
      <img
        src={image.variants?.thumbnail || image.url}
        alt={image.altText || image.title || "Gallery"}
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        className="absolute top-1 left-1 bg-black/60 text-white p-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing"
        aria-label={`Reorder gallery image ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-red-500"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};


const CreatePackage = () => {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [tempTag, setTempTag] = useState("");
  const [mainImageModalOpen, setMainImageModalOpen] = useState(false);
  const [overviewImageModalOpen, setOverviewImageModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [itineraryImageModalOpen, setItineraryImageModalOpen] = useState(false);
  const [activeItineraryIndex, setActiveItineraryIndex] = useState(null);
  const [itineraryOpen, setItineraryOpen] = useState(false);
  const [includedExcludedOpen, setIncludedExcludedOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);
  const [travelInfoOpen, setTravelInfoOpen] = useState(false);
  const [openItineraryItems, setOpenItineraryItems] = useState({});
  const [openIncludedExcludedItems, setOpenIncludedExcludedItems] = useState({});
  const [openFaqItems, setOpenFaqItems] = useState({});
  const [openAdditionalInfoItems, setOpenAdditionalInfoItems] = useState({});
  const [openTravelInfoItems, setOpenTravelInfoItems] = useState({});
  const sensors = useSensors(useSensor(PointerSensor));

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    sub_description: "",
    descriptions: "",
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
    cost: "",
    mainImage: null,
    overviewImage: null,
    overviewImageAlign: "center",
    overviewImageSize: 100,
    itinerary: [],
    imageGallary: [],
    tags: [],
    faq: [],
    faq_section_title: "",
    showBookingForm: false,
    packageSectionOrder: BASE_PACKAGE_BLOCK_IDS,
    customSections: [],
    meta_title: "",
    meta_description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const slugify = (text) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    if (name === "title") {
      setFormData((prev) => ({
        ...prev,
        title: value,
        slug: slugTouched ? prev.slug : slugify(value),
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleDescriptionChange = (value) => {
    setFormData({ ...formData, descriptions: value });
    if (errors.descriptions) {
      setErrors({ ...errors, descriptions: "" });
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
    if (errors.mainImage) setErrors({ ...errors, mainImage: "" });
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
    const selectedMedia = Array.isArray(media) ? media : [media];
    setFormData((prev) => {
      const existingIds = new Set(
        prev.imageGallary.map((img) => String(img?.mediaId || img?.id || img?.url || ""))
      );
      const newImages = selectedMedia.filter((img) => {
        const key = String(img?.mediaId || img?.id || img?.url || "");
        return key && !existingIds.has(key);
      });
      if (newImages.length === 0) return prev;
      return { ...prev, imageGallary: [...prev.imageGallary, ...newImages] };
    });
  };

  const removeGalleryImage = (index) => {
    setFormData({
      ...formData,
      imageGallary: formData.imageGallary.filter((_, i) => i !== index),
    });
  };

  const handleGalleryDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFormData((prev) => {
      const oldIndex = prev.imageGallary.findIndex(
        (img, index) => getGalleryImageId(img, index) === active.id
      );
      const newIndex = prev.imageGallary.findIndex(
        (img, index) => getGalleryImageId(img, index) === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return prev;

      return {
        ...prev,
        imageGallary: arrayMove(prev.imageGallary, oldIndex, newIndex),
      };
    });
  };

  const addItineraryDay = () => {
    setItineraryOpen(true);
    setFormData((prev) => ({
      ...prev,
      itinerary: [...prev.itinerary, createItineraryDay(prev.itinerary.length)],
    }));
  };

  const removeItineraryDay = (index) => {
    setFormData((prev) => {
      const newItinerary = prev.itinerary.filter((_, i) => i !== index);
      const reindexed = newItinerary.map((item, i) => ({
        ...item,
        order: i + 1,
      }));
      return { ...prev, itinerary: reindexed };
    });
  };

  const handleItineraryChange = (index, field, value) => {
    setFormData((prev) => {
      const newItinerary = [...prev.itinerary];
      newItinerary[index] = { ...newItinerary[index], [field]: value };
      return { ...prev, itinerary: newItinerary };
    });
  };

  const handleActivityChange = (dayIndex, activityIndex, value) => {
    setFormData((prev) => {
      const newItinerary = [...prev.itinerary];
      const nextActivities = [...(newItinerary[dayIndex].activities || [])];
      nextActivities[activityIndex] = value;
      newItinerary[dayIndex] = {
        ...newItinerary[dayIndex],
        activities: nextActivities,
      };
      return { ...prev, itinerary: newItinerary };
    });
  };

  const addActivity = (dayIndex) => {
    setFormData((prev) => {
      const newItinerary = [...prev.itinerary];
      newItinerary[dayIndex] = {
        ...newItinerary[dayIndex],
        activities: [...(newItinerary[dayIndex].activities || []), ""],
      };
      return { ...prev, itinerary: newItinerary };
    });
  };

  const removeActivity = (dayIndex, activityIndex) => {
    setFormData((prev) => {
      const newItinerary = [...prev.itinerary];
      newItinerary[dayIndex] = {
        ...newItinerary[dayIndex],
        activities: (newItinerary[dayIndex].activities || []).filter(
          (_, i) => i !== activityIndex
        ),
      };
      return { ...prev, itinerary: newItinerary };
    });
  };

  const updateItineraryImage = (dayIndex, imageIndex, nextImage) => {
    setFormData((prev) => {
      const nextItinerary = [...prev.itinerary];
      const currentDay = nextItinerary[dayIndex];
      const currentImages = Array.isArray(currentDay.images) ? currentDay.images : [];
      const nextImages = [...currentImages];
      nextImages[imageIndex] = {
        ...nextImages[imageIndex],
        ...nextImage,
      };
      nextItinerary[dayIndex] = { ...currentDay, images: nextImages };
      return { ...prev, itinerary: nextItinerary };
    });
  };

  const removeItineraryImage = (dayIndex, imageIndex) => {
    setFormData((prev) => {
      const nextItinerary = [...prev.itinerary];
      const currentDay = nextItinerary[dayIndex];
      const currentImages = Array.isArray(currentDay.images) ? currentDay.images : [];
      nextItinerary[dayIndex] = {
        ...currentDay,
        images: currentImages.filter((_, idx) => idx !== imageIndex),
      };
      return { ...prev, itinerary: nextItinerary };
    });
  };

  const moveItineraryImage = (dayIndex, imageIndex, direction) => {
    setFormData((prev) => {
      const nextItinerary = [...prev.itinerary];
      const currentDay = nextItinerary[dayIndex];
      const currentImages = Array.isArray(currentDay.images) ? [...currentDay.images] : [];
      const targetIndex = imageIndex + direction;
      if (targetIndex < 0 || targetIndex >= currentImages.length) return prev;
      const [moved] = currentImages.splice(imageIndex, 1);
      currentImages.splice(targetIndex, 0, moved);
      nextItinerary[dayIndex] = { ...currentDay, images: currentImages };
      return { ...prev, itinerary: nextItinerary };
    });
  };

  const handleItineraryImageSelect = (media) => {
    if (activeItineraryIndex === null) return;
    setFormData((prev) => {
      const updated = [...prev.itinerary];
      updated[activeItineraryIndex] = {
        ...updated[activeItineraryIndex],
        images: [
          ...(Array.isArray(updated[activeItineraryIndex].images)
            ? updated[activeItineraryIndex].images
            : []),
          { ...media, caption: "", sizePercent: 100 },
        ],
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

  const addIncludedSection = () => {
    setIncludedExcludedOpen(true);
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
    setAdditionalInfoOpen(true);
    const newSection = { id: Date.now(), title: "", type: "paragraph", content: [""] };
    const nextSections = [...formData.customSections, newSection];
    const nextOrder = normalizePackageSectionOrder(
      [...(formData.packageSectionOrder || []), additionalInfoToken(newSection.id)],
      nextSections
    );
    setFormData({
      ...formData,
      customSections: nextSections,
      packageSectionOrder: nextOrder,
    });
  };

  const removeCustomSection = (index) => {
    const target = formData.customSections[index];
    const nextSections = formData.customSections.filter((_, i) => i !== index);
    const nextOrder = normalizePackageSectionOrder(
      (formData.packageSectionOrder || []).filter(
        (item) => item !== additionalInfoToken(target?.id)
      ),
      nextSections
    );
    setFormData({
      ...formData,
      customSections: nextSections,
      packageSectionOrder: nextOrder,
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
    setFaqOpen(true);
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

  const handleTravelInfoDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFormData((prev) => {
      const travelIndices = prev.customSections
        .map((section, index) => (section.type === "travelInfo" ? index : null))
        .filter((index) => index !== null);
      const travelSections = travelIndices.map((index) => prev.customSections[index]);
      const oldIndex = travelSections.findIndex((section) => section.id === active.id);
      const newIndex = travelSections.findIndex((section) => section.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(travelSections, oldIndex, newIndex);
      const nextSections = [...prev.customSections];
      travelIndices.forEach((index, pos) => {
        nextSections[index] = reordered[pos];
      });
      return { ...prev, customSections: nextSections };
    });
  };

  const handlePackageSectionOrderDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFormData((prev) => {
      const currentOrder = normalizePackageSectionOrder(
        prev.packageSectionOrder,
        prev.customSections
      );
      const oldIndex = currentOrder.findIndex((item) => item === active.id);
      const newIndex = currentOrder.findIndex((item) => item === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return {
        ...prev,
        packageSectionOrder: arrayMove(currentOrder, oldIndex, newIndex),
      };
    });
  };


  const addTravelInfoSection = () => {
    setTravelInfoOpen(true);
    setFormData({
      ...formData,
      customSections: [
        ...formData.customSections,
        { id: Date.now(), title: "", type: "travelInfo", content: [""] },
      ],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.title || formData.title.trim().length < 5)
      newErrors.title = "Title must be at least 5 characters";
    if (
      !formData.descriptions ||
      formData.descriptions.replace(/<[^>]*>/g, "").trim().length < 100
    )
      newErrors.descriptions = "Description must be at least 100 characters";
    if (!formData.duration) newErrors.duration = "Duration is required";
    if (!formData.mainImage)
      newErrors.mainImage = "Cover image is required";
    if (!formData.meta_title || !formData.meta_title.trim())
      newErrors.meta_title = "Meta title is required";
    if (!formData.meta_description || !formData.meta_description.trim())
      newErrors.meta_description = "Meta description is required";
    if (
      formData.mainImage &&
      (!formData.mainImage.altText || !formData.mainImage.altText.trim())
    ) {
      newErrors.mainImage = "Cover image alt text is required";
    }
    formData.itinerary.forEach((day, i) => {
      if (!day.title || day.title.trim().length < 3)
        newErrors[`itinerary_${i}_title`] = "Day title required";
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix validation errors");
      return;
    }

    setIsPublishing(true);
    const publishingToast = toast.loading("Publishing package...", {
      duration: Infinity,
    });

    try {
      const accessToken = Cookies.get("accessToken") || Cookies.get("token");
      if (!accessToken) throw new Error("Authentication failed");
      const slugValue =
        formData.slug?.trim() ||
        formData.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

      const normalizedItinerary = normalizeItineraryPayload(formData.itinerary);

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

      const finalTags = [...formData.tags];
      // Clean FAQ data - remove id field for backend
      const cleanedFaq = formData.faq.map(({ id, ...faq }) => faq);

      const payload = {
        package: {
          title: formData.title,
          slug: slugValue,
          descriptions: formData.descriptions,
          sub_description: formData.sub_description,
          overviewImage: formData.overviewImage,
          overviewImageAlign: formData.overviewImageAlign || "center",
          overviewImageSize: Number(formData.overviewImageSize) || 100,
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
          mainImage: formData.mainImage,
          itinerary: normalizedItinerary,
          imageGallary: formData.imageGallary,
          tags: finalTags,
          faq: cleanedFaq,
          faq_section_title: formData.faq_section_title,
          showBookingForm: formData.showBookingForm,
          customSections: cleanedCustomSections,
          packageSectionOrder: normalizePackageSectionOrder(
            formData.packageSectionOrder,
            cleanedCustomSections
          ),
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
        },
      };

      await axios.post(`${BASE_URL}/package-tour/`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success("Package published successfully!", { id: publishingToast });
      setTimeout(() => {
        router.push("/admin/dashboard/popular-tour-packages");
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create package", {
        id: publishingToast,
      });
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 font-sans text-gray-800">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <header className="max-w-7xl mx-auto mb-8  p-4 sm:p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] sticky top-4 z-40 backdrop-blur-sm  border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-[var(--admin-primary)] p-3 rounded-xl text-white shadow-lg shadow-[var(--admin-primary-shadow)] hidden sm:block">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Create New Package
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Design a new travel experience
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="hidden sm:block px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPublishing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-black shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>Publish Package</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 sm:space-y-8">
            <div className="border-b border-gray-100 pb-6 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <Type className="w-5 h-5 text-[var(--admin-primary)]" />
                Basic Information
              </h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Package Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full text-lg p-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[var(--admin-primary-ring)]/20 focus:border-[var(--admin-primary-border)] outline-none transition-all ${
                  errors.title ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
                placeholder="Ex: Everest Base Camp Trek"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full text-lg p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--admin-primary-ring)]/20 focus:border-[var(--admin-primary-border)] outline-none transition-all"
                placeholder="ex: everest-base-camp-trek"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sub Description <span className="text-gray-400">(Quote)</span>
              </label>
              <textarea
                name="sub_description"
                value={formData.sub_description}
                onChange={handleChange}
                rows={3}
                placeholder="Short quote or highlight"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--admin-primary-ring)]/20 focus:border-[var(--admin-primary-border)] outline-none transition-all text-sm"
              />
            </div>

          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 min-h-[520px]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <FileText className="w-5 h-5 text-[var(--admin-primary)]" />
                Overview
              </h2>
            </div>

            <div className="mb-20">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <RichEditor
                value={formData.descriptions}
                onChange={handleDescriptionChange}
                className={
                  errors.descriptions
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-200"
                }
              />
              {errors.descriptions && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.descriptions}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Alignment
                  </label>
                  <select
                    value={formData.overviewImageAlign || "center"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        overviewImageAlign: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Size
                  </label>
                  <select
                    value={String(formData.overviewImageSize || 100)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        overviewImageSize: Number(e.target.value),
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="25">25%</option>
                    <option value="50">50%</option>
                    <option value="75">75%</option>
                    <option value="100">100%</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <FileText className="w-5 h-5 text-[var(--admin-primary)]" />
                Trip Highlights
              </h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--admin-primary-ring)]/20 focus:border-[var(--admin-primary-border)] outline-none transition-all text-sm"
              />
            </div>

            <div className="mb-20">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                height="h-48"
              />
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Package Blocks Order</h2>
            <p className="text-sm text-gray-500">
              Additional Info blocks can be placed anywhere in this order.
            </p>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handlePackageSectionOrderDragEnd}
            >
              <SortableContext
                items={normalizePackageSectionOrder(
                  formData.packageSectionOrder,
                  formData.customSections
                )}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {normalizePackageSectionOrder(
                    formData.packageSectionOrder,
                    formData.customSections
                  ).map((id) => (
                    <SortablePackageBlockCard
                      key={id}
                      id={id}
                      label={
                        id.startsWith("additionalInfo:")
                          ? `Additional Info: ${
                              formData.customSections.find(
                                (section) => additionalInfoToken(section.id) === id
                              )?.title || "Untitled"
                            }`
                          : BASE_PACKAGE_BLOCKS.find((item) => item.id === id)?.label || id
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setItineraryOpen((prev) => !prev)}
                className="flex items-center gap-2 text-xl font-bold text-gray-900"
              >
                <MapPin className="w-5 h-5 text-[var(--admin-primary)]" />
                Day-to-Day Itinerary
              </button>
              <button
                type="button"
                onClick={() => setItineraryOpen((prev) => !prev)}
                aria-label={itineraryOpen ? "Collapse itinerary section" : "Expand itinerary section"}
                className="h-10 w-10 rounded-xl border-2 border-gray-300 bg-white text-gray-700 flex items-center justify-center shadow-sm hover:border-gray-500 hover:text-gray-900 transition-colors"
              >
                {itineraryOpen ? (
                  <ChevronUp className="w-6 h-6 stroke-[2.75]" />
                ) : (
                  <ChevronDown className="w-6 h-6 stroke-[2.75]" />
                )}
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
                <div className="mb-6">
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
                                    handleItineraryChange(
                                      dIndex,
                                      "day",
                                      e.target.value
                                    )
                                  }
                                  className="mb-3 w-40 text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--admin-primary-ring)]/20 focus:border-[var(--admin-primary-border)] outline-none transition-all"
                                />
                                <label className="block text-sm font-semibold text-gray-600 mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  placeholder="Add Title"
                                  value={day.title}
                                  onChange={(e) =>
                                    handleItineraryChange(
                                      dIndex,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full text-base font-semibold text-gray-900 border-b border-gray-200 focus:border-[var(--admin-primary-border)] outline-none pb-1 placeholder-gray-300 transition-colors ${
                                    errors[`itinerary_${dIndex}_title`]
                                      ? "border-red-300"
                                      : ""
                                  }`}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenItineraryItems((prev) => ({
                                      ...prev,
                                      [day.id]: !prev[day.id],
                                    }))
                                  }
                                  className={itemChevronToggleClass}
                                  title={
                                    openItineraryItems[day.id] ? "Collapse" : "Expand"
                                  }
                                >
                                  {openItineraryItems[day.id] ? (
                                    <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItineraryDay(dIndex)}
                                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {openItineraryItems[day.id] && (
                              <>
                            <div className="pl-0 sm:pl-24 mb-20">
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
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-600 block">
                                  Day Images (optional)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveItineraryIndex(dIndex);
                                    setItineraryImageModalOpen(true);
                                  }}
                                  className="text-xs font-semibold text-[var(--admin-primary)] bg-[var(--admin-primary-soft)] px-3 py-1.5 rounded-lg hover:bg-[var(--admin-primary-soft-strong)]"
                                >
                                  Add Image
                                </button>
                              </div>
                              {Array.isArray(day.images) && day.images.length > 0 ? (
                                <div className="space-y-3">
                                  {day.images.map((image, imageIndex) => (
                                    <div
                                      key={`${image.mediaId || image.url}-${imageIndex}`}
                                      className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                                    >
                                      <div className="flex items-start gap-3">
                                        <img
                                          src={image.variants?.thumbnail || image.url}
                                          alt={image.altText || image.title || "Day image"}
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                        />
                                        <div className="flex-1 space-y-2">
                                          <input
                                            type="text"
                                            value={image.caption || ""}
                                            onChange={(e) =>
                                              updateItineraryImage(dIndex, imageIndex, {
                                                caption: e.target.value,
                                              })
                                            }
                                            placeholder="Caption (optional)"
                                            className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg p-2"
                                          />
                                          <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-600">
                                              Size
                                            </label>
                                            <select
                                              value={String(image.sizePercent || 100)}
                                              onChange={(e) =>
                                                updateItineraryImage(dIndex, imageIndex, {
                                                  sizePercent: Number(e.target.value),
                                                })
                                              }
                                              className="text-xs border border-gray-200 rounded-md p-1 bg-white"
                                            >
                                              <option value="25">25%</option>
                                              <option value="50">50%</option>
                                              <option value="75">75%</option>
                                              <option value="100">100%</option>
                                            </select>
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              moveItineraryImage(dIndex, imageIndex, -1)
                                            }
                                            className="p-1 border border-gray-200 rounded text-gray-600 hover:bg-white disabled:opacity-40"
                                            disabled={imageIndex === 0}
                                            aria-label="Move image up"
                                          >
                                            <ChevronUp className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              moveItineraryImage(dIndex, imageIndex, 1)
                                            }
                                            className="p-1 border border-gray-200 rounded text-gray-600 hover:bg-white disabled:opacity-40"
                                            disabled={imageIndex === day.images.length - 1}
                                            aria-label="Move image down"
                                          >
                                            <ChevronDown className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeItineraryImage(dIndex, imageIndex)
                                            }
                                            className="p-1 border border-red-200 rounded text-red-500 hover:bg-red-50"
                                            aria-label="Remove image"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400">
                                  No images selected yet.
                                </p>
                              )}
                            </div>

                            <div className="pl-0 sm:pl-24 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                                  Drive Time / Duration
                                </label>
                                <input
                                  type="text"
                                  value={day.driveTime || ""}
                                  onChange={(e) =>
                                    handleItineraryChange(dIndex, "driveTime", e.target.value)
                                  }
                                  placeholder="e.g., 6-7 hrs drive"
                                  className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] focus:border-[var(--admin-primary-border)] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2 block">
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
                                  className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] focus:border-[var(--admin-primary-border)] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                                  Meal
                                </label>
                                <input
                                  type="text"
                                  value={day.meal || ""}
                                  onChange={(e) =>
                                    handleItineraryChange(
                                      dIndex,
                                      "meal",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Breakfast"
                                  className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] focus:border-[var(--admin-primary-border)] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                                  Elevation
                                </label>
                                <input
                                  type="text"
                                  value={day.elevation || ""}
                                  onChange={(e) =>
                                    handleItineraryChange(
                                      dIndex,
                                      "elevation",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., 3656m"
                                  className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] focus:border-[var(--admin-primary-border)] outline-none"
                                />
                              </div>
                            </div>

                            <div className="pl-0 sm:pl-24 space-y-3">
                              <label className="text-xs font-semibold text-gray-600 block">
                                Activities (Optional)
                              </label>
                              {day.activities.map((activity, aIndex) => (
                                <div key={aIndex} className="flex items-start gap-3">
                                  <CheckCircle2 className="w-4 h-4 text-[var(--admin-primary)] mt-2.5 shrink-0" />
                                  <div className="flex-1">
                                    <textarea
                                      value={activity}
                                      onChange={(e) =>
                                        handleActivityChange(
                                          dIndex,
                                          aIndex,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Describe activity..."
                                      rows={1}
                                      className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] focus:border-[var(--admin-primary-border)] outline-none resize-none overflow-hidden"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeActivity(dIndex, aIndex)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                    disabled={day.activities.length === 1}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addActivity(dIndex)}
                                className="text-sm font-semibold text-[var(--admin-primary)] hover:text-[var(--admin-primary-strong)] hover:underline decoration-[var(--admin-primary-soft-strong)] underline-offset-4 flex items-center gap-1 mt-2"
                              >
                                <Plus className="w-3 h-3" /> Add another activity
                              </button>
                            </div>
                              </>
                            )}

                          </div>
                            </div>
                          )}
                        </SortableItineraryCard>
                      ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={addItineraryDay}
                    className="group flex items-center gap-2 px-4 py-2 bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] rounded-lg hover:bg-[var(--admin-primary)] hover:text-white transition-all font-semibold text-sm"
                  >
                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    Add Day
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIncludedExcludedOpen((prev) => !prev)}
                className="text-lg font-bold text-gray-900 flex items-center gap-2"
              >
                Included / Excluded Sections
              </button>
              <button
                type="button"
                onClick={() => setIncludedExcludedOpen((prev) => !prev)}
                aria-label={
                  includedExcludedOpen
                    ? "Collapse included and excluded section"
                    : "Expand included and excluded section"
                }
                className="h-10 w-10 rounded-xl border-2 border-gray-300 bg-white text-gray-700 flex items-center justify-center shadow-sm hover:border-gray-500 hover:text-gray-900 transition-colors"
              >
                {includedExcludedOpen ? (
                  <ChevronUp className="w-6 h-6 stroke-[2.75]" />
                ) : (
                  <ChevronDown className="w-6 h-6 stroke-[2.75]" />
                )}
              </button>
            </div>
            {!includedExcludedOpen && (
              <p className="text-sm text-gray-500">
                {formData.customSections.filter((section) => section.type === "list")
                  .length > 0
                  ? "Click the arrow next to the title to update included/excluded sections."
                  : "Click the arrow next to the title to add included/excluded sections."}
              </p>
            )}

            {includedExcludedOpen && (
              <div className="space-y-6">
                {formData.customSections
                  .map((section, sIndex) => ({ section, sIndex }))
                  .filter(({ section }) => section.type === "list")
                  .map(({ section, sIndex }) => (
                    <div
                      key={section.id}
                      className="p-5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="flex-1">
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
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenIncludedExcludedItems((prev) => ({
                                ...prev,
                                [section.id]: !prev[section.id],
                              }))
                            }
                            className={itemChevronToggleClass}
                            title={
                              openIncludedExcludedItems[section.id]
                                ? "Collapse"
                                : "Expand"
                            }
                          >
                            {openIncludedExcludedItems[section.id] ? (
                              <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                            ) : (
                              <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCustomSection(sIndex)}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {openIncludedExcludedItems[section.id] && (
                        <>
                      <div className="mb-20">
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          Note
                        </label>
                        <RichEditor
                          value={section.note || ""}
                          onChange={(value) =>
                            handleCustomSectionChange(sIndex, "note", value)
                          }
                          height="h-40"
                        />
                      </div>

                      <div className="mb-20">
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
                          height="h-44"
                        />
                      </div>
                        </>
                      )}
                    </div>
                  ))}
                {formData.customSections.filter(
                  (section) => section.type === "list"
                ).length === 0 && (
                  <div className="text-center py-8 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-400 text-sm">
                      Add your includes or excludes note and description here.
                    </p>
                  </div>
                )}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={addIncludedSection}
                    className="text-sm px-4 py-2 bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] rounded-lg font-semibold hover:bg-[var(--admin-primary-soft-strong)] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Section
                  </button>
                </div>
              </div>
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
                <AlertCircle size={18} className="text-[var(--admin-primary)]" />
                Frequently Asked Questions
              </button>
              <button
                type="button"
                onClick={() => setFaqOpen((prev) => !prev)}
                aria-label={faqOpen ? "Collapse FAQ section" : "Expand FAQ section"}
                className="h-10 w-10 rounded-xl border-2 border-gray-300 bg-white text-gray-700 flex items-center justify-center shadow-sm hover:border-gray-500 hover:text-gray-900 transition-colors"
              >
                {faqOpen ? (
                  <ChevronUp className="w-6 h-6 stroke-[2.75]" />
                ) : (
                  <ChevronDown className="w-6 h-6 stroke-[2.75]" />
                )}
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
                      <div className="space-y-4">
                        {formData.faq.map((faq, index) => (
                          <SortableFaqCard key={faq.id} id={faq.id}>
                            {({ attributes, listeners }) => (
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between mb-3">
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
                                      {faq.question?.trim()
                                        ? faq.question
                                        : `FAQ #${index + 1}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenFaqItems((prev) => ({
                                          ...prev,
                                          [faq.id]: !prev[faq.id],
                                        }))
                                      }
                                      className={itemChevronToggleClass}
                                      title={openFaqItems[faq.id] ? "Collapse" : "Expand"}
                                    >
                                      {openFaqItems[faq.id] ? (
                                        <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeFaq(index)}
                                      className="text-red-500 hover:text-red-700 transition-colors"
                                      title="Remove FAQ"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>

                                {openFaqItems[faq.id] && (
                                  <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
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
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--admin-primary-ring)] focus:border-transparent transition-all"
                                    />
                                  </div>

                                  <div className="mb-20">
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                      Answer
                                    </label>
                                    <RichEditor
                                      value={faq.answer}
                                      onChange={(value) =>
                                        handleFaqChange(index, "answer", value)
                                      }
                                      height="h-44"
                                    />
                                  </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </SortableFaqCard>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <AlertCircle size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No FAQs added yet. Click "Add FAQ" to create one.
                    </p>
                  </div>
                )}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={addFaq}
                    className="px-3 py-1.5 bg-[var(--admin-primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--admin-primary-strong)] transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Add FAQ
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setAdditionalInfoOpen((prev) => !prev)}
                className="text-lg font-bold text-gray-900 flex items-center gap-2"
              >
                Additional Info Sections
              </button>
              <button
                type="button"
                onClick={() => setAdditionalInfoOpen((prev) => !prev)}
                aria-label={
                  additionalInfoOpen
                    ? "Collapse additional info section"
                    : "Expand additional info section"
                }
                className="h-10 w-10 rounded-xl border-2 border-gray-300 bg-white text-gray-700 flex items-center justify-center shadow-sm hover:border-gray-500 hover:text-gray-900 transition-colors"
              >
                {additionalInfoOpen ? (
                  <ChevronUp className="w-6 h-6 stroke-[2.75]" />
                ) : (
                  <ChevronDown className="w-6 h-6 stroke-[2.75]" />
                )}
              </button>
            </div>
            {!additionalInfoOpen && (
              <p className="text-sm text-gray-500">
                {formData.customSections.filter(
                  (section) => section.type === "paragraph"
                ).length > 0
                  ? "Click the arrow next to the title to update additional info sections."
                  : "Click the arrow next to the title to add additional info sections."}
              </p>
            )}

            {additionalInfoOpen && (
              <div className="space-y-6">
                {formData.customSections.filter(
                  (section) => section.type === "paragraph"
                ).length === 0 && (
                  <div className="text-center py-8 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-400 text-sm">
                      Add an extra info section here.
                    </p>
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
                                <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300">
                                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] outline-none"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setOpenAdditionalInfoItems((prev) => ({
                                            ...prev,
                                            [section.id]: !prev[section.id],
                                          }))
                                        }
                                        className={itemChevronToggleClass}
                                        title={
                                          openAdditionalInfoItems[section.id]
                                            ? "Collapse"
                                            : "Expand"
                                        }
                                      >
                                        {openAdditionalInfoItems[section.id] ? (
                                          <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                                        ) : (
                                          <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeCustomSection(sIndex)}
                                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>

                                  {openAdditionalInfoItems[section.id] && (
                                    <div className="mb-20">
                                    <RichEditor
                                      value={section.content[0] || ""}
                                      onChange={(value) =>
                                        handleCustomSectionItemChange(sIndex, 0, value)
                                      }
                                      height="h-44"
                                    />
                                    </div>
                                  )}
                                </div>
                              )}
                            </SortableFaqCard>
                          ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={addCustomTextSection}
                    className="text-sm px-4 py-2 bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] rounded-lg font-semibold hover:bg-[var(--admin-primary-soft-strong)] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Section
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setTravelInfoOpen((prev) => !prev)}
                className="text-lg font-bold text-gray-900 flex items-center gap-2"
              >
                Travel Info
              </button>
              <button
                type="button"
                onClick={() => setTravelInfoOpen((prev) => !prev)}
                aria-label={
                  travelInfoOpen
                    ? "Collapse travel info section"
                    : "Expand travel info section"
                }
                className="h-10 w-10 rounded-xl border-2 border-gray-300 bg-white text-gray-700 flex items-center justify-center shadow-sm hover:border-gray-500 hover:text-gray-900 transition-colors"
              >
                {travelInfoOpen ? (
                  <ChevronUp className="w-6 h-6 stroke-[2.75]" />
                ) : (
                  <ChevronDown className="w-6 h-6 stroke-[2.75]" />
                )}
              </button>
            </div>
            {!travelInfoOpen && (
              <p className="text-sm text-gray-500">
                {formData.customSections.filter((section) => section.type === "travelInfo")
                  .length > 0
                  ? "Click the arrow next to the title to update travel info."
                  : "Click the arrow next to the title to add travel info."}
              </p>
            )}

            {travelInfoOpen && (
              <div className="space-y-6">
                {formData.customSections.filter((section) => section.type === "travelInfo")
                  .length === 0 && (
                  <div className="text-center py-8 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-400 text-sm">
                      Add a travel info section here.
                    </p>
                  </div>
                )}

                {formData.customSections.filter((section) => section.type === "travelInfo")
                  .length > 0 && (
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleTravelInfoDragEnd}
                  >
                    <SortableContext
                      items={formData.customSections
                        .filter((section) => section.type === "travelInfo")
                        .map((section) => section.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-6">
                        {formData.customSections
                          .map((section, sIndex) => ({ section, sIndex }))
                          .filter(({ section }) => section.type === "travelInfo")
                          .map(({ section, sIndex }) => (
                            <SortableFaqCard key={section.id} id={section.id}>
                              {({ attributes, listeners }) => (
                                <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300">
                                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                                        placeholder="Travel info title"
                                        value={section.title}
                                        onChange={(e) =>
                                          handleCustomSectionChange(
                                            sIndex,
                                            "title",
                                            e.target.value
                                          )
                                        }
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] outline-none"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setOpenTravelInfoItems((prev) => ({
                                            ...prev,
                                            [section.id]: !prev[section.id],
                                          }))
                                        }
                                        className={itemChevronToggleClass}
                                        title={
                                          openTravelInfoItems[section.id]
                                            ? "Collapse"
                                            : "Expand"
                                        }
                                      >
                                        {openTravelInfoItems[section.id] ? (
                                          <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                                        ) : (
                                          <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeCustomSection(sIndex)}
                                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>

                                  {openTravelInfoItems[section.id] && (
                                    <div className="mb-20">
                                      <RichEditor
                                        value={section.content[0] || ""}
                                        onChange={(value) =>
                                          handleCustomSectionItemChange(sIndex, 0, value)
                                        }
                                        height="h-44"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </SortableFaqCard>
                          ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={addTravelInfoSection}
                    className="text-sm px-4 py-2 bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] rounded-lg font-semibold hover:bg-[var(--admin-primary-soft-strong)] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Travel Info
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIconLucide className="w-5 h-5 text-[var(--admin-primary)]" />
              Cover Image
            </h3>
            <div
              className={`relative group ${
                errors.mainImage ? "ring-2 ring-red-500 rounded-xl" : ""
              }`}
            >
              {!formData.mainImage ? (
                <button
                  type="button"
                  onClick={() => setMainImageModalOpen(true)}
                  className="w-full flex flex-col items-center justify-center h-52 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-[var(--admin-primary-border)] transition-all duration-300"
                >
                  <div className="bg-[var(--admin-primary-soft)] p-3 rounded-full mb-3 text-[var(--admin-primary)]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    Choose Cover Image
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Select from Media Library or upload new
                  </span>
                </button>
              ) : (
                <div className="relative h-52 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={
                      formData.mainImage.variants?.medium ||
                      formData.mainImage.url
                    }
                    alt="Cover"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setMainImageModalOpen(true)}
                        className="bg-white/90 text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={removeMainImage}
                        className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] outline-none"
                />
              </div>
            )}
            {errors.mainImage && (
              <p className="mt-2 text-xs text-red-600 font-medium">
                {errors.mainImage}
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Gallery</h3>
              <button
                type="button"
                onClick={() => setGalleryModalOpen(true)}
                className="text-xs font-bold text-[var(--admin-primary)] bg-[var(--admin-primary-soft)] px-3 py-1.5 rounded-lg hover:bg-[var(--admin-primary-soft-strong)] transition-colors"
              >
                + Add Photos
              </button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleGalleryDragEnd}
            >
              <SortableContext
                items={formData.imageGallary.map((img, index) =>
                  getGalleryImageId(img, index)
                )}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-3 gap-3">
                  {formData.imageGallary.map((img, index) => (
                    <SortableGalleryImage
                      key={getGalleryImageId(img, index)}
                      id={getGalleryImageId(img, index)}
                      image={img}
                      index={index}
                      onRemove={removeGalleryImage}
                    />
                  ))}
                  {formData.imageGallary.length === 0 && (
                    <div className="col-span-3 h-24 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs font-medium">
                      No images added
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
            {formData.imageGallary.length > 1 && (
              <p className="mt-3 text-xs text-gray-500">
                Drag images by the handle to change gallery order.
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">
              Trip Facts
            </h3>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Duration
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className={`w-full pl-9 p-2.5 bg-gray-50 border rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] ${
                    errors.duration ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Ex: 12 Days"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Total Cost
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  className={`w-full pl-9 p-2.5 bg-gray-50 border rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] ${
                    errors.cost ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Ex: 1400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Trip Type/Level
              </label>
              <input
                type="text"
                name="trip_type_level"
                value={formData.trip_type_level}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)]"
                placeholder="Ex: Adventure / Moderate"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Trip Attractions
              </label>
              <input
                type="text"
                name="trip_attractions"
                value={formData.trip_attractions}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)]"
                placeholder="Ex: Kathmandu, Pokhara, Chitwan"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Trip Max Elevation
              </label>
              <input
                type="text"
                name="trip_max_elevation"
                value={formData.trip_max_elevation}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)]"
                placeholder="Ex: 5364m"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Trip Best Season
              </label>
              <input
                type="text"
                name="trip_best_season"
                value={formData.trip_best_season}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)]"
                placeholder="Ex: Mar-May, Sep-Nov"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Trip Meals
              </label>
              <input
                type="text"
                name="trip_meals"
                value={formData.trip_meals}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)]"
                placeholder="Ex: Breakfast, Lunch, Dinner"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Trip Accommodation
              </label>
              <input
                type="text"
                name="trip_accommodation"
                value={formData.trip_accommodation}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)]"
                placeholder="Ex: 3-star hotels"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Trip Transportations
              </label>
              <input
                type="text"
                name="trip_transportations"
                value={formData.trip_transportations}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)]"
                placeholder="Ex: Private vehicle, Flight"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Difficulty
                </label>
                <div className="relative">
                  <select
                    name="tour_type"
                    value={formData.tour_type}
                    onChange={handleChange}
                    className="w-full pr-9 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none cursor-pointer appearance-none"
                  >
                    <option>Easy</option>
                    <option>Moderate</option>
                    <option>Challenging</option>
                    <option>Strenuous</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Rating
                </label>
                <div className="relative">
                  <Star className="absolute left-2.5 top-2.5 text-yellow-500 w-4 h-4 fill-yellow-500" />
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="w-full pl-8 pr-9 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none cursor-pointer appearance-none"
                  >
                    <option>Good</option>
                    <option>Very Good</option>
                    <option>Excellent</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
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
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--admin-primary-ring)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-primary)]"></div>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-gray-700 block group-hover:text-[var(--admin-primary)] transition-colors">
                    Show Booking Form
                  </span>
                  <span className="text-xs text-gray-500">
                    Display "Ask to Expert" booking form on public page
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Tags & SEO */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">SEO & Tags</h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                value={tempTag}
                onChange={(e) => setTempTag(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type tag & hit enter..."
                className="flex-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] outline-none"
              />
              <button
                onClick={addTag}
                className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors w-full sm:w-auto"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)] px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-[var(--admin-primary-soft-strong)]"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {formData.tags.length === 0 && (
                <span className="text-xs text-gray-400 italic">
                  No tags added yet.
                </span>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
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
                  placeholder="SEO title for this package"
                  className={`w-full p-2.5 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] outline-none ${
                    errors.meta_title ? "border-red-500" : "border-gray-200"
                  }`}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
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
                  placeholder="Short SEO description"
                  rows={3}
                  className={`w-full p-2.5 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-[var(--admin-primary-soft-strong)] outline-none ${
                    errors.meta_description ? "border-red-500" : "border-gray-200"
                  }`}
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
        multiple
      />
      <MediaPickerModal
        open={overviewImageModalOpen}
        onOpenChange={setOverviewImageModalOpen}
        onSelect={handleOverviewImageSelect}
        title="Select Overview Image"
      />
      <MediaPickerModal
        open={itineraryImageModalOpen}
        onOpenChange={setItineraryImageModalOpen}
        onSelect={handleItineraryImageSelect}
        title="Select Day Image"
      />
    </div>
  );
};

export default CreatePackage;
