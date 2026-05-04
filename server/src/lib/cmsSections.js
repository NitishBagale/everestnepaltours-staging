const { randomUUID } = require("crypto");
const { sanitizeHTML } = require("../utils/sanitize");

const SECTION_TYPES = {
  PAGE_BANNER: "pageBanner",
  TEAM: "team",
  PACKAGES: "packages",
  REPEATABLE_TEXT_IMAGE: "repeatableTextImage",
  GALLERY: "gallery",
  RELATED_INFORMATION: "relatedInformation",
  FAQ: "faq",
};

const VALID_SECTION_TYPES = Object.values(SECTION_TYPES);

const REPEATABLE_BACKGROUNDS = new Set(["white", "light"]);
const REPEATABLE_IMAGE_POSITIONS = new Set([
  "left-25",
  "left-50",
  "right-25",
  "right-50",
]);

const sanitizeText = (value) => (typeof value === "string" ? value.trim() : "");
const sanitizeRichText = (value) =>
  typeof value === "string" ? sanitizeHTML(value) : "";
const normalizeBoolean = (value) => !!value;

const normalizeRepeatableImagePosition = (value) => {
  if (value === "left") return "left-25";
  if (value === "right") return "right-25";
  return REPEATABLE_IMAGE_POSITIONS.has(value) ? value : "left-25";
};

const normalizeRepeatableItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: String(item?.id || randomUUID()),
    title: sanitizeText(item?.title),
    description: sanitizeRichText(item?.description),
    image: item?.image ?? "",
    imageCaption: sanitizeText(item?.imageCaption),
    background: REPEATABLE_BACKGROUNDS.has(item?.background)
      ? item.background
      : "white",
    imagePosition: normalizeRepeatableImagePosition(item?.imagePosition),
  }));
};

const normalizeRelatedItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: String(item?.id || randomUUID()),
    title: sanitizeText(item?.title),
    description: sanitizeRichText(item?.description),
  }));
};

const normalizeFaqItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: String(item?.id || randomUUID()),
    question: sanitizeText(item?.question),
    answer: sanitizeRichText(item?.answer),
  }));
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
};

const defaultSectionDataByType = {
  [SECTION_TYPES.PAGE_BANNER]: () => ({ pageBannerImage: null }),
  [SECTION_TYPES.TEAM]: () => ({
    teamSectionTitle: "",
    founderTitle: "",
    founderDetails: "",
    founderCtaLabel: "",
    founderCtaLink: "",
    selectedTeamMembers: [],
  }),
  [SECTION_TYPES.PACKAGES]: () => ({
    packagesSectionTitle: "",
    packagesSectionSubtitle: "",
    packagesSectionDescription: "",
    packagesSectionPackageIds: [],
  }),
  [SECTION_TYPES.REPEATABLE_TEXT_IMAGE]: () => ({
    items: [],
  }),
  [SECTION_TYPES.GALLERY]: () => ({ galleryImages: [] }),
  [SECTION_TYPES.RELATED_INFORMATION]: () => ({
    items: [],
  }),
  [SECTION_TYPES.FAQ]: () => ({
    faqSectionTitle: "",
    items: [],
  }),
};

const getDefaultSectionData = (type) => {
  const createDefault = defaultSectionDataByType[type];
  if (!createDefault) return {};
  return createDefault();
};

const normalizeSectionData = (type, rawData = {}) => {
  const data = rawData && typeof rawData === "object" ? rawData : {};

  switch (type) {
    case SECTION_TYPES.PAGE_BANNER:
      return { pageBannerImage: data.pageBannerImage ?? null };

    case SECTION_TYPES.TEAM:
      return {
        teamSectionTitle: sanitizeText(data.teamSectionTitle),
        founderTitle: sanitizeText(data.founderTitle),
        founderDetails: sanitizeRichText(data.founderDetails),
        founderCtaLabel: sanitizeText(data.founderCtaLabel),
        founderCtaLink: sanitizeText(data.founderCtaLink),
        selectedTeamMembers: normalizeStringArray(data.selectedTeamMembers),
      };

    case SECTION_TYPES.PACKAGES:
      return {
        packagesSectionTitle: sanitizeText(data.packagesSectionTitle),
        packagesSectionSubtitle: sanitizeText(data.packagesSectionSubtitle),
        packagesSectionDescription: sanitizeRichText(data.packagesSectionDescription),
        packagesSectionPackageIds: normalizeStringArray(data.packagesSectionPackageIds),
      };

    case SECTION_TYPES.REPEATABLE_TEXT_IMAGE:
      return {
        items: normalizeRepeatableItems(data.items),
      };

    case SECTION_TYPES.GALLERY:
      return {
        galleryImages: Array.isArray(data.galleryImages)
          ? data.galleryImages.filter(Boolean)
          : [],
      };

    case SECTION_TYPES.RELATED_INFORMATION:
      return {
        items: normalizeRelatedItems(data.items),
      };

    case SECTION_TYPES.FAQ:
      return {
        faqSectionTitle: sanitizeText(data.faqSectionTitle),
        items: normalizeFaqItems(data.items),
      };

    default:
      return {};
  }
};

