"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
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
import toast, { Toaster } from "react-hot-toast";
import {
  ImagePlus,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Copy,
} from "lucide-react";
import RichEditor from "@/components/editor/RichEditor";
import MediaPickerModal from "@/components/media/MediaPickerModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

const MODULE_TYPES = [
  { type: "pageBanner", label: "Page Banner", hint: "Top banner image" },
  { type: "team", label: "Team", hint: "Founder + members" },
  { type: "packages", label: "Packages", hint: "Package list block" },
  {
    type: "repeatableTextImage",
    label: "Repeatable Text/Image",
    hint: "Can be added multiple times",
  },
  { type: "gallery", label: "Gallery", hint: "Image gallery" },
  {
    type: "relatedInformation",
    label: "Related Information",
    hint: "Tabbed information block",
  },
  { type: "faq", label: "FAQ", hint: "Questions and answers" },
  { type: "bookingForm", label: "Booking Form", hint: "Show booking form" },
];

const MODULE_LABELS = MODULE_TYPES.reduce((acc, item) => {
  acc[item.type] = item.label;
  return acc;
}, {});

const initialFormData = {
  section: "",
  slug: "",
  status: true,
  title: "",
  subtitle: "",
  description: "",
  coverImage: null,
  coverImagePosition: "none",
  category: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
};

const normalizeMedia = (media) => {
  if (!media) return null;
  if (typeof media === "string") {
    return { mediaId: null, url: media, variants: {}, title: "", altText: "" };
  }
  return media;
};

const normalizeSectionData = (section) => {
  const type = section?.type;
  const data = section?.data || {};

  if (type === "pageBanner") {
    return { pageBannerImage: data.pageBannerImage ?? null };
  }

  if (type === "team") {
    return {
      teamSectionTitle: data.teamSectionTitle || "",
      founderTitle: data.founderTitle || "",
      founderDetails: data.founderDetails || "",
      founderCtaLabel: data.founderCtaLabel || "",
      founderCtaLink: data.founderCtaLink || "",
      selectedTeamMembers: Array.isArray(data.selectedTeamMembers)
        ? data.selectedTeamMembers.map(String)
        : [],
    };
  }

  if (type === "packages") {
    return {
      packagesSectionTitle: data.packagesSectionTitle || "",
      packagesSectionSubtitle: data.packagesSectionSubtitle || "",
      packagesSectionDescription: data.packagesSectionDescription || "",
      packagesSectionPackageIds: Array.isArray(data.packagesSectionPackageIds)
        ? data.packagesSectionPackageIds.map(String)
        : [],
    };
  }

  if (type === "repeatableTextImage") {
    return {
      items: Array.isArray(data.items)
        ? data.items.map((item, index) => ({
            id: item?.id || `${Date.now()}-${index}`,
            title: item?.title || "",
            description: item?.description || "",
            image: item?.image || "",
            imageCaption: item?.imageCaption || "",
            background: item?.background === "light" ? "light" : "white",
            imagePosition: ["left-25", "left-50", "right-25", "right-50"].includes(item?.imagePosition)
              ? item.imagePosition
              : item?.imagePosition === "right"
              ? "right-25"
              : "left-25",
          }))
        : [],
    };
  }

  if (type === "gallery") {
    return {
      galleryImages: (Array.isArray(data.galleryImages) ? data.galleryImages : [])
        .map((img) => normalizeMedia(img))
        .filter(Boolean),
    };
  }

  if (type === "relatedInformation") {
    return {
      items: Array.isArray(data.items)
        ? data.items.map((item, index) => ({
            id: item?.id || `${Date.now()}-${index}`,
            title: item?.title || "",
            description: item?.description || "",
          }))
        : [],
    };
  }

  if (type === "faq") {
    return {
      faqSectionTitle: data.faqSectionTitle || "",
      items: Array.isArray(data.items)
        ? data.items.map((item, index) => ({
            id: item?.id || `${Date.now()}-${index}`,
            question: item?.question || "",
            answer: item?.answer || "",
          }))
        : [],
    };
  }

  if (type === "bookingForm") {
    return {
      showBookingForm: !!data.showBookingForm,
    };
  }

  return data || {};
};

const normalizeSection = (section) => ({
  ...section,
  data: normalizeSectionData(section),
  is_enabled: section?.is_enabled !== false,
});

const itemChevronToggleClass =
  "h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center justify-center transition-colors";

