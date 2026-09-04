"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import { Clock } from "lucide-react";
import Gallery from "@/components/Gallery";
import Form from "@/components/Form";
import { BASE_URL } from "@/config/Config";
import { getMediaAlt, getMediaObject, getMediaUrl } from "@/lib/media";
import {
  buildReviewCountMap,
  getPackageCardAlt,
  getPackageKeys,
  getPackageReviewCount,
  normalizePackageRecord,
} from "@/lib/packageListing";

const sanitizeHtml = (html) =>
  DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "img",
      "blockquote",
      "div",
      "span",
      "figure",
      "figcaption",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
  });

const removeEmptyParagraphs = (html = "") =>
  html.replace(
    /<p>(?:\s|&nbsp;|&#160;|<br\s*\/?>|<span[^>]*>\s*<\/span>)*<\/p>/gi,
    ""
  );

const normalizeLegacyCmsHtml = (html = "") =>
  String(html)
    .replace(/\[caption\b[^\]]*\]/gi, '<figure class="cms-wp-caption">')
    .replace(/\[\/caption\]/gi, "</figure>");

const stripHtml = (html = "") =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;/gi, " ").trim();

const getCleanHtml = (html) =>
  removeEmptyParagraphs(sanitizeHtml(normalizeLegacyCmsHtml(html || "")));

const hasMeaningfulHtml = (html) => stripHtml(getCleanHtml(html)).length > 0;

const normalizeHeading = (value = "") =>
  stripHtml(String(value)).replace(/\s+/g, " ").trim().toLowerCase();

const listStyleClasses =
  "[&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-2 [&_ol]:list-none [&_ol]:pl-0 [&_ol]:space-y-2 [&_ol]:ml-3 [&_li]:relative [&_li]:pl-7 [&_li]:text-[1.125rem] [&_li]:font-medium [&_li]:text-gray-700 [&_li]:leading-relaxed [&_li]:before:content-['›'] [&_li]:before:text-[1.9rem] [&_li]:before:font-semibold [&_li]:before:text-emerald-600 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-0 [&_li]:before:leading-none";

const legacySections = (content = {}) => [
  {
    type: "pageBanner",
    is_enabled: !!content.pageBannerImage,
    data: {
      pageBannerImage: content.pageBannerImage || null,
    },
    sort_order: 1,
  },
  {
    type: "team",
    is_enabled:
      !!content.teamSectionTitle ||
      !!content.founderTitle ||
      !!content.founderDetails ||
      !!content.founderCtaLabel ||
      !!content.founderCtaLink ||
      (content.selectedTeamMembers || []).length > 0,
    data: {
      teamSectionTitle: content.teamSectionTitle || "",
      founderTitle: content.founderTitle || "",
      founderDetails: content.founderDetails || "",
      founderCtaLabel: content.founderCtaLabel || "Meet the Owner",
      founderCtaLink: content.founderCtaLink || "/meet-the-owner",
      selectedTeamMembers: content.selectedTeamMembers || [],
    },
    sort_order: 2,
  },
  {
    type: "packages",
    is_enabled:
      !!content.packagesSectionTitle ||
      !!content.packagesSectionSubtitle ||
      !!content.packagesSectionDescription ||
      (content.packagesSectionPackageIds || []).length > 0,
    data: {
      packagesSectionTitle: content.packagesSectionTitle || "",
      packagesSectionSubtitle: content.packagesSectionSubtitle || "",
      packagesSectionDescription: content.packagesSectionDescription || "",
      packagesSectionPackageIds: (
        content.packagesSectionPackageIds || []
      ).map(String),
    },
    sort_order: 3,
  },
  {
    type: "repeatableTextImage",
    is_enabled: (content.repeatableSections || []).length > 0,
    data: {
      items: content.repeatableSections || [],
    },
    sort_order: 4,
  },
  {
    type: "gallery",
    is_enabled: (content.galleryImages || []).length > 0,
    data: {
      galleryImages: content.galleryImages || [],
    },
    sort_order: 5,
  },
  {
    type: "relatedInformation",
    is_enabled: (content.relatedInformation || []).length > 0,
    data: {
      items: content.relatedInformation || [],
    },
    sort_order: 6,
  },
  {
    type: "repeatableTextImage",
    is_enabled:
      (content.repeatableSectionsAfterRelated || []).length > 0,
    data: {
      items: content.repeatableSectionsAfterRelated || [],
    },
    sort_order: 7,
  },
  {
    type: "faq",
    is_enabled:
      !!content.faqSectionTitle || (content.faq || []).length > 0,
    data: {
      faqSectionTitle:
        content.faqSectionTitle || "Frequently Asked Questions",
      items: content.faq || [],
    },
    sort_order: 8,
  },
  {
    type: "bookingForm",
    is_enabled: !!content.showBookingForm,
    data: {
      showBookingForm: !!content.showBookingForm,
    },
    sort_order: 9,
  },
];