const hasRichTextContent = (value) => {
  const text = String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim();
  return text.length > 0;
};

const hasMeaningfulSectionData = (type, data = {}) => {
  switch (type) {
    case SECTION_TYPES.PAGE_BANNER:
      return !!data.pageBannerImage;

    case SECTION_TYPES.TEAM:
      return (
        !!data.teamSectionTitle ||
        !!data.founderTitle ||
        hasRichTextContent(data.founderDetails) ||
        !!data.founderCtaLabel ||
        !!data.founderCtaLink ||
        (data.selectedTeamMembers || []).length > 0
      );

    case SECTION_TYPES.PACKAGES:
      return (
        !!data.packagesSectionTitle ||
        !!data.packagesSectionSubtitle ||
        hasRichTextContent(data.packagesSectionDescription) ||
        (data.packagesSectionPackageIds || []).length > 0
      );

    case SECTION_TYPES.REPEATABLE_TEXT_IMAGE:
      return (data.items || []).length > 0;

    case SECTION_TYPES.GALLERY:
      return (data.galleryImages || []).length > 0;

    case SECTION_TYPES.RELATED_INFORMATION:
      return (data.items || []).some(
        (item) => item && (item.title || hasRichTextContent(item.description))
      );

    case SECTION_TYPES.FAQ:
      return !!data.faqSectionTitle || (data.items || []).length > 0;

    default:
      return false;
  }
};

const buildLegacySectionsFromContent = (content = {}) => {
  const fallbackRepeatableItems =
    Array.isArray(content.repeatableSections) && content.repeatableSections.length > 0
      ? content.repeatableSections
      : (() => {
          const description =
            typeof content.description === "string" ? content.description : "";
          const hasDescription = hasRichTextContent(description);
          if (!hasDescription) return [];
          return [
            {
              id: randomUUID(),
              title: content.title || "",
              description,
              image: content.coverImage || "",
              imageCaption: "",
              background: "white",
              imagePosition: content.coverImage ? "right-50" : "left-50",
            },
          ];
        })();

  const sectionEntries = [
    {
      type: SECTION_TYPES.PAGE_BANNER,
      data: {
        pageBannerImage: content.pageBannerImage ?? null,
      },
    },
    {
      type: SECTION_TYPES.TEAM,
      data: {
        teamSectionTitle: content.teamSectionTitle || "",
        founderTitle: content.founderTitle || "",
        founderDetails: content.founderDetails || "",
        founderCtaLabel: content.founderCtaLabel || "",
        founderCtaLink: content.founderCtaLink || "",
        selectedTeamMembers: content.selectedTeamMembers || [],
      },
    },
    {
      type: SECTION_TYPES.PACKAGES,
      data: {
        packagesSectionTitle: content.packagesSectionTitle || "",
        packagesSectionSubtitle: content.packagesSectionSubtitle || "",
        packagesSectionDescription: content.packagesSectionDescription || "",
        packagesSectionPackageIds: content.packagesSectionPackageIds || [],
      },
    },
    {
      type: SECTION_TYPES.REPEATABLE_TEXT_IMAGE,
      data: {
        items: fallbackRepeatableItems,
      },
    },
    {
      type: SECTION_TYPES.GALLERY,
      data: {
        galleryImages: content.galleryImages || [],
      },
    },
    {
      type: SECTION_TYPES.RELATED_INFORMATION,
      data: {
        items: content.relatedInformation || [],
      },
    },
    {
      type: SECTION_TYPES.REPEATABLE_TEXT_IMAGE,
      data: {
        items: content.repeatableSectionsAfterRelated || [],
      },
    },
    {
      type: SECTION_TYPES.FAQ,
      data: {
        faqSectionTitle: content.faqSectionTitle || "",
        items: content.faq || [],
      },
    },
  ];

  return sectionEntries
    .map((entry) => {
      const normalizedData = normalizeSectionData(entry.type, entry.data);
      return {
        type: entry.type,
        data: normalizedData,
        is_enabled: hasMeaningfulSectionData(entry.type, normalizedData),
      };
    })
    .filter((entry) => entry.is_enabled);
};

module.exports = {
  SECTION_TYPES,
  VALID_SECTION_TYPES,
  getDefaultSectionData,
  normalizeSectionData,
  hasMeaningfulSectionData,
  buildLegacySectionsFromContent,
};