const SortableSectionCard = ({
  section,
  index,
  isOpen,
  onToggle,
  onRemove,
  onChange,
  onSelectImage,
  onRemoveImage,
  labelClass,
  inputClass,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
            aria-label="Drag to reorder section"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {section.title || `Section ${index + 1}`}
            </p>
            {!section.title && <p className="text-xs text-gray-400">Untitled</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggle} className={itemChevronToggleClass}>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
          <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Section Title</label>
              <input
                type="text"
                value={section.title}
                onChange={(e) => onChange("title", e.target.value)}
                className={inputClass}
                placeholder="Section title"
              />
            </div>
            <div>
              <label className={labelClass}>Background</label>
              <select
                value={section.background}
                onChange={(e) => onChange("background", e.target.value)}
                className={inputClass}
              >
                <option value="white">White</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <label className={labelClass}>Description</label>
              <RichEditor
                value={section.description}
                onChange={(value) => onChange("description", value)}
                height="h-60"
                className="mb-20"
              />
            </div>
            <div>
              <label className={labelClass}>Image</label>
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                {section.image ? (
                  <img
                    src={section.image.variants?.thumbnail || section.image.url || section.image}
                    alt="Section"
                    className="w-full h-32 object-contain rounded"
                  />
                ) : (
                  <p className="text-sm text-gray-500">No image selected</p>
                )}
                <div className={`mt-3 grid gap-2 ${section.image ? "grid-cols-2" : "grid-cols-1"}`}>
                  <button
                    type="button"
                    onClick={onSelectImage}
                    className="w-full border border-gray-200 rounded-md py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Select Image
                  </button>
                  {section.image && (
                    <button
                      type="button"
                      onClick={onRemoveImage}
                      className="w-full border border-gray-200 rounded-md py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass}>Image Position</label>
                <select
                  value={section.imagePosition}
                  onChange={(e) => onChange("imagePosition", e.target.value)}
                  className={inputClass}
                >
                  <option value="left-25">Left 25%</option>
                  <option value="left-50">Left 50%</option>
                  <option value="right-25">Right 25%</option>
                  <option value="right-50">Right 50%</option>
                </select>
              </div>
              <div className="mt-4">
                <label className={labelClass}>Image Caption</label>
                <input
                  type="text"
                  value={section.imageCaption}
                  onChange={(e) => onChange("imageCaption", e.target.value)}
                  className={inputClass}
                  placeholder="Image caption"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SortableRelatedInfoCard = ({ item, index, isOpen, onToggle, onRemove, onChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-gray-500">
            {item.title?.trim() ? item.title : `Information ${index + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggle} className={itemChevronToggleClass}>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
          <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Information Title</label>
            <input
              type="text"
              value={item.title}
              onChange={(e) => onChange("title", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              placeholder="Enter title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Information Description
            </label>
            <RichEditor
              value={item.description}
              onChange={(value) => onChange("description", value)}
              height="h-60"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const SortableFaqCard = ({ item, index, isOpen, onToggle, onRemove, onChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-gray-500">
            {item.question?.trim() ? item.question : `FAQ ${index + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggle} className={itemChevronToggleClass}>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
          <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
            <input
              type="text"
              value={item.question}
              onChange={(e) => onChange("question", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              placeholder="Enter your question"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Answer</label>
            <RichEditor
              value={item.answer}
              onChange={(value) => onChange("answer", value)}
              height="h-60"
            />
          </div>
        </div>
      )}
    </div>
  );
};

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
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="line-clamp-1">{title}</span>
      </div>
      <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-500">
        Remove
      </button>
    </div>
  );
};

const SortableModuleCard = ({
  section,
  isOpen,
  onToggle,
  onToggleEnabled,
  onDuplicate,
  onDelete,
  onSave,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {MODULE_LABELS[section.type] || section.type}
            </p>
            <p className="text-xs text-gray-400 truncate">{section.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={section.is_enabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`px-2 py-1 text-xs rounded-md ${
                section.is_enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {section.is_enabled ? "Enabled" : "Disabled"}
            </span>
          </label>
          <button type="button" onClick={onDuplicate} className="text-gray-400 hover:text-gray-600">
            <Copy className="w-4 h-4" />
          </button>
          <button type="button" onClick={onDelete} className="text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={onToggle} className={itemChevronToggleClass}>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          {children}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              className="px-3 py-1.5 rounded-md bg-[var(--admin-primary)] text-white text-sm"
            >
              Save Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CmsAdminPage = () => {
  const getToken = () =>
    Cookies.get("accessToken") ||
    Cookies.get("token") ||
    localStorage.getItem("admin_token") ||
    sessionStorage.getItem("admin_token");

  const [formData, setFormData] = useState(initialFormData);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editPageId, setEditPageId] = useState(null);
  const [editPageDbId, setEditPageDbId] = useState(null);
  const [pages, setPages] = useState([]);
  const [sortedPages, setSortedPages] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [packageOptions, setPackageOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [openModules, setOpenModules] = useState({});
  const [openRepeatableItems, setOpenRepeatableItems] = useState({});
  const [openRelatedItems, setOpenRelatedItems] = useState({});
  const [openFaqItems, setOpenFaqItems] = useState({});
  const [packagesSelectBySection, setPackagesSelectBySection] = useState({});

  const [coverImageModalOpen, setCoverImageModalOpen] = useState(false);
  const [sectionMediaModalOpen, setSectionMediaModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null);
  const [galleryTargetSectionId, setGalleryTargetSectionId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const slugify = (value) => {
    if (!value) return "";
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

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

  const inputClass =
    "w-full p-2 border border-gray-300 rounded focus:ring-[var(--admin-primary-ring)] focus:border-[var(--admin-primary-border)]";
  const selectClass =
    "w-full p-2 border border-gray-300 rounded bg-white pr-10 shadow-sm focus:ring-2 focus:ring-[var(--admin-primary-ring)] focus:border-[var(--admin-primary-border)] appearance-none";
  const labelClass = "block text-sm font-medium text-gray-700 mt-4";

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/category/`);
      const raw = response.data.data || [];
      const sorted = [...raw].sort((a, b) => {
        const aOrder = Number(a.sort_order) || 0;
        const bOrder = Number(b.sort_order) || 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
      setCategories(sorted);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchCmsPages = useCallback(async () => {
    setListLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get(`${BASE_URL}/cms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = response.data.data || [];
      setPages(list);
      setSortedPages(list);
    } catch {
      setPages([]);
      setSortedPages([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/team/`);
      const members =
        response.data?.teams || response.data?.data || response.data || [];
      setTeamMembers(Array.isArray(members) ? members : []);
    } catch {
      setTeamMembers([]);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
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
    } catch {
      setPackageOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchCmsPages();
    fetchTeamMembers();
    fetchPackages();
  }, [fetchCategories, fetchCmsPages, fetchTeamMembers, fetchPackages]);

  const fetchPageSections = useCallback(async (pageId) => {
    const token = getToken();
    if (!token || !pageId) return [];

    const response = await axios.get(`${BASE_URL}/cms/${pageId}/sections`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const list = response.data?.data || [];
    return list.map(normalizeSection);
  }, []);

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

  const handleCancelEdit = () => {
    setEditPageId(null);
    setEditPageDbId(null);
    setFormData(initialFormData);
    setSections([]);
    setOpenModules({});
    setOpenRepeatableItems({});
    setOpenRelatedItems({});
    setOpenFaqItems({});
  };

  const handleEdit = async (pageData) => {
    setEditPageId(pageData.section);
    setEditPageDbId(pageData.id || pageData._id || null);

    setFormData({
      section: pageData.section || "",
      slug: pageData.slug || "",
      status: pageData.status || false,
      title: pageData.content?.title || "",
      subtitle: pageData.content?.subtitle || "",
      description: pageData.content?.description || "",
      coverImage: normalizeMedia(pageData.content?.coverImage),
      coverImagePosition: pageData.content?.coverImagePosition || "none",
      category: pageData.categoryId != null ? String(pageData.categoryId) : "",
      meta_title: pageData.meta_title || "",
      meta_description: pageData.meta_description || "",
      meta_keywords: pageData.meta_keywords || "",
    });

    try {
      const sectionRows = await fetchPageSections(pageData.id || pageData._id);
      setSections(sectionRows);
      setOpenModules(
        sectionRows.reduce((acc, section) => {
          acc[section.id] = false;
          return acc;
        }, {})
      );
    } catch {
      setSections([]);
    }

    const scrollContainer = document.getElementById("admin-scroll-area");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const updateSectionDataLocal = (sectionId, updater) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              data: typeof updater === "function" ? updater(section.data || {}) : updater,
            }
          : section
      )
    );
  };

  const saveSection = async (sectionId) => {
    const token = getToken();
    if (!token) {
      toast.error("Authentication token not found.");
      return;
    }

    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;

    try {
      await axios.put(
        `${BASE_URL}/cms/sections/${sectionId}`,
        { data: section.data || {} },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Section saved");
    } catch {
      toast.error("Failed to save section");
    }
  };

  const addSection = async (type) => {
    if (!editPageDbId) {
      toast.error("Save the page first, then add modules.");
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error("Authentication token not found.");
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/cms/${editPageDbId}/sections`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const created = normalizeSection(response.data?.data);
      setSections((prev) => [...prev, created]);
      setOpenModules((prev) => ({ ...prev, [created.id]: true }));
      toast.success(`${MODULE_LABELS[type]} added`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add module");
    }
  };

  const toggleSectionEnabled = async (sectionId, isEnabled) => {
    if (!isEnabled) {
      const confirmed = window.confirm(
        "Disabling will delete this section. Continue?"
      );
      if (!confirmed) return;
      await deleteSection(sectionId);
      return;
    }

    const token = getToken();
    if (!token) return;

    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, is_enabled: true } : section
      )
    );

    try {
      await axios.patch(
        `${BASE_URL}/cms/sections/${sectionId}/toggle`,
        { is_enabled: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      toast.error("Failed to toggle section");
    }
  };

  const duplicateSection = async (sectionId) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await axios.post(
        `${BASE_URL}/cms/sections/${sectionId}/duplicate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const duplicated = normalizeSection(response.data?.data);
      setSections((prev) => {
        const sourceIndex = prev.findIndex((section) => section.id === sectionId);
        if (sourceIndex === -1) return [...prev, duplicated];
        const next = [...prev];
        next.splice(sourceIndex + 1, 0, duplicated);
        return next;
      });
      setOpenModules((prev) => ({ ...prev, [duplicated.id]: true }));
      toast.success("Section duplicated");
    } catch {
      toast.error("Failed to duplicate section");
    }
  };

  const deleteSection = async (sectionId) => {
    const token = getToken();
    if (!token) return;

    try {
      await axios.delete(`${BASE_URL}/cms/sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections((prev) => prev.filter((section) => section.id !== sectionId));
      setOpenModules((prev) => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
      toast.success("Section deleted");
    } catch {
      toast.error("Failed to delete section");
    }
  };

  const handleSectionsDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let nextSections = [];
    setSections((prev) => {
      const oldIndex = prev.findIndex((section) => section.id === active.id);
      const newIndex = prev.findIndex((section) => section.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      nextSections = arrayMove(prev, oldIndex, newIndex);
      return nextSections;
    });

    if (!editPageDbId || !nextSections.length) return;

    const token = getToken();
    if (!token) return;

    try {
      await axios.post(
        `${BASE_URL}/cms/${editPageDbId}/sections/reorder`,
        { orderedSectionIds: nextSections.map((section) => section.id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      toast.error("Failed to reorder sections");
    }
  };

  const handleCoverImageSelect = (media) => {
    setFormData((prev) => ({
      ...prev,
      coverImage: media,
    }));
  };

  const handleSectionMediaSelect = (media) => {
    if (!mediaTarget?.sectionId) return;

    if (mediaTarget.kind === "pageBannerImage") {
      updateSectionDataLocal(mediaTarget.sectionId, (data) => ({
        ...data,
        pageBannerImage: media,
      }));
      return;
    }

    if (mediaTarget.kind === "repeatableItemImage") {
      updateSectionDataLocal(mediaTarget.sectionId, (data) => ({
        ...data,
        items: (data.items || []).map((item) =>
          item.id === mediaTarget.itemId ? { ...item, image: media } : item
        ),
      }));
    }
  };

  const handleGalleryMediaSelect = (media) => {
    if (!galleryTargetSectionId) return;

    updateSectionDataLocal(galleryTargetSectionId, (data) => {
      const current = Array.isArray(data.galleryImages) ? data.galleryImages : [];
      const existingIds = new Set(
        current.map((img) => String(img?.mediaId || img?.url || ""))
      );
      const key = String(media?.mediaId || media?.url || "");
      if (existingIds.has(key)) return data;
      return {
        ...data,
        galleryImages: [...current, media],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      section: formData.section,
      slug: formData.slug?.trim() || undefined,
      status: formData.status,
      categoryId: formData.category?.trim() || "",
      meta_title: formData.meta_title?.trim() || undefined,
      meta_description: formData.meta_description?.trim() || undefined,
      meta_keywords: formData.meta_keywords?.trim() || undefined,
      content: {
        title: formData.title?.trim() || "",
        subtitle: formData.subtitle?.trim() || "",
        description: formData.description || "",
        coverImage: formData.coverImage,
        coverImagePosition: formData.coverImagePosition || "none",
      },
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    try {
      const token = getToken();
      if (!token) {
        toast.error("Authentication token not found.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editPageId) {
        const encodedSection = encodeURIComponent(editPageId);
        await axios.put(`${BASE_URL}/cms/${encodedSection}`, payload, config);

        if (sections.length > 0) {
          await Promise.all(
            sections.map((section) =>
              axios.put(
                `${BASE_URL}/cms/sections/${section.id}`,
                { data: section.data || {} },
                config
              )
            )
          );
        }

        toast.success("CMS page updated successfully");
      } else {
        const response = await axios.post(`${BASE_URL}/cms/`, payload, config);
        const created = response.data?.data;

        if (created) {
          setEditPageId(created.section);
          setEditPageDbId(created.id || created._id || null);
          toast.success("Page created. You can now add modules.");
        }
      }

      fetchCmsPages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save page");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (section) => {
    const pageToDelete = pages.find((p) => p.section === section);
    const title = pageToDelete?.content?.title || "This Page";

    const confirmed = window.confirm(`Delete page \"${title}\"?`);
    if (!confirmed) return;

    try {
      const token = getToken();
      if (!token) {
        toast.error("Authentication token not found.");
        return;
      }

      const encodedSection = encodeURIComponent(section);

      await axios.delete(`${BASE_URL}/cms/${encodedSection}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`${title} deleted successfully`);
      fetchCmsPages();

      if (editPageId === section) handleCancelEdit();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete ${title}`);
    }
  };

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return sortedPages;
    const query = searchQuery.toLowerCase();

    return sortedPages.filter((page) => {
      const title = page.content?.title?.toLowerCase() || "";
      const subtitle = page.content?.subtitle?.toLowerCase() || "";
      const section = page.section?.toLowerCase() || "";
      return title.includes(query) || subtitle.includes(query) || section.includes(query);
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
        (page) => String(page._id || page.id || page.section) === String(active.id)
      );
      const newIndex = items.findIndex(
        (page) => String(page._id || page.id || page.section) === String(over.id)
      );
      if (oldIndex === -1 || newIndex === -1) return items;
      nextOrder = arrayMove(items, oldIndex, newIndex);
      return nextOrder;
    });

    if (!nextOrder.length) return;

    try {
      const token = getToken();
      if (!token) return;

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
    } catch {
      toast.error("Failed to save page order");
    }
  };

  const getCategoryName = (categoryId) => {
    const target = categoryId != null ? String(categoryId) : "";
    const category = categories.find(
      (cat) => String(cat._id || cat.id) === target
    );
    return category ? category.name : "No Category";
  };

  const renderSectionEditor = (section) => {
    const data = section.data || {};

    if (section.type === "pageBanner") {
      return (
        <div>
          <label className={labelClass}>Page Banner Image</label>
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
            {data.pageBannerImage ? (
              <img
                src={
                  data.pageBannerImage.variants?.thumbnail ||
                  data.pageBannerImage.url ||
                  data.pageBannerImage
                }
                alt="Banner"
                className="w-full h-40 object-contain rounded"
              />
            ) : (
              <p className="text-sm text-gray-500">No banner image selected</p>
            )}
            <div className={`mt-3 grid gap-2 ${data.pageBannerImage ? "grid-cols-2" : "grid-cols-1"}`}>
              <button
                type="button"
                onClick={() => {
                  setMediaTarget({ sectionId: section.id, kind: "pageBannerImage" });
                  setSectionMediaModalOpen(true);
                }}
                className="w-full border border-gray-200 rounded-md py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Select Image
              </button>
              {data.pageBannerImage && (
                <button
                  type="button"
                  onClick={() =>
                    updateSectionDataLocal(section.id, (prev) => ({
                      ...prev,
                      pageBannerImage: null,
                    }))
                  }
                  className="w-full border border-gray-200 rounded-md py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (section.type === "team") {
      const selected = data.selectedTeamMembers || [];
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Section Title</label>
              <input
                type="text"
                value={data.teamSectionTitle || ""}
                onChange={(e) =>
                  updateSectionDataLocal(section.id, (prev) => ({
                    ...prev,
                    teamSectionTitle: e.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Our Team"
              />
            </div>
            <div>
              <label className={labelClass}>Founder Title</label>
              <input
                type="text"
                value={data.founderTitle || ""}
                onChange={(e) =>
                  updateSectionDataLocal(section.id, (prev) => ({
                    ...prev,
                    founderTitle: e.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Short Biography of ..."
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Founder Detail</label>
            <RichEditor
              value={data.founderDetails || ""}
              onChange={(value) =>
                updateSectionDataLocal(section.id, (prev) => ({
                  ...prev,
                  founderDetails: value,
                }))
              }
              height="h-64"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Button Label</label>
              <input
                type="text"
                value={data.founderCtaLabel || ""}
                onChange={(e) =>
                  updateSectionDataLocal(section.id, (prev) => ({
                    ...prev,
                    founderCtaLabel: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Button Link</label>
              <input
                type="text"
                value={data.founderCtaLink || ""}
                onChange={(e) =>
                  updateSectionDataLocal(section.id, (prev) => ({
                    ...prev,
                    founderCtaLink: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Available Team</label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                {teamMembers
                  .filter((member) => !selected.includes(member.id || member.name))
                  .map((member) => (
                    <button
                      key={member.id || member.name}
                      type="button"
                      onClick={() =>
                        updateSectionDataLocal(section.id, (prev) => ({
                          ...prev,
                          selectedTeamMembers: [
                            ...(prev.selectedTeamMembers || []),
                            member.id || member.name,
                          ],
                        }))
                      }
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-100 text-left"
                    >
                      <span className="text-sm text-gray-700">{member.name}</span>
                      <Plus className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Selected Team</label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                {selected.map((memberId) => {
                  const member = teamMembers.find(
                    (item) => (item.id || item.name) === memberId
                  );
                  return (
                    <div
                      key={memberId}
                      className="flex items-center justify-between px-3 py-2 rounded-md border border-gray-100 bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">{member?.name || memberId}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSectionDataLocal(section.id, (prev) => ({
                            ...prev,
                            selectedTeamMembers: (prev.selectedTeamMembers || []).filter(
                              (id) => id !== memberId
                            ),
                          }))
                        }
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section.type === "packages") {
      const selectedIds = data.packagesSectionPackageIds || [];
      const selectedOption = packagesSelectBySection[section.id] || "";

      const handlePackagesDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = selectedIds.findIndex((id) => String(id) === String(active.id));
        const newIndex = selectedIds.findIndex((id) => String(id) === String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;

        updateSectionDataLocal(section.id, (prev) => ({
          ...prev,
          packagesSectionPackageIds: arrayMove(selectedIds, oldIndex, newIndex),
        }));
      };

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={data.packagesSectionTitle || ""}
                onChange={(e) =>
                  updateSectionDataLocal(section.id, (prev) => ({
                    ...prev,
                    packagesSectionTitle: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Subtitle</label>
              <input
                type="text"
                value={data.packagesSectionSubtitle || ""}
                onChange={(e) =>
                  updateSectionDataLocal(section.id, (prev) => ({
                    ...prev,
                    packagesSectionSubtitle: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-8">
            <label className={labelClass}>Short Description</label>
            <RichEditor
              value={data.packagesSectionDescription || ""}
              onChange={(value) =>
                updateSectionDataLocal(section.id, (prev) => ({
                  ...prev,
                  packagesSectionDescription: value,
                }))
              }
              height="h-56"
            />
          </div>

          <div className="mt-14">
            <label className={labelClass}>Select Packages</label>
            <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <label className="text-xs font-semibold text-gray-500">Available Packages</label>
                <div className="mt-2 flex gap-2">
                  <select
                    value={selectedOption}
                    onChange={(e) =>
                      setPackagesSelectBySection((prev) => ({
                        ...prev,
                        [section.id]: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm"
                  >
                    <option value="">Select a package</option>
                    {packageOptions.map((pkg, idx) => {
                      const id = pkg.__key || getPackageKey(pkg, idx);
                      const label = pkg.title || "Untitled Package";
                      return (
                        <option key={`${id}-${idx}`} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedOption) return;
                      if (selectedIds.includes(String(selectedOption))) return;
                      updateSectionDataLocal(section.id, (prev) => ({
                        ...prev,
                        packagesSectionPackageIds: [
                          ...(prev.packagesSectionPackageIds || []),
                          String(selectedOption),
                        ],
                      }));
                      setPackagesSelectBySection((prev) => ({
                        ...prev,
                        [section.id]: "",
                      }));
                    }}
                    className="h-12 px-4 rounded-xl bg-[var(--admin-primary)] text-white text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <label className="text-xs font-semibold text-gray-500">Selected Packages</label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handlePackagesDragEnd}
                >
                  <SortableContext
                    items={selectedIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                      {selectedIds.map((id, idx) => {
                        const pkg = packageOptions.find(
                          (item) => String(item.__key) === String(id)
                        );
                        return (
                          <SortableSelectedItem
                            key={`${id}-${idx}`}
                            id={String(id)}
                            title={pkg?.title || "Selected Package"}
                            onRemove={() =>
                              updateSectionDataLocal(section.id, (prev) => ({
                                ...prev,
                                packagesSectionPackageIds: (
                                  prev.packagesSectionPackageIds || []
                                ).filter((pkgId) => String(pkgId) !== String(id)),
                              }))
                            }
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section.type === "repeatableTextImage") {
      const items = Array.isArray(data.items) ? data.items : [];

      const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        updateSectionDataLocal(section.id, (prev) => ({
          ...prev,
          items: arrayMove(items, oldIndex, newIndex),
        }));
      };

      return (
        <div>
          {items.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const key = `${section.id}-${item.id}`;
                    return (
                      <SortableSectionCard
                        key={item.id}
                        section={item}
                        index={index}
                        isOpen={!!openRepeatableItems[key]}
                        onToggle={() =>
                          setOpenRepeatableItems((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
                        onRemove={() =>
                          updateSectionDataLocal(section.id, (prev) => ({
                            ...prev,
                            items: (prev.items || []).filter((s) => s.id !== item.id),
                          }))
                        }
                        onChange={(field, value) =>
                          updateSectionDataLocal(section.id, (prev) => ({
                            ...prev,
                            items: (prev.items || []).map((entry) =>
                              entry.id === item.id ? { ...entry, [field]: value } : entry
                            ),
                          }))
                        }
                        onSelectImage={() => {
                          setMediaTarget({
                            sectionId: section.id,
                            kind: "repeatableItemImage",
                            itemId: item.id,
                          });
                          setSectionMediaModalOpen(true);
                        }}
                        onRemoveImage={() =>
                          updateSectionDataLocal(section.id, (prev) => ({
                            ...prev,
                            items: (prev.items || []).map((entry) =>
                              entry.id === item.id ? { ...entry, image: "" } : entry
                            ),
                          }))
                        }
                        labelClass={labelClass}
                        inputClass={inputClass}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-sm text-gray-500">No sections added yet.</p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const newItem = {
                  id: `${Date.now()}-${Math.random()}`,
                  title: "",
                  description: "",
                  image: "",
                  imageCaption: "",
                  background: "white",
                  imagePosition: "left-25",
                };

                updateSectionDataLocal(section.id, (prev) => ({
                  ...prev,
                  items: [...(prev.items || []), newItem],
                }));

                const key = `${section.id}-${newItem.id}`;
                setOpenRepeatableItems((prev) => ({ ...prev, [key]: true }));
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--admin-primary)] text-white text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>
      );
    }

    if (section.type === "gallery") {
      const images = Array.isArray(data.galleryImages) ? data.galleryImages : [];
      return (
        <div>
          <label className={labelClass}>Photo Gallery Images</label>
          <button
            type="button"
            onClick={() => {
              setGalleryTargetSectionId(section.id);
              setGalleryModalOpen(true);
            }}
            className="mt-2 flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg"
          >
            <div className="text-center">
              <ImagePlus className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Select gallery images</p>
            </div>
          </button>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={image.variants?.thumbnail || image.url || image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateSectionDataLocal(section.id, (prev) => ({
                        ...prev,
                        galleryImages: (prev.galleryImages || []).filter((_, i) => i !== index),
                      }))
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (section.type === "relatedInformation") {
      const items = Array.isArray(data.items) ? data.items : [];

      const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        updateSectionDataLocal(section.id, (prev) => ({
          ...prev,
          items: arrayMove(items, oldIndex, newIndex),
        }));
      };

      return (
        <div>
          {items.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const key = `${section.id}-${item.id}`;
                    return (
                      <SortableRelatedInfoCard
                        key={item.id}
                        item={item}
                        index={index}
                        isOpen={!!openRelatedItems[key]}
                        onToggle={() =>
                          setOpenRelatedItems((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
                        onRemove={() =>
                          updateSectionDataLocal(section.id, (prev) => ({
                            ...prev,
                            items: (prev.items || []).filter((entry) => entry.id !== item.id),
                          }))
                        }
                        onChange={(field, value) =>
                          updateSectionDataLocal(section.id, (prev) => ({
                            ...prev,
                            items: (prev.items || []).map((entry) =>
                              entry.id === item.id ? { ...entry, [field]: value } : entry
                            ),
                          }))
                        }
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-sm text-gray-500">No related information added yet.</p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const newItem = { id: `${Date.now()}-${Math.random()}`, title: "", description: "" };
                updateSectionDataLocal(section.id, (prev) => ({
                  ...prev,
                  items: [...(prev.items || []), newItem],
                }));
                const key = `${section.id}-${newItem.id}`;
                setOpenRelatedItems((prev) => ({ ...prev, [key]: true }));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg"
            >
              <Plus size={18} />
              Add Information
            </button>
          </div>
        </div>
      );
    }

    if (section.type === "faq") {
      const items = Array.isArray(data.items) ? data.items : [];

      const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        updateSectionDataLocal(section.id, (prev) => ({
          ...prev,
          items: arrayMove(items, oldIndex, newIndex),
        }));
      };

      return (
        <div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Section Title</label>
            <input
              type="text"
              value={data.faqSectionTitle || ""}
              onChange={(e) =>
                updateSectionDataLocal(section.id, (prev) => ({
                  ...prev,
                  faqSectionTitle: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
          </div>

          {items.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {items.map((faq, index) => {
                    const key = `${section.id}-${faq.id}`;
                    return (
                      <SortableFaqCard
                        key={faq.id}
                        item={faq}
                        index={index}
                        isOpen={!!openFaqItems[key]}
                        onToggle={() => setOpenFaqItems((prev) => ({ ...prev, [key]: !prev[key] }))}
                        onRemove={() =>
                          updateSectionDataLocal(section.id, (prev) => ({
                            ...prev,
                            items: (prev.items || []).filter((entry) => entry.id !== faq.id),
                          }))
                        }
                        onChange={(field, value) =>
                          updateSectionDataLocal(section.id, (prev) => ({
                            ...prev,
                            items: (prev.items || []).map((entry) =>
                              entry.id === faq.id ? { ...entry, [field]: value } : entry
                            ),
                          }))
                        }
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-sm text-gray-500">No FAQs added yet.</p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const newItem = {
                  id: `${Date.now()}-${Math.random()}`,
                  question: "",
                  answer: "",
                };
                updateSectionDataLocal(section.id, (prev) => ({
                  ...prev,
                  items: [...(prev.items || []), newItem],
                }));
                const key = `${section.id}-${newItem.id}`;
                setOpenFaqItems((prev) => ({ ...prev, [key]: true }));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg"
            >
              <Plus size={18} />
              Add FAQ
            </button>
          </div>
        </div>
      );
    }

    if (section.type === "bookingForm") {
      return (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Show Booking Form</h3>
              <p className="text-xs text-gray-500">Display booking form on this page</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!data.showBookingForm}
                onChange={(e) =>
                  updateSectionDataLocal(section.id, (prev) => ({
                    ...prev,
                    showBookingForm: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
            </label>
          </div>
        </div>
      );
    }

    return <p className="text-sm text-gray-500">Unknown section type</p>;
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
      <div ref={setNodeRef} style={style} className="py-4 flex justify-between items-center">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="mt-1 text-gray-400 cursor-grab select-none" {...attributes} {...listeners}>
            ⋮⋮
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base md:text-lg font-semibold truncate">{page.content?.title || "N/A"}</p>
            {page.content?.subtitle && (
              <p className="text-sm md:text-base text-gray-600 truncate">{page.content.subtitle}</p>
            )}
            <p className="text-xs md:text-sm text-gray-500 truncate">
              {page.section} | Status: {page.status ? "Published" : "Draft"}
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
          <button onClick={() => handleDelete(page.section)} className="text-red-600 hover:text-red-900 font-medium">
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      <Toaster position="top-center" />

      <div className="bg-white shadow-xl rounded-lg p-6 mb-10">
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">
          {editPageId ? `Edit Page: ${formData.title || editPageId}` : "Create New Page Content"}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="section" className={labelClass}>Section Name</label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="slug" className={labelClass}>Slug</label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={inputClass}
              />
            </div>
            <div className="flex items-end pb-2">
              <input
                type="checkbox"
                id="status"
                name="status"
                checked={formData.status}
                onChange={handleInputChange}
                className="h-4 w-4 mr-2"
              />
              <label htmlFor="status" className="text-sm font-medium text-gray-700">
                Publish Page
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>Category</label>
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
                  <option key={cat._id || cat.id} value={String(cat._id || cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="title" className={labelClass}>Content Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="subtitle" className={labelClass}>Content Subtitle</label>
            <input
              type="text"
              id="subtitle"
              name="subtitle"
              value={formData.subtitle ?? ""}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Cover Image</label>
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
              {formData.coverImage ? (
                <img
                  src={
                    formData.coverImage.variants?.thumbnail ||
                    formData.coverImage.url ||
                    formData.coverImage
                  }
                  alt="Cover"
                  className="w-full h-40 object-contain rounded"
                />
              ) : (
                <p className="text-sm text-gray-500">No cover image selected</p>
              )}
              <div className={`mt-3 grid gap-2 ${formData.coverImage ? "grid-cols-2" : "grid-cols-1"}`}>
                <button
                  type="button"
                  onClick={() => setCoverImageModalOpen(true)}
                  className="w-full border border-gray-200 rounded-md py-2 text-sm text-gray-600"
                >
                  Select Image
                </button>
                {formData.coverImage && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, coverImage: null }))}
                    className="w-full border border-gray-200 rounded-md py-2 text-sm text-red-600"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Cover Image Position</label>
              <select
                value={formData.coverImagePosition}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    coverImagePosition: e.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="none">None (Top)</option>
                <option value="left-25">Left 25%</option>
                <option value="left-50">Left 50%</option>
                <option value="right-25">Right 25%</option>
                <option value="right-50">Right 50%</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <RichEditor
              value={formData.description}
              onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              height="h-80"
            />
          </div>

          <div className="mt-[60px]">
            <label htmlFor="meta_title" className={labelClass}>Meta Title</label>
            <input
              type="text"
              id="meta_title"
              name="meta_title"
              value={formData.meta_title}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="meta_description" className={labelClass}>Meta Description</label>
            <textarea
              id="meta_description"
              name="meta_description"
              value={formData.meta_description}
              onChange={handleInputChange}
              className={`${inputClass} min-h-[96px]`}
            />
          </div>

          <div>
            <label htmlFor="meta_keywords" className={labelClass}>Meta Keywords</label>
            <input
              type="text"
              id="meta_keywords"
              name="meta_keywords"
              value={formData.meta_keywords}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 rounded-xl border border-gray-200 p-4 bg-gray-50 h-fit">
              <h3 className="text-base font-semibold text-gray-800">Module Palette</h3>
              <p className="text-sm text-gray-500 mt-1">Add reusable blocks to the page.</p>
              <div className="mt-4 space-y-2">
                {MODULE_TYPES.map((module) => (
                  <button
                    key={module.type}
                    type="button"
                    onClick={() => addSection(module.type)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg bg-white hover:border-[var(--admin-primary-border)]"
                  >
                    <p className="text-sm font-semibold text-gray-800">{module.label}</p>
                    <p className="text-xs text-gray-500">{module.hint}</p>
                  </button>
                ))}
              </div>
              {!editPageDbId && (
                <p className="mt-3 text-xs text-amber-600">Save the page first to add modules.</p>
              )}
            </div>

            <div className="lg:col-span-8 rounded-xl border border-gray-200 p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">Sections ({sections.length})</h3>
              </div>

              {sections.length === 0 ? (
                <p className="text-sm text-gray-500">No modules added yet.</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSectionsDragEnd}
                >
                  <SortableContext
                    items={sections.map((section) => section.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {sections.map((section) => (
                        <SortableModuleCard
                          key={section.id}
                          section={section}
                          isOpen={!!openModules[section.id]}
                          onToggle={() =>
                            setOpenModules((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
                          }
                          onToggleEnabled={(enabled) => toggleSectionEnabled(section.id, enabled)}
                          onDuplicate={() => duplicateSection(section.id)}
                          onDelete={() => deleteSection(section.id)}
                          onSave={() => saveSection(section.id)}
                        >
                          {renderSectionEditor(section)}
                        </SortableModuleCard>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          <div className="flex space-x-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-md text-white font-semibold ${
                loading ? "bg-gray-400" : "bg-[var(--admin-primary)]"
              }`}
            >
              {loading ? "Saving..." : editPageId ? "Update CMS Page" : "Save New CMS Page"}
            </button>

            {editPageId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-3 px-4 rounded-md text-gray-700 bg-gray-200"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-10 bg-white shadow-xl rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Existing CMS Pages ({pages.length})</h2>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by title, subtitle, or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {listLoading ? (
          <div className="p-4 text-center">Loading pages...</div>
        ) : pages.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No CMS pages found.</div>
        ) : filteredPages.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No pages match your search.</div>
        ) : (
          <>
            {isSearchActive ? (
              <div className="divide-y divide-gray-200">
                {filteredPages.slice(0, visibleCount).map((page) => (
                  <div key={page._id || page.id || page.section} className="py-4 flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-base md:text-lg font-semibold truncate">{page.content?.title || "N/A"}</p>
                      {page.content?.subtitle && (
                        <p className="text-sm md:text-base text-gray-600 truncate">{page.content.subtitle}</p>
                      )}
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {page.section} | Status: {page.status ? "Published" : "Draft"}
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
                        className="text-[var(--admin-primary)] font-medium"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(page.section)} className="text-red-600 font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePagesDragEnd}
              >
                <SortableContext
                  items={filteredPages.map((page) => String(page._id || page.id || page.section))}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-gray-200">
                    {filteredPages.slice(0, visibleCount).map((page) => (
                      <SortablePageRow key={page._id || page.id || page.section} page={page} />
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
                  className="px-5 py-2.5 bg-[var(--admin-primary)] text-white font-semibold rounded-lg"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <MediaPickerModal
        open={coverImageModalOpen}
        onOpenChange={setCoverImageModalOpen}
        onSelect={handleCoverImageSelect}
        title="Select Cover Image"
      />
      <MediaPickerModal
        open={sectionMediaModalOpen}
        onOpenChange={setSectionMediaModalOpen}
        onSelect={handleSectionMediaSelect}
        title="Select Section Image"
      />
      <MediaPickerModal
        open={galleryModalOpen}
        onOpenChange={setGalleryModalOpen}
        onSelect={handleGalleryMediaSelect}
        title="Add Gallery Image"
      />
    </div>
  );
};

const CmsAdminPageWithAuth = () => (
  <ProtectedRoute>
    <RoleProtectedRoute allowedRoles={["admin", "superadmin"]}>
      <CmsAdminPage />
    </RoleProtectedRoute>
  </ProtectedRoute>
);

export default CmsAdminPageWithAuth;