const CmsContentRenderer = ({
  pageData,
  error,
  backLink,
  backLabel = "Back",
  headingClassName = "d-color mb-4 wow fadeInUp",
  headingStyle = {
    fontSize: "calc(1.375rem + 1.5vw)",
    fontWeight: 600,
  },
  containerClassName =
    "max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 py-8 font-sans text-gray-700",
  forceBookingForm = false,
  children,
}) => {
  const safePageData = pageData || {};
  const content = safePageData.content || {};

  const title =
    content.title ||
    safePageData.title ||
    safePageData.section ||
    "Page";

  const subtitle = safePageData.subtitle || content.subtitle;
  const description =
    content.description || safePageData.description;

  const coverImage =
    content.coverImage || safePageData.coverImage;

  const coverImagePosition =
    content.coverImagePosition ||
    safePageData.coverImagePosition ||
    "none";

  const tours = content.tours || safePageData.tours;

  const isAboutPage = [
    safePageData.slug,
    safePageData.section,
    title,
  ]
    .filter(Boolean)
    .some(
      (value) =>
        String(value)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-") === "about-us"
    );

  const resolvedContainerClassName = isAboutPage
    ? "max-w-6xl mx-auto px-5 md:px-10 lg:px-16 xl:px-20 py-8 font-sans text-gray-700"
    : containerClassName;

  const sections = useMemo(() => {
    const fromApi = Array.isArray(safePageData.sections)
      ? safePageData.sections
      : [];

    const normalized =
      fromApi.length > 0
        ? fromApi
        : legacySections(content);

    return [...normalized].sort((a, b) => {
      const aSort = Number(a?.sort_order ?? 0);
      const bSort = Number(b?.sort_order ?? 0);
      return aSort - bSort;
    });
  }, [safePageData.sections, content]);

  const enabledSections = useMemo(
    () =>
      sections.filter(
        (section) =>
          section && section.is_enabled !== false
      ),
    [sections]
  );

  const shouldFetchTeam = enabledSections.some(
    (section) => section.type === "team"
  );

  const shouldFetchPackages = enabledSections.some(
    (section) => section.type === "packages"
  );

  const [teamMembers, setTeamMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [reviewCountMap, setReviewCountMap] = useState({});
  const [
    activeRelatedIndexBySection,
    setActiveRelatedIndexBySection,
  ] = useState({});

  const relatedInfoRef = useRef(null);

  useEffect(() => {
    if (!shouldFetchTeam) return;

    let active = true;

    const fetchTeam = async () => {
      try {
        const response = await fetch(`${BASE_URL}/team/`);
        const payload = await response.json();

        const members =
          payload?.teams ||
          payload?.data ||
          payload ||
          [];

        if (active) {
          setTeamMembers(
            Array.isArray(members) ? members : []
          );
        }
      } catch {
        if (active) {
          setTeamMembers([]);
        }
      }
    };

    fetchTeam();

    return () => {
      active = false;
    };
  }, [shouldFetchTeam]);

  useEffect(() => {
    if (!shouldFetchPackages) return;

    let active = true;

    const fetchPackages = async () => {
      try {
        const packagesResponse = await fetch(
          `${BASE_URL}/package-tour/`
        );

        const packagesPayload =
          await packagesResponse.json();

        const list =
          packagesPayload?.data ||
          packagesPayload ||
          [];

        const reviewsPayload = await fetch(
          `${BASE_URL}/review/?limit=5000`
        )
          .then((response) => response.json())
          .catch(() => []);

        const reviews =
          reviewsPayload?.data ||
          reviewsPayload?.reviews ||
          reviewsPayload ||
          [];

        if (active) {
          setPackages(
            list.map(normalizePackageRecord)
          );

          setReviewCountMap(
            buildReviewCountMap(reviews)
          );
        }
      } catch {
        if (active) {
          setPackages([]);
          setReviewCountMap({});
        }
      }
    };

    fetchPackages();

    return () => {
      active = false;
    };
  }, [shouldFetchPackages]);

  const teamLookup = useMemo(() => {
    const map = new Map();

    (teamMembers || []).forEach((member) => {
      map.set(member.id || member.name, member);
    });

    return map;
  }, [teamMembers]);

  const packageLookup = useMemo(() => {
    const map = new Map();

    packages.forEach((pkg) => {
      getPackageKeys(pkg).forEach((key) =>
        map.set(String(key), pkg)
      );
    });

    return map;
  }, [packages]);

  const coverImageMedia = getMediaObject(coverImage);
  const coverImageUrl = getMediaUrl(
    coverImageMedia,
    "large"
  );

  const coverImageAlt = getMediaAlt(
    coverImageMedia,
    title || "Cover image"
  );

  const coverImageObjectPosition = (() => {
    switch (coverImagePosition) {
      case "left-25":
        return "25% center";
      case "left-50":
        return "50% center";
      case "right-25":
        return "right 25%";
      case "right-50":
        return "right 50%";
      default:
        return "center";
    }
  })();

  const isObjectPositionCoverImage =
    coverImagePosition === "left-25" ||
    coverImagePosition === "left-50" ||
    coverImagePosition === "right-25" ||
    coverImagePosition === "right-50";

  const isCoverImageLeft =
    !String(coverImagePosition).startsWith("right");

  const coverImageGridTemplate = (() => {
    switch (coverImagePosition) {
      case "left-25":
        return "lg:grid-cols-[25%_minmax(0,1fr)]";
      case "left-50":
        return "lg:grid-cols-[50%_minmax(0,1fr)]";
      case "right-25":
        return "lg:grid-cols-[minmax(0,1fr)_25%]";
      case "right-50":
        return "lg:grid-cols-[minmax(0,1fr)_50%]";
      default:
        return "lg:grid-cols-[360px_minmax(0,1fr)]";
    }
  })();

  const topBanners = enabledSections
    .filter(
      (section) => section.type === "pageBanner"
    )
    .map((section, index) => {
      const media = getMediaObject(
        section.data?.pageBannerImage
      );

      const url = getMediaUrl(media, "large");

      if (!url) return null;

      return (
        <div
          key={
            section.id || `banner-${index}`
          }
          className="w-full h-48 md:h-64 relative overflow-hidden bg-sky-200"
        >
          <img
            src={url}
            alt={getMediaAlt(
              media,
              title || "Page banner"
            )}
            className="w-full h-full object-cover object-center"
          />
        </div>
      );
    })
    .filter(Boolean);

  const showBookingForm =
    forceBookingForm ||
    enabledSections.some(
      (section) =>
        section.type === "bookingForm" &&
        section.data?.showBookingForm
    );

  const renderRepeatableItems = (
    items = [],
    sectionKey = ""
  ) => {
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return null;
    }

    const visibleItems = items.filter(
      (item) =>
        !(
          isAboutPage &&
          normalizeHeading(item?.title) ===
            "our team"
        )
    );

    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <div className="space-y-8">
        {visibleItems.map((item, index) => {
          const imageMedia = getMediaObject(
            item.image
          );

          const imageUrl = getMediaUrl(
            imageMedia,
            "large"
          );

          const imageAlt = getMediaAlt(
            imageMedia,
            item.title || "Section image"
          );

          const isLight =
            item.background === "light";

          /*
           * DEBUG:
           * This tells us exactly what the local API/CMS
           * is returning for each repeatable section.
           */
          console.log(
            "DEDICATED TEAM DEBUG:",
            {
              isAboutPage,
              title: item.title,
              description: item.description,
            }
          );

          const isDedicatedTeamSection =
            isAboutPage &&
            (
              String(item.title || "")
                .trim()
                .toLowerCase() ===
                "our dedicated team" ||
              String(item.description || "")
                .toLowerCase()
                .includes(
                  "our dedicated team"
                )
            );

          const imagePosition =
            item.imagePosition ||
            "left-25";

          const imageLeft =
            !String(
              imagePosition
            ).startsWith("right");

          const gridTemplateClass = (() => {
            switch (imagePosition) {
              case "left-25":
                return "md:grid-cols-[25%_minmax(0,1fr)]";
              case "left-50":
                return "md:grid-cols-[50%_minmax(0,1fr)]";
              case "right-25":
                return "md:grid-cols-[minmax(0,1fr)_25%]";
              case "right-50":
                return "md:grid-cols-[minmax(0,1fr)_50%]";
              default:
                return "md:grid-cols-[360px_minmax(0,1fr)]";
            }
          })();

          const sectionImageObjectPosition =
            (() => {
              switch (imagePosition) {
                case "left-25":
                  return "25% center";
                case "left-50":
                  return "50% center";
                case "right-25":
                  return "right 25%";
                case "right-50":
                  return "right 50%";
                default:
                  return "center";
              }
            })();

          const key =
            item.id ||
            `${sectionKey}-${index}`;

          return (
            <section
              key={key}
              className={`${
                isLight
                  ? "bg-gray-50"
                  : "bg-white"
              } py-4`}
            >
              <div
                className={
                  imageUrl
                    ? `grid grid-cols-1 gap-8 items-start ${
                        isDedicatedTeamSection
                          ? "cms-dedicated-team-grid"
                          : ""
                      } ${
                        isDedicatedTeamSection
                          ? "lg:items-stretch"
                          : ""
                      } ${gridTemplateClass}`
                    : "grid grid-cols-1"
                }
              >
                {imageUrl &&
                  imageLeft && (
                    <div
                      className={`w-full ${
                        isDedicatedTeamSection
                          ? "lg:h-full"
                          : ""
                      }`}
                    >
                      <figure
                        className={
                          isDedicatedTeamSection
                            ? "lg:h-full"
                            : ""
                        }
                      >
                        <img
                          src={imageUrl}
                          alt={imageAlt}
                          className={`w-full h-64 object-cover rounded-lg ${
                            isDedicatedTeamSection
                              ? "lg:h-full lg:max-h-[520px]"
                              : ""
                          }`}
                          style={{
                            objectPosition:
                              sectionImageObjectPosition,
                          }}
                        />

                        {item.imageCaption && (
                          <figcaption className="mt-3 inline-block border-l-4 border-green-500 pl-3 pr-4 py-2 text-sm italic text-gray-600 bg-gray-100">
                            {item.imageCaption}
                          </figcaption>
                        )}
                      </figure>
                    </div>
                  )}

                <div>
                  {item.title &&
                    !(
                      index === 0 &&
                      normalizeHeading(
                        item.title
                      ) ===
                        normalizeHeading(
                          title
                        )
                    ) && (
                      <h3
                        className="text-3xl font-semibold text-green-600 mb-4"
                        style={{
                          fontFamily:
                            '"MuseoModerno", sans-serif',
                        }}
                      >
                        {item.title}
                      </h3>
                    )}

                  {hasMeaningfulHtml(
                    item.description
                  ) && (
                    <div
                      className={`cms-rich-content prose prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed ${listStyleClasses} ${
                        isAboutPage &&
                        item.title ===
                          "About Us"
                          ? "about-us-intro"
                          : ""
                      }`}
                      dangerouslySetInnerHTML={{
                        __html:
                          getCleanHtml(
                            item.description
                          ),
                      }}
                    />
                  )}
                </div>

                {imageUrl &&
                  !imageLeft && (
                    <div
                      className={`w-full ${
                        isDedicatedTeamSection
                          ? "lg:h-full"
                          : ""
                      }`}
                    >
                      <figure
                        className={
                          isDedicatedTeamSection
                            ? "lg:h-full"
                            : ""
                        }
                      >
                        <img
                          src={imageUrl}
                          alt={imageAlt}
                          className={`w-full h-64 object-cover rounded-lg ${
                            isDedicatedTeamSection
                              ? "lg:h-full lg:max-h-[520px]"
                              : ""
                          }`}
                          style={{
                            objectPosition:
                              sectionImageObjectPosition,
                          }}
                        />

                        {item.imageCaption && (
                          <figcaption className="mt-3 inline-block border-l-4 border-green-500 pl-3 pr-4 py-2 text-sm italic text-gray-600 bg-gray-100">
                            {item.imageCaption}
                          </figcaption>
                        )}
                      </figure>
                    </div>
                  )}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  if (error || !pageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50 px-4">
        <p className="text-red-600 text-xl text-center">
          {error || "Page not found"}
        </p>

        {backLink && (
          <Link
            href={backLink}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {backLabel}
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {topBanners}

      <div
        className={
          resolvedContainerClassName
        }
      >
        {backLink && (
          <div className="mb-6">
            <Link
              href={backLink}
              className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>

              {backLabel}
            </Link>
          </div>
        )}

        <div className="mb-10">
          {subtitle && (
            <span
              className="tracking-wide uppercase"
              style={{
                color: "#9eca83",
                fontSize: "120%",
                fontFamily:
                  '"MuseoModerno", sans-serif',
                display: "block",
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </span>
          )}

          <h1
            className={headingClassName}
            style={headingStyle}
          >
            {title}
          </h1>

          {coverImageUrl ? (
            coverImagePosition ===
            "none" ? (
              <>
                <div className="mt-4">
                  <img
                    src={coverImageUrl}
                    alt={coverImageAlt}
                    className="w-full max-h-[420px] object-cover rounded-xl"
                    style={{
                      objectPosition:
                        coverImageObjectPosition,
                    }}
                  />
                </div>

                {hasMeaningfulHtml(
                  description
                ) && (
                  <div
                    className={`prose prose-base md:prose-lg max-w-none text-gray-600 leading-relaxed ${listStyleClasses}`}
                    dangerouslySetInnerHTML={{
                      __html:
                        getCleanHtml(
                          description
                        ),
                    }}
                  />
                )}
              </>
            ) : isObjectPositionCoverImage ? (
              <div className="mt-4">
                <div
                  className={`grid grid-cols-1 gap-8 items-start ${coverImageGridTemplate}`}
                >
                  {isCoverImageLeft && (
                    <div className="w-full">
                      <img
                        src={coverImageUrl}
                        alt={coverImageAlt}
                        className="w-full h-full object-cover rounded-xl"
                        style={{
                          objectPosition:
                            coverImageObjectPosition,
                        }}
                      />
                    </div>
                  )}

                  <div
                    className={`prose prose-base md:prose-lg max-w-none text-gray-600 leading-relaxed ${listStyleClasses}`}
                    dangerouslySetInnerHTML={{
                      __html:
                        getCleanHtml(
                          description
                        ),
                    }}
                  />

                  {!isCoverImageLeft && (
                    <div className="w-full">
                      <img
                        src={coverImageUrl}
                        alt={coverImageAlt}
                        className="w-full h-full object-cover rounded-xl"
                        style={{
                          objectPosition:
                            coverImageObjectPosition,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`prose prose-base md:prose-lg max-w-none text-gray-600 leading-relaxed ${listStyleClasses}`}
                dangerouslySetInnerHTML={{
                  __html:
                    getCleanHtml(
                      description
                    ),
                }}
              />
            )
          ) : (
            hasMeaningfulHtml(
              description
            ) && (
              <div
                className={`prose prose-base md:prose-lg max-w-none text-gray-600 leading-relaxed ${listStyleClasses}`}
                dangerouslySetInnerHTML={{
                  __html:
                    getCleanHtml(
                      description
                    ),
                }}
              />
            )
          )}
        </div>

        {enabledSections.map(
          (section, index) => {
            if (
              section.type ===
              "pageBanner"
            ) {
              return null;
            }

            if (
              section.type === "team"
            ) {
              const data =
                section.data || {};

              const selectedTeam =
                (
                  data.selectedTeamMembers ||
                  []
                )
                  .map((id) =>
                    teamLookup.get(id)
                  )
                  .filter(Boolean);

              const founder =
                selectedTeam[0] ||
                null;

              if (!founder) {
                return null;
              }

              return (
                <section
                  key={
                    section.id ||
                    `team-${index}`
                  }
                  className="mb-12"
                >
                  <h2 className="text-2xl font-semibold text-green-600 mb-6">
                    {data.teamSectionTitle ||
                      "Our Team"}
                  </h2>

                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-72 shrink-0">
                      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <img
                          src={
                            founder.imageUrl ||
                            "/placeholder-team.jpg"
                          }
                          alt={
                            founder.name ||
                            "Founder"
                          }
                          className="w-full h-80 object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-green-700 mb-4">
                        {data.founderTitle ||
                          `Short Biography of ${
                            founder.name ||
                            "Founder"
                          }`}
                      </h3>

                      <div
                        className="prose prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html:
                            getCleanHtml(
                              data.founderDetails ||
                                founder.description ||
                                ""
                            ),
                        }}
                      />

                      <div className="mt-4">
                        <Link
                          href={
                            data.founderCtaLink ||
                            "/meet-the-owner"
                          }
                          className="inline-flex items-center px-4 py-2 rounded-md bg-[#9cc37f] text-white font-medium hover:bg-[#89b56b] transition-colors"
                        >
                          {data.founderCtaLabel ||
                            "Meet the Owner"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              );
            }

            if (
              section.type ===
              "packages"
            ) {
              const data =
                section.data || {};

              const selected =
                (
                  data.packagesSectionPackageIds ||
                  []
                )
                  .map((id) =>
                    packageLookup.get(
                      String(id)
                    )
                  )
                  .filter(Boolean);

              if (
                !data.packagesSectionTitle &&
                !data.packagesSectionSubtitle &&
                !hasMeaningfulHtml(
                  data.packagesSectionDescription
                ) &&
                selected.length === 0
              ) {
                return null;
              }

              return (
                <section
                  key={
                    section.id ||
                    `packages-${index}`
                  }
                  className="mb-8"
                >
                  {data.packagesSectionTitle && (
                    <div>
                      <h2
                        className={
                          headingClassName
                        }
                        style={{
                          ...headingStyle,
                          fontFamily:
                            '"MuseoModerno", sans-serif',
                        }}
                      >
                        {
                          data.packagesSectionTitle
                        }
                      </h2>

                      {data.packagesSectionSubtitle && (
                        <span
                          className="mt-2 tracking-wide uppercase"
                          style={{
                            color:
                              "#9eca83",
                            fontSize:
                              "120%",
                            fontFamily:
                              '"MuseoModerno", sans-serif',
                            display:
                              "block",
                            fontWeight: 500,
                            lineHeight: 1.5,
                          }}
                        >
                          {
                            data.packagesSectionSubtitle
                          }
                        </span>
                      )}
                    </div>
                  )}

                  {!data.packagesSectionTitle &&
                    data.packagesSectionSubtitle && (
                      <span
                        className="tracking-wide uppercase"
                        style={{
                          color:
                            "#9eca83",
                          fontSize:
                            "150%",
                          fontFamily:
                            '"MuseoModerno", sans-serif',
                          display:
                            "block",
                          fontWeight: 500,
                          lineHeight: 1.5,
                        }}
                      >
                        {
                          data.packagesSectionSubtitle
                        }
                      </span>
                    )}

                  {hasMeaningfulHtml(
                    data.packagesSectionDescription
                  ) && (
                    <div
                      className="mt-4 text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html:
                          getCleanHtml(
                            data.packagesSectionDescription
                          ),
                      }}
                    />
                  )}

                  {selected.length >
                    0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {selected.map(
                        (
                          item,
                          itemIndex
                        ) => {
                          const rawTitle =
                            item.title ||
                            "";

                          const slug =
                            item.slug ||
                            (rawTitle
                              ? rawTitle
                                  .toLowerCase()
                                  .replace(
                                    /,/g,
                                    ""
                                  )
                                  .replace(
                                    /\s+/g,
                                    "-"
                                  )
                              : "");

                          const media =
                            getMediaObject(
                              item.mainImage ||
                                item.image
                            );

                          const imageSrc =
                            getMediaUrl(
                              media,
                              "medium"
                            ) ||
                            "/bhutan.jpg";

                          const reviewCount =
                            getPackageReviewCount(
                              item,
                              reviewCountMap
                            );

                          const descriptionText =
                            item.sub_description ||
                            item.subDescription ||
                            "";

                          return (
                            <div
                              key={
                                item.id ??
                                item._id ??
                                itemIndex
                              }
                              className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200"
                            >
                              {slug ? (
                                <Link
                                  href={`/${slug}`}
                                  className="relative h-56 w-full overflow-hidden"
                                >
                                  <img
                                    src={
                                      imageSrc
                                    }
                                    alt={getPackageCardAlt(
                                      media,
                                      item,
                                      "Featured package image"
                                    )}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                  />
                                </Link>
                              ) : (
                                <div className="relative h-56 w-full overflow-hidden">
                                  <img
                                    src={
                                      imageSrc
                                    }
                                    alt="Featured package image"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              <div className="pt-4 px-4 pb-5">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2 leading-tight">
                                  {item.title ||
                                    "Featured Package"}
                                </h3>

                                {descriptionText ? (
                                  <p
                                    className="text-base text-emerald-500 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                      __html:
                                        sanitizeHtml(
                                          descriptionText
                                        ),
                                    }}
                                  />
                                ) : (
                                  <p className="text-base text-emerald-500 leading-relaxed">
                                    Explore this featured package.
                                  </p>
                                )}

                                <div className="mt-2 text-sm text-gray-400">
                                  ({reviewCount}{" "}
                                  reviews)
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                                    <Clock className="w-4 h-4 text-emerald-600" />

                                    <span>
                                      {item.duration ||
                                        "5 Days"}
                                      ,{" "}
                                      {item.tourType ||
                                        item.type ||
                                        "Private Tour"}
                                    </span>
                                  </div>

                                  {slug && (
                                    <Link
                                      href={`/${slug}`}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded shadow-sm transition-colors duration-200"
                                    >
                                      View Details
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </section>
              );
            }

            if (
              section.type ===
              "repeatableTextImage"
            ) {
              return (
                <div
                  key={
                    section.id ||
                    `repeatable-${index}`
                  }
                  className="mb-10"
                >
                  {renderRepeatableItems(
                    section.data?.items ||
                      [],
                    section.id ||
                      `repeatable-${index}`
                  )}
                </div>
              );
            }

            if (
              section.type ===
              "gallery"
            ) {
              const galleryImages =
                section.data
                  ?.galleryImages || [];

              if (
                !Array.isArray(
                  galleryImages
                ) ||
                galleryImages.length ===
                  0
              ) {
                return null;
              }

              return (
                <div
                  key={
                    section.id ||
                    `gallery-${index}`
                  }
                  className="mt-12 relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#86c167] py-12"
                >
                  <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">
                    <Gallery
                      galleryImages={
                        galleryImages
                      }
                      title="Photo/Visual Gallery"
                      embedded
                    />
                  </div>
                </div>
              );
            }

            if (
              section.type ===
              "relatedInformation"
            ) {
              const items = Array.isArray(
                section.data?.items
              )
                ? section.data.items.filter(
                    (item) =>
                      item &&
                      (item.title ||
                        item.description)
                  )
                : [];

              if (
                items.length === 0
              ) {
                return null;
              }

              const key =
                section.id ||
                `related-${index}`;

              const activeIndex = Math.min(
                activeRelatedIndexBySection[
                  key
                ] || 0,
                items.length - 1
              );

              const activeItem =
                items[activeIndex];

              return (
                <div
                  key={key}
                  className="mt-12 scroll-mt-24"
                  ref={relatedInfoRef}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-8 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
                      {items.map(
                        (
                          item,
                          itemIndex
                        ) => {
                          const isActive =
                            itemIndex ===
                            activeIndex;

                          return (
                            <button
                              key={`${key}-${item.id || itemIndex}`}
                              type="button"
                              onClick={() => {
                                setActiveRelatedIndexBySection(
                                  (prev) => ({
                                    ...prev,
                                    [key]:
                                      itemIndex,
                                  })
                                );

                                requestAnimationFrame(
                                  () => {
                                    relatedInfoRef.current?.scrollIntoView(
                                      {
                                        behavior:
                                          "smooth",
                                        block:
                                          "start",
                                      }
                                    );
                                  }
                                );
                              }}
                              className={`w-full text-left px-5 py-4 text-sm font-semibold uppercase tracking-wide transition-colors ${
                                isActive
                                  ? "bg-[#a9c98c] text-white"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {item.title ||
                                `Information ${
                                  itemIndex +
                                  1
                                }`}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <div className="p-6 md:p-8">
                      {activeItem?.title && (
                        <h3 className="text-2xl font-semibold text-green-600 mb-4">
                          {
                            activeItem.title
                          }
                        </h3>
                      )}

                      {hasMeaningfulHtml(
                        activeItem?.description
                      ) && (
                        <div
                          className={`prose prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed ${listStyleClasses}`}
                          dangerouslySetInnerHTML={{
                            __html:
                              getCleanHtml(
                                activeItem.description
                              ),
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (
              section.type === "faq"
            ) {
              const items =
                section.data?.items ||
                [];

              if (
                !Array.isArray(
                  items
                ) ||
                items.length === 0
              ) {
                return null;
              }

              return (
                <div
                  key={
                    section.id ||
                    `faq-${index}`
                  }
                  className="mt-12"
                >
                  <h2
                    className="text-2xl font-bold text-gray-800 mb-6"
                    style={{
                      fontFamily:
                        '"MuseoModerno", sans-serif',
                    }}
                  >
                    {section.data
                      ?.faqSectionTitle ||
                      "Frequently Asked Questions"}
                  </h2>

                  <div className="space-y-4">
                    {items.map(
                      (
                        faqItem,
                        faqIndex
                      ) => (
                        <details
                          key={`${section.id || "faq"}-${faqItem.id || faqIndex}`}
                          className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50">
                            <span className="text-base pr-4">
                              {
                                faqItem.question
                              }
                            </span>

                            <svg
                              className="w-5 h-5 text-emerald-500 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </summary>

                          {hasMeaningfulHtml(
                            faqItem.answer
                          ) && (
                            <div
                              className="px-4 pb-4 text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html:
                                  getCleanHtml(
                                    faqItem.answer
                                  ),
                              }}
                            />
                          )}
                        </details>
                      )
                    )}
                  </div>
                </div>
              );
            }

            return null;
          }
        )}

        {Array.isArray(tours) &&
          tours.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {safePageData.section ||
                  "Tours"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tours.map(
                  (tour, index) => {
                    const rawImage =
                      tour?.image || "";

                    const imageUrl =
                      rawImage.startsWith(
                        "http"
                      )
                        ? rawImage
                        : `${BASE_URL}/uploads/${rawImage}`;

                    return (
                      <div
                        key={`${tour.name}-${index}`}
                        className="bg-white rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="h-48 overflow-hidden relative bg-gray-100">
                          <img
                            src={imageUrl}
                            alt={
                              tour.name ||
                              "Tour"
                            }
                            onError={(
                              event
                            ) => {
                              event.currentTarget.src =
                                "https://placehold.co/600x400?text=No+Image";
                            }}
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-gray-800 text-lg mb-1 leading-tight h-12 line-clamp-2">
                            {tour.name}
                          </h3>

                          {tour.reviews !==
                            undefined && (
                            <div className="text-xs text-gray-400 mb-3">
                              (
                              {
                                tour.reviews
                              }{" "}
                              reviews )
                            </div>
                          )}

                          <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="mr-1">
                                🕒
                              </span>{" "}
                              {tour.duration ||
                                "Duration"}
                              ,{" "}
                              {tour.difficulty ||
                                "Tour"}
                            </div>

                            <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1 px-3 rounded-sm">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

        {children}

        {showBookingForm && (
          <div className="mt-12">
            <Form />
          </div>
        )}
      </div>
    </>
  );
};

export default CmsContentRenderer;