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
import {
  ImagePlus,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import RichEditor from "@/components/editor/RichEditor";
import MediaPickerModal from "@/components/media/MediaPickerModal";

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
  teamSectionTitle: "",
  founderTitle: "",
  founderDetails: "",
  founderCtaLabel: "",
  founderCtaLink: "",
  selectedTeamMembers: [],
  packagesSectionTitle: "",
  packagesSectionSubtitle: "",
  packagesSectionDescription: "",
  packagesSectionPackageIds: [],
  repeatableSections: [],
  pageBannerImage: null,
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  galleryImages: [],
  faq: [],
  faqSectionTitle: "",
  relatedInformation: [],
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
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [teamSectionOpen, setTeamSectionOpen] = useState(false);
  const [packagesSectionOpen, setPackagesSectionOpen] = useState(false);
  const [sectionMediaModalOpen, setSectionMediaModalOpen] = useState(false);
  const [coverImageModalOpen, setCoverImageModalOpen] = useState(false);
  const [pageBannerModalOpen, setPageBannerModalOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [packageOptions, setPackageOptions] = useState([]);
  const [packagesSelectId, setPackagesSelectId] = useState("");

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
      const raw = response.data.data || [];
      const sorted = [...raw].sort((a, b) => {
        const aOrder = Number(a.sort_order) || 0;
        const bOrder = Number(b.sort_order) || 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
      setCategories(sorted);
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

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/team/`);
      const members =
        response.data?.teams || response.data?.data || response.data || [];
      setTeamMembers(Array.isArray(members) ? members : []);
    } catch (error) {
      console.error("Fetch Team Members Error:", error);
      toast.error("Failed to load team members.");
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
    } catch (error) {
      console.error("Fetch Packages Error:", error);
      toast.error("Failed to load packages.");
      setPackageOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchCmsPages();
    fetchTeamMembers();
    fetchPackages();
  }, [fetchCategories, fetchCmsPages, fetchTeamMembers, fetchPackages]);

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

  const addRelatedInfo = () => {
    setFormData((prev) => ({
      ...prev,
      relatedInformation: [
        ...prev.relatedInformation,
        { id: Date.now(), title: "", description: "" },
      ],
    }));
  };

  const removeRelatedInfo = (index) => {
    setFormData((prev) => ({
      ...prev,
      relatedInformation: prev.relatedInformation.filter((_, i) => i !== index),
    }));
  };

  const handleRelatedInfoChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      relatedInformation: prev.relatedInformation.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
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
    const sections = Array.isArray(pageData.content?.repeatableSections)
      ? pageData.content.repeatableSections.map((section) => ({
          id: section.id || `${Date.now()}-${Math.random()}`,
          title: section.title || "",
          description: section.description || "",
          image: section.image || "",
          imageCaption: section.imageCaption || "",
          background: section.background || "white",
          imagePosition: section.imagePosition || "left",
        }))
      : [];
    const nextForm = {
      section: pageData.section || "",
      slug: pageData.slug || "",
      status: pageData.status || false,
      title: pageData.content?.title || "",
      subtitle: pageData.content?.subtitle || "",
      description: pageData.content?.description || "",
      coverImage: normalizeMedia(pageData.content?.coverImage),
      coverImagePosition: pageData.content?.coverImagePosition || "none",
      category:
        pageData.categoryId != null ? String(pageData.categoryId) : "",
      teamSectionTitle: pageData.content?.teamSectionTitle || "",
      founderTitle: pageData.content?.founderTitle || "",
      founderDetails: pageData.content?.founderDetails || "",
      founderCtaLabel: pageData.content?.founderCtaLabel || "",
      founderCtaLink: pageData.content?.founderCtaLink || "",
      selectedTeamMembers: pageData.content?.selectedTeamMembers || [],
      packagesSectionTitle: pageData.content?.packagesSectionTitle || "",
      packagesSectionSubtitle: pageData.content?.packagesSectionSubtitle || "",
      packagesSectionDescription:
        pageData.content?.packagesSectionDescription || "",
      packagesSectionPackageIds: (pageData.content?.packagesSectionPackageIds ||
        []).map(String),
      repeatableSections: sections,
      pageBannerImage: normalizeMedia(pageData.content?.pageBannerImage),
      meta_title: pageData.meta_title || "",
      meta_description: pageData.meta_description || "",
      meta_keywords: pageData.meta_keywords || "",
      galleryImages: (pageData.content?.galleryImages || [])
        .map((img) => normalizeMedia(img))
        .filter(Boolean),
      faq: pageData.content?.faq || [],
      faqSectionTitle: pageData.content?.faqSectionTitle || "",
      relatedInformation: (pageData.content?.relatedInformation || []).map(
        (item, index) => ({
          id: item.id || `${Date.now()}-${index}`,
          title: item.title || "",
          description: item.description || "",
        })
      ),
      showBookingForm: pageData.content?.showBookingForm || false,
    };
    setFormData(nextForm);
    setOpenSections({});
    const hasExtras =
      !!nextForm.teamSectionTitle ||
      !!nextForm.founderTitle ||
      !!nextForm.founderDetails ||
      !!nextForm.founderCtaLabel ||
      !!nextForm.founderCtaLink ||
      (nextForm.selectedTeamMembers || []).length > 0 ||
      !!nextForm.packagesSectionTitle ||
      !!nextForm.packagesSectionSubtitle ||
      !!nextForm.packagesSectionDescription ||
      (nextForm.packagesSectionPackageIds || []).length > 0 ||
      (nextForm.repeatableSections || []).length > 0 ||
      !!nextForm.pageBannerImage ||
      (nextForm.galleryImages || []).length > 0 ||
      (nextForm.faq || []).length > 0 ||
      (nextForm.relatedInformation || []).length > 0 ||
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

  const handleCoverImageSelect = (media) => {
    setFormData((prev) => ({
      ...prev,
      coverImage: media,
    }));
  };

  const handlePageBannerSelect = (media) => {
    setFormData((prev) => ({
      ...prev,
      pageBannerImage: media,
    }));
  };

  const handleSectionImageSelect = (media) => {
    if (!activeSectionId) return;
    setFormData((prev) => ({
      ...prev,
      repeatableSections: prev.repeatableSections.map((section) =>
        section.id === activeSectionId
          ? { ...section, image: media }
          : section
      ),
    }));
  };

  const handleAddSection = () => {
    const newSection = {
      id: `${Date.now()}-${Math.random()}`,
      title: "",
      description: "",
      image: "",
      imageCaption: "",
      background: "white",
      imagePosition: "left",
    };
    setFormData((prev) => ({
      ...prev,
      repeatableSections: [...prev.repeatableSections, newSection],
    }));
  };

  const handleRemoveSection = (sectionId) => {
    setFormData((prev) => ({
      ...prev,
      repeatableSections: prev.repeatableSections.filter(
        (section) => section.id !== sectionId
      ),
    }));
    setOpenSections((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  };

  const handleSectionChange = (sectionId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      repeatableSections: prev.repeatableSections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      ),
    }));
  };

  const toggleSectionOpen = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleSectionDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFormData((prev) => {
      const oldIndex = prev.repeatableSections.findIndex(
        (section) => section.id === active.id
      );
      const newIndex = prev.repeatableSections.findIndex(
        (section) => section.id === over.id
      );
      return {
        ...prev,
        repeatableSections: arrayMove(
          prev.repeatableSections,
          oldIndex,
          newIndex
        ),
      };
    });
  };

  const handleAddTeamMember = (memberId) => {
    if (!memberId) return;
    setFormData((prev) => {
      if (prev.selectedTeamMembers.includes(memberId)) return prev;
      return {
        ...prev,
        selectedTeamMembers: [...prev.selectedTeamMembers, memberId],
      };
    });
  };

  const handleRemoveTeamMember = (memberId) => {
    setFormData((prev) => ({
      ...prev,
      selectedTeamMembers: prev.selectedTeamMembers.filter(
        (id) => id !== memberId
      ),
    }));
  };

  const handleAddPackage = () => {
    if (!packagesSelectId) return;
    setFormData((prev) => {
      const normalizedId = String(packagesSelectId);
      if ((prev.packagesSectionPackageIds || []).includes(normalizedId)) {
        return prev;
      }
      return {
        ...prev,
        packagesSectionPackageIds: [
          ...(prev.packagesSectionPackageIds || []),
          normalizedId,
        ],
      };
    });
    setPackagesSelectId("");
  };

  const handleRemovePackage = (id) => {
    setFormData((prev) => ({
      ...prev,
      packagesSectionPackageIds: (prev.packagesSectionPackageIds || []).filter(
        (pkgId) => String(pkgId) !== String(id)
      ),
    }));
  };

  const handlePackagesDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFormData((prev) => {
      const items = prev.packagesSectionPackageIds || [];
      const oldIndex = items.findIndex(
        (pkgId) => String(pkgId) === String(active.id)
      );
      const newIndex = items.findIndex(
        (pkgId) => String(pkgId) === String(over.id)
      );
      if (oldIndex === -1 || newIndex === -1) return prev;
      return {
        ...prev,
        packagesSectionPackageIds: arrayMove(items, oldIndex, newIndex),
      };
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
    const cleanedRelatedInfo = formData.relatedInformation.map(
      ({ id, ...item }) => item
    );

    const metaTitle = formData.meta_title?.toString().trim() || "";
    const metaDescription = formData.meta_description?.toString().trim() || "";
    const metaKeywords = formData.meta_keywords?.toString().trim() || "";

    const packagesSectionPackageIds = (
      formData.packagesSectionPackageIds || []
    ).map(String);

    const payload = {
      section: formData.section,
      slug: formData.slug?.trim() || undefined,
      content: {
        subtitle: formData.subtitle?.trim() || "",
        title: formData.title?.trim() || "",
        description: formData.description,
        coverImage: formData.coverImage,
        coverImagePosition: formData.coverImagePosition || "none",
        teamSectionTitle: formData.teamSectionTitle?.trim() || "",
        founderTitle: formData.founderTitle?.trim() || "",
        founderDetails: formData.founderDetails,
        founderCtaLabel: formData.founderCtaLabel?.trim() || "",
        founderCtaLink: formData.founderCtaLink?.trim() || "",
        selectedTeamMembers: formData.selectedTeamMembers || [],
        packagesSectionTitle: formData.packagesSectionTitle?.trim() || "",
        packagesSectionSubtitle: formData.packagesSectionSubtitle?.trim() || "",
        packagesSectionDescription: formData.packagesSectionDescription || "",
        packagesSectionPackageIds,
        repeatableSections: formData.repeatableSections || [],
        pageBannerImage: formData.pageBannerImage,
        galleryImages: formData.galleryImages,
        faqSectionTitle: formData.faqSectionTitle?.trim() || "",
        faq: cleanedFaq,
        relatedInformation: cleanedRelatedInfo,
        showBookingForm: formData.showBookingForm,
      },
      status: formData.status,
      categoryId: formData.category?.trim() || "",
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
        const encodedSection = encodeURIComponent(editPageId);
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

  const SortableSectionCard = ({ section, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: section.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {section.title || `Section ${index + 1}`}
              </p>
              {!section.title && (
                <p className="text-xs text-gray-400">Untitled</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSectionOpen(section.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              {openSections[section.id] ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleRemoveSection(section.id)}
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {openSections[section.id] && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Section Title</label>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) =>
                    handleSectionChange(section.id, "title", e.target.value)
                  }
                  className={inputClass}
                  placeholder="Section title"
                />
              </div>
              <div>
                <label className={labelClass}>Background</label>
                <select
                  value={section.background}
                  onChange={(e) =>
                    handleSectionChange(section.id, "background", e.target.value)
                  }
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
                  onChange={(value) =>
                    handleSectionChange(section.id, "description", value)
                  }
                  height="h-56"
                />
              </div>
              <div>
                <label className={labelClass}>Image</label>
                <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {section.image ? (
                    <img
                      src={
                        section.image.variants?.thumbnail ||
                        section.image.url ||
                        section.image
                      }
                      alt="Section"
                      className="w-full h-32 object-contain rounded"
                    />
                  ) : (
                    <p className="text-sm text-gray-500">No image selected</p>
                  )}
                  <div
                    className={`mt-3 grid gap-2 ${
                      section.image ? "grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSectionId(section.id);
                        setSectionMediaModalOpen(true);
                      }}
                      className="w-full border border-gray-200 rounded-md py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Select Image
                    </button>
                    {section.image && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSectionChange(section.id, "image", "")
                        }
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
                    onChange={(e) =>
                      handleSectionChange(
                        section.id,
                        "imagePosition",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className={labelClass}>Image Caption</label>
                  <input
                    type="text"
                    value={section.imageCaption}
                    onChange={(e) =>
                      handleSectionChange(
                        section.id,
                        "imageCaption",
                        e.target.value
                      )
                    }
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
            aria-label="Drag handle"
          >
            <GripVertical className="w-4 h-4" />
          </button>
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
              <div
                className={`mt-3 grid gap-2 ${
                  formData.coverImage ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCoverImageModalOpen(true)}
                  className="w-full border border-gray-200 rounded-md py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Select Image
                </button>
                {formData.coverImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, coverImage: null }))
                    }
                    className="w-full border border-gray-200 rounded-md py-2 text-sm text-red-600 hover:bg-red-50"
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
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description </label>
            <RichEditor
              value={formData.description}
              onChange={(value) => handleQuillChange("description", value)}
              height="h-80"
            />
          </div>

          <div className="mt-[60px]">
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

          <div className="mt-8 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Optional Blocks
              </h3>
              <p className="text-sm text-gray-500">
                Optional blocks: team, packages, gallery, FAQ, booking
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
              <div className="rounded-xl border border-gray-200 p-5 bg-white mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      Page Banner Image
                    </h4>
                    <p className="text-sm text-gray-500">
                      Optional top banner for this page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPageBannerModalOpen(true)}
                    className="text-sm font-semibold text-[var(--admin-primary)] hover:underline"
                  >
                    Select Image
                  </button>
                </div>
                <div className="mt-4 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {formData.pageBannerImage ? (
                    <img
                      src={
                        formData.pageBannerImage.variants?.thumbnail ||
                        formData.pageBannerImage.url ||
                        formData.pageBannerImage
                      }
                      alt="Banner"
                      className="w-full h-40 object-contain rounded"
                    />
                  ) : (
                    <p className="text-sm text-gray-500">
                      No banner image selected
                    </p>
                  )}
                  {formData.pageBannerImage && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          pageBannerImage: null,
                        }))
                      }
                      className="mt-3 w-full border border-gray-200 rounded-md py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-5 bg-white">
                <button
                  type="button"
                  onClick={() => setTeamSectionOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h4 className="text-sm font-semibold text-gray-800">
                    Our Team Block
                  </h4>
                  {teamSectionOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {teamSectionOpen && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Section Title</label>
                        <input
                          type="text"
                          name="teamSectionTitle"
                          value={formData.teamSectionTitle}
                          onChange={handleInputChange}
                          className={inputClass}
                          placeholder="Our Team"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Founder Title</label>
                        <input
                          type="text"
                          name="founderTitle"
                          value={formData.founderTitle}
                          onChange={handleInputChange}
                          className={inputClass}
                          placeholder="Short Biography of ..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Founder Detail</label>
                      <RichEditor
                        value={formData.founderDetails}
                        onChange={(value) =>
                          handleQuillChange("founderDetails", value)
                        }
                        height="h-64"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Button Label</label>
                        <input
                          type="text"
                          name="founderCtaLabel"
                          value={formData.founderCtaLabel}
                          onChange={handleInputChange}
                          className={inputClass}
                          placeholder="Meet the Owner"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Button Link</label>
                        <input
                          type="text"
                          name="founderCtaLink"
                          value={formData.founderCtaLink}
                          onChange={handleInputChange}
                          className={inputClass}
                          placeholder="/meet-the-owner"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Available Team</label>
                        <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                          {teamMembers
                            .filter(
                              (member) =>
                                !formData.selectedTeamMembers.includes(
                                  member.id || member.name
                                )
                            )
                            .map((member) => (
                              <button
                                key={member.id || member.name}
                                type="button"
                                onClick={() =>
                                  handleAddTeamMember(member.id || member.name)
                                }
                                className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-100 hover:border-[var(--admin-primary-border)] hover:bg-[var(--admin-primary-soft)] text-left"
                              >
                                <span className="text-sm text-gray-700">
                                  {member.name}
                                </span>
                                <Plus className="w-4 h-4 text-gray-500" />
                              </button>
                            ))}
                          {teamMembers.length === 0 && (
                            <p className="text-sm text-gray-500">
                              No team members available.
                            </p>
                          )}
                          {teamMembers.length > 0 &&
                            teamMembers.filter(
                              (member) =>
                                !formData.selectedTeamMembers.includes(
                                  member.id || member.name
                                )
                            ).length === 0 && (
                              <p className="text-sm text-gray-500">
                                All team members are selected.
                              </p>
                            )}
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Selected Team</label>
                        <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                          {formData.selectedTeamMembers.map((memberId) => {
                            const member = teamMembers.find(
                              (item) => (item.id || item.name) === memberId
                            );
                            return (
                              <div
                                key={memberId}
                                className="flex items-center justify-between px-3 py-2 rounded-md border border-gray-100 bg-gray-50"
                              >
                                <span className="text-sm text-gray-700">
                                  {member?.name || memberId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTeamMember(memberId)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                          {formData.selectedTeamMembers.length === 0 && (
                            <p className="text-sm text-gray-500">
                              No team members selected.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-5 bg-white mt-6">
                <button
                  type="button"
                  onClick={() => setPackagesSectionOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h4 className="text-sm font-semibold text-gray-800">
                    Packages Block
                  </h4>
                  {packagesSectionOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {packagesSectionOpen && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Title</label>
                        <input
                          type="text"
                          name="packagesSectionTitle"
                          value={formData.packagesSectionTitle}
                          onChange={handleInputChange}
                          className={inputClass}
                          placeholder="Featured Packages"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Subtitle</label>
                        <input
                          type="text"
                          name="packagesSectionSubtitle"
                          value={formData.packagesSectionSubtitle}
                          onChange={handleInputChange}
                          className={inputClass}
                          placeholder="Handpicked tours for you"
                        />
                      </div>
                    </div>

                    <div className="mb-8">
                      <label className={labelClass}>Short Description</label>
                      <RichEditor
                        value={formData.packagesSectionDescription}
                        onChange={(value) =>
                          handleQuillChange(
                            "packagesSectionDescription",
                            value
                          )
                        }
                        height="h-56"
                      />
                    </div>

                    <div className="mt-14">
                      <label className={labelClass}>Select Packages</label>
                      <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-3">
                          <label className="text-xs font-semibold text-gray-500">
                            Available Packages
                          </label>
                          <div className="mt-2 flex gap-2">
                            <select
                              value={packagesSelectId}
                              onChange={(e) =>
                                setPackagesSelectId(e.target.value)
                              }
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
                              onClick={handleAddPackage}
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
                            Selected Packages
                          </label>
                          <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={handlePackagesDragEnd}
                          >
                            <SortableContext
                              items={formData.packagesSectionPackageIds}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                                {formData.packagesSectionPackageIds.map(
                                  (id, idx) => {
                                    const pkg = packageOptions.find(
                                      (item) =>
                                        String(item.__key) === String(id)
                                    );
                                    return (
                                      <SortableSelectedItem
                                        key={`${id}-${idx}`}
                                        id={String(id)}
                                        title={
                                          pkg?.title || "Selected Package"
                                        }
                                        onRemove={() => handleRemovePackage(id)}
                                      />
                                    );
                                  }
                                )}
                                {formData.packagesSectionPackageIds.length ===
                                  0 && (
                                  <p className="text-sm text-gray-500">
                                    No packages selected.
                                  </p>
                                )}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-5 bg-white mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Repetable Text/Image Block
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--admin-primary)] text-white text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </button>
                </div>

                <div className="mt-4">
                  {formData.repeatableSections.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No sections added yet.
                    </p>
                  ) : (
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={handleSectionDragEnd}
                    >
                      <SortableContext
                        items={formData.repeatableSections.map(
                          (section) => section.id
                        )}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {formData.repeatableSections.map((section, index) => (
                            <SortableSectionCard
                              key={section.id}
                              section={section}
                              index={index}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
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

              {/* Related Information Section */}
              <div className="mt-8 mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Related Information
                  </h3>
                  <button
                    type="button"
                    onClick={addRelatedInfo}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus size={18} />
                    Add Information
                  </button>
                </div>

                {formData.relatedInformation.length > 0 ? (
                  <div className="space-y-3">
                    {formData.relatedInformation.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500">
                            Information #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRelatedInfo(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Remove information"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Information Title
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) =>
                                handleRelatedInfoChange(
                                  index,
                                  "title",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder="Enter title"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Information Description
                            </label>
                            <RichEditor
                              value={item.description}
                              onChange={(value) =>
                                handleRelatedInfoChange(
                                  index,
                                  "description",
                                  value
                                )
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
                    No related information added yet. Click "Add Information" to
                    create one.
                  </p>
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

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Section Title
                  </label>
                  <input
                    type="text"
                    name="faqSectionTitle"
                    value={formData.faqSectionTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Frequently Asked Questions"
                  />
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
      <MediaPickerModal
        open={coverImageModalOpen}
        onOpenChange={setCoverImageModalOpen}
        onSelect={handleCoverImageSelect}
        title="Select Cover Image"
      />
      <MediaPickerModal
        open={pageBannerModalOpen}
        onOpenChange={setPageBannerModalOpen}
        onSelect={handlePageBannerSelect}
        title="Select Page Banner Image"
      />
      <MediaPickerModal
        open={sectionMediaModalOpen}
        onOpenChange={setSectionMediaModalOpen}
        onSelect={handleSectionImageSelect}
        title="Select Section Image"
      />
    </div>
  );
};

export default CmsAdminPage;
