"use client";

import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import { Clock } from "lucide-react";
import Gallery from "@/components/Gallery";
import Form from "@/components/Form";
import { BASE_URL } from "@/config/Config";
import { getMediaAlt, getMediaObject, getMediaUrl } from "@/lib/media";

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
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
  });

const listStyleClasses =
  "[&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-2 [&_ol]:list-none [&_ol]:pl-0 [&_ol]:space-y-2 [&_ol]:ml-3 [&_li]:relative [&_li]:pl-7 [&_li]:text-[1.125rem] [&_li]:font-medium [&_li]:text-gray-700 [&_li]:leading-relaxed [&_li]:before:content-['›'] [&_li]:before:text-[1.9rem] [&_li]:before:font-semibold [&_li]:before:text-emerald-600 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-0 [&_li]:before:leading-none";

const renderHtmlBlock = (value) => {
  if (!value || value === "<p><br></p>") return null;
  return (
    <div
      className={`prose prose-base md:prose-lg max-w-none text-gray-600 leading-relaxed ${listStyleClasses}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
    />
  );
};

const renderListBlock = (items) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="space-y-4 pl-0 text-base text-gray-600 leading-relaxed list-none">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="relative pl-8 text-gray-700 font-medium leading-relaxed before:content-['›'] before:text-2xl before:font-bold before:text-emerald-500 before:absolute before:left-0 before:top-0"
        >
          {item}
        </li>
      ))}
    </ul>
  );
};

const CmsContentRenderer = ({
  pageData,
  error,
  backLink,
  backLabel = "Back",
  headingClassName = "d-color mb-4 wow fadeInUp",
  headingStyle = { fontSize: "calc(1.375rem + 1.5vw)", fontWeight: 600 },
  containerClassName = "max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 py-8 font-sans text-gray-700",
  forceBookingForm = false,
  children,
}) => {
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

  const content = pageData.content || {};
  const title =
    content.title || pageData.title || pageData.section || "Page";
  const subtitle = pageData.subtitle || content.subtitle;
  const description = content.description || pageData.description;
  const coverImage = content.coverImage || pageData.coverImage;
  const coverImagePosition =
    content.coverImagePosition || pageData.coverImagePosition || "none";
  const pageBannerImage = content.pageBannerImage || pageData.pageBannerImage;
  const galleryImages = content.galleryImages || pageData.galleryImages;
  const faq = content.faq || pageData.faq;
  const faqSectionTitle =
    content.faqSectionTitle || "Frequently Asked Questions";
  const relatedInformation = content.relatedInformation || [];
  const showBookingForm =
    forceBookingForm || content.showBookingForm || pageData.showBookingForm;
  const tours = content.tours || pageData.tours;
  const teamSectionTitle = content.teamSectionTitle || "";
  const founderTitle = content.founderTitle || "";
  const founderDetails = content.founderDetails || "";
  const founderCtaLabel = content.founderCtaLabel || "Meet the Owner";
  const founderCtaLink = content.founderCtaLink || "/meet-the-owner";
  const selectedTeamMembers = content.selectedTeamMembers || [];
  const packagesSectionTitle = content.packagesSectionTitle || "";
  const packagesSectionSubtitle = content.packagesSectionSubtitle || "";
  const packagesSectionDescription = content.packagesSectionDescription || "";
  const packagesSectionPackageIds = (
    content.packagesSectionPackageIds || []
  ).map(String);
  const repeatableSections = content.repeatableSections || [];

  const [teamMembers, setTeamMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [activeRelatedIndex, setActiveRelatedIndex] = useState(0);

  const showTeamSection = useMemo(() => {
    return (
      !!teamSectionTitle ||
      !!founderTitle ||
      !!founderDetails ||
      (selectedTeamMembers || []).length > 0
    );
  }, [teamSectionTitle, founderTitle, founderDetails, selectedTeamMembers]);

  const showPackagesSection = useMemo(() => {
    return (
      !!packagesSectionTitle ||
      !!packagesSectionSubtitle ||
      !!packagesSectionDescription ||
      (packagesSectionPackageIds || []).length > 0
    );
  }, [
    packagesSectionTitle,
    packagesSectionSubtitle,
    packagesSectionDescription,
    packagesSectionPackageIds,
  ]);

  useEffect(() => {
    if (!showTeamSection) return;
    let active = true;
    const fetchTeam = async () => {
      try {
        const response = await fetch(`${BASE_URL}/team/`);
        const payload = await response.json();
        const members = payload?.teams || payload?.data || payload || [];
        if (active) {
          setTeamMembers(Array.isArray(members) ? members : []);
        }
      } catch (error) {
        if (active) setTeamMembers([]);
      }
    };
    fetchTeam();
    return () => {
      active = false;
    };
  }, [showTeamSection]);

  useEffect(() => {
    if (!showPackagesSection) return;
    let active = true;
    const fetchPackages = async () => {
      try {
        const response = await fetch(`${BASE_URL}/package-tour/`);
        const payload = await response.json();
        const list = payload?.data || payload || [];
        if (active) {
          setPackages(list.map((pkg) => pkg.package || pkg));
        }
      } catch (error) {
        if (active) setPackages([]);
      }
    };
    fetchPackages();
    return () => {
      active = false;
    };
  }, [showPackagesSection]);

  const teamLookup = useMemo(() => {
    const map = new Map();
    (teamMembers || []).forEach((member) => {
      map.set(member.id || member.name, member);
    });
    return map;
  }, [teamMembers]);

  const selectedTeam = useMemo(() => {
    return (selectedTeamMembers || [])
      .map((id) => teamLookup.get(id))
      .filter(Boolean);
  }, [selectedTeamMembers, teamLookup]);

  const founderMember = useMemo(() => {
    return selectedTeam[0] || null;
  }, [selectedTeam]);

  const selectedPackages = useMemo(() => {
    const ids = (packagesSectionPackageIds || []).map(String);
    const map = new Map();
    packages.forEach((pkg) => {
      const key =
        pkg.id ??
        pkg._id ??
        pkg.packageId ??
        pkg.package_id ??
        pkg.slug ??
        pkg.title;
      if (key == null) return;
      map.set(String(key), pkg);
    });
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, [packages, packagesSectionPackageIds]);

  const coverImageMedia = getMediaObject(coverImage);
  const coverImageUrl = getMediaUrl(coverImageMedia, "large");
  const coverImageAlt = getMediaAlt(coverImageMedia, title || "Cover image");
  const bannerMedia = getMediaObject(pageBannerImage);
  const bannerImageUrl = getMediaUrl(bannerMedia, "large");
  const bannerImageAlt = getMediaAlt(bannerMedia, title || "Page banner");
  const relatedItems = Array.isArray(relatedInformation)
    ? relatedInformation.filter((item) => item && (item.title || item.description))
    : [];
  const activeRelatedItem =
    relatedItems.length > 0
      ? relatedItems[Math.min(activeRelatedIndex, relatedItems.length - 1)]
      : null;

  return (
    <>
      {bannerImageUrl && (
        <div className="w-full h-48 md:h-64 relative overflow-hidden bg-sky-200">
          <img
            src={bannerImageUrl}
            alt={bannerImageAlt}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}
      <div className={containerClassName}>
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
              fontFamily: "\"MuseoModerno\", sans-serif",
              display: "block",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </span>
        )}
        <h1 className={headingClassName} style={headingStyle}>
          {title}
        </h1>
        {coverImageUrl ? (
          coverImagePosition === "none" ? (
            <>
              <div className="mt-4">
                <img
                  src={coverImageUrl}
                  alt={coverImageAlt}
                  className="w-full max-h-[420px] object-cover rounded-xl"
                />
              </div>
              {renderHtmlBlock(description)}
            </>
          ) : (
            <div className="mt-4">
              <img
                src={coverImageUrl}
                alt={coverImageAlt}
                className={`w-full max-w-[480px] h-auto object-contain rounded-xl mb-4 md:mb-0 ${
                  coverImagePosition === "right"
                    ? "md:float-right md:ml-6"
                    : "md:float-left md:mr-6"
                }`}
              />
              {renderHtmlBlock(description)}
              <div className="clear-both" />
            </div>
          )
        ) : (
          renderHtmlBlock(description)
        )}
      </div>

      {showPackagesSection &&
        (packagesSectionTitle ||
          packagesSectionSubtitle ||
          packagesSectionDescription ||
          selectedPackages.length > 0) && (
          <section className="mb-8">
              {packagesSectionTitle && (
                <div>
                  <h2
                    className={headingClassName}
                    style={{
                      ...headingStyle,
                      fontFamily: "\"MuseoModerno\", sans-serif",
                    }}
                  >
                    {packagesSectionTitle}
                  </h2>
                  {packagesSectionSubtitle && (
                    <span
                      className="mt-2 tracking-wide uppercase"
                      style={{
                        color: "#9eca83",
                        fontSize: "120%",
                        fontFamily: "\"MuseoModerno\", sans-serif",
                        display: "block",
                        fontWeight: 500,
                        lineHeight: 1.5,
                      }}
                    >
                      {packagesSectionSubtitle}
                    </span>
                  )}
                </div>
              )}
              {!packagesSectionTitle && packagesSectionSubtitle && (
                <div>
                  <span
                    className="tracking-wide uppercase"
                    style={{
                      color: "#9eca83",
                      fontSize: "150%",
                      fontFamily: "\"MuseoModerno\", sans-serif",
                      display: "block",
                      fontWeight: 500,
                      lineHeight: 1.5,
                    }}
                  >
                    {packagesSectionSubtitle}
                  </span>
                </div>
              )}
            {packagesSectionDescription && (
              <div
                className="mt-4 text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(packagesSectionDescription),
                }}
              />
            )}

            {selectedPackages.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedPackages.map((item, index) => {
                  const rawTitle = item.title || "";
                  const slug =
                    item.slug ||
                    (rawTitle
                      ? rawTitle
                          .toLowerCase()
                          .replace(/,/g, "")
                          .replace(/\s+/g, "-")
                      : "");
                  const media = getMediaObject(item.mainImage || item.image);
                  const imageSrc = getMediaUrl(media, "medium") || "/bhutan.jpg";
                  const description =
                    item.sub_description || item.subDescription || "";

                  return (
                    <div
                      key={item.id ?? item._id ?? index}
                      className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200"
                    >
                      {slug ? (
                        <Link
                          href={`/${slug}`}
                          className="relative h-56 w-full overflow-hidden"
                        >
                          <img
                            src={imageSrc}
                            alt={item.title || "Featured Package"}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </Link>
                      ) : (
                        <div className="relative h-56 w-full overflow-hidden">
                          <img
                            src={imageSrc}
                            alt={item.title || "Featured Package"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="pt-4 px-4 pb-5">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 leading-tight">
                          {item.title || "Featured Package"}
                        </h3>
                        {description ? (
                          <p
                            className="text-base text-emerald-500 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(description),
                            }}
                          />
                        ) : (
                          <p className="text-base text-emerald-500 leading-relaxed">
                            Explore this featured package.
                          </p>
                        )}
                        <div className="mt-2 text-sm text-gray-400">
                          ({item.reviewCount || item.reviews || 0} reviews)
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-gray-600 text-sm">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span>
                              {item.duration || "5 Days"},{" "}
                              {item.tourType || item.type || "Private Tour"}
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
                })}
              </div>
            )}
          </section>
        )}

      {showTeamSection && founderMember && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-green-600 mb-6">
            {teamSectionTitle || "Our Team"}
          </h2>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-72 shrink-0">
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
                <img
                  src={founderMember.imageUrl || "/placeholder-team.jpg"}
                  alt={founderMember.name || "Founder"}
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-green-700 mb-4">
                {founderTitle ||
                  `Short Biography of ${founderMember.name || "Founder"}`}
              </h3>
              <div
                className="prose prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    founderDetails || founderMember.description || ""
                  ),
                }}
              />
              <div className="mt-4">
                <Link
                  href={founderCtaLink}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-[#9cc37f] text-white font-medium hover:bg-[#89b56b] transition-colors"
                >
                  {founderCtaLabel}
                </Link>
              </div>
            </div>
          </div>

          {selectedTeam.length > 0 && (
            <div className="mt-10 border-t border-gray-200 pt-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                {selectedTeam.map((member) => (
                  <Link
                    key={member.id || member.name}
                    href={`/team/${encodeURIComponent(member.name)}`}
                    className="text-center"
                  >
                    <div className="mx-auto w-24 h-24 rounded-full overflow-hidden border border-gray-200 shadow-sm">
                      <img
                        src={member.imageUrl || "/placeholder-team.jpg"}
                        alt={member.name || "Team member"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-3 text-base font-semibold text-green-600">
                      {member.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {member.designation || ""}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {Array.isArray(repeatableSections) &&
        repeatableSections.length > 0 && (
          <div className="space-y-8">
            {repeatableSections.map((section) => {
              const imageMedia = getMediaObject(section.image);
              const imageUrl = getMediaUrl(imageMedia, "large");
              const imageAlt = getMediaAlt(
                imageMedia,
                section.title || "Section image"
              );
              const isLight = section.background === "light";
              const imageLeft = section.imagePosition !== "right";
              const hasImage = !!imageUrl;

              return (
                <section
                  key={section.id || section.title}
                  className={`${isLight ? "bg-gray-50" : "bg-white"} py-4`}
                >
                  <div
                    className={
                      hasImage
                        ? `grid grid-cols-1 gap-8 items-start ${
                            imageLeft
                              ? "lg:grid-cols-[360px_minmax(0,1fr)]"
                              : "lg:grid-cols-[minmax(0,1fr)_360px]"
                          }`
                        : "grid grid-cols-1 gap-0"
                    }
                  >
                    {hasImage && imageLeft && (
                      <div className="w-full">
                        <figure>
                          <img
                            src={imageUrl}
                            alt={imageAlt}
                            className="w-full h-auto object-contain rounded-lg"
                          />
                          {section.imageCaption && (
                            <figcaption className="mt-3 inline-block border-l-4 border-green-500 pl-3 pr-4 py-2 text-sm italic text-gray-600 bg-gray-100">
                              {section.imageCaption}
                            </figcaption>
                          )}
                        </figure>
                      </div>
                    )}

                    <div>
                      {section.title && (
                        <h3
                          className="text-3xl font-semibold text-green-600 mb-4"
                          style={{ fontFamily: "\"MuseoModerno\", sans-serif" }}
                        >
                          {section.title}
                        </h3>
                      )}
                      {section.description && (
                        <div
                          className={`prose prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed ${listStyleClasses}`}
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(section.description),
                          }}
                        />
                      )}
                    </div>

                    {hasImage && !imageLeft && (
                      <div className="w-full">
                        <figure>
                          <img
                            src={imageUrl}
                            alt={imageAlt}
                            className="w-full h-auto object-contain rounded-lg"
                          />
                          {section.imageCaption && (
                            <figcaption className="mt-3 inline-block border-l-4 border-green-500 pl-3 pr-4 py-2 text-sm italic text-gray-600 bg-gray-100">
                              {section.imageCaption}
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
        )}

      {Array.isArray(galleryImages) && galleryImages.length > 0 && (
        <div className="mt-12 relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#86c167] py-12">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">
            <Gallery
              galleryImages={galleryImages}
              title="Photo/Visual Gallery"
              embedded
            />
          </div>
        </div>
      )}

      {relatedItems.length > 0 && (
        <div className="mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-8 border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
              {relatedItems.map((item, index) => {
                const isActive = index === activeRelatedIndex;
                return (
                  <button
                    key={`${item.title || "info"}-${index}`}
                    type="button"
                    onClick={() => setActiveRelatedIndex(index)}
                    className={`w-full text-left px-5 py-4 text-sm font-semibold uppercase tracking-wide transition-colors ${
                      isActive
                        ? "bg-[#a9c98c] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {item.title || `Information ${index + 1}`}
                  </button>
                );
              })}
            </div>
            <div className="p-6 md:p-8">
              {activeRelatedItem?.title && (
                <h3 className="text-2xl font-semibold text-green-600 mb-4">
                  {activeRelatedItem.title}
                </h3>
              )}
              {activeRelatedItem?.description && (
                <div
                  className={`prose prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed ${listStyleClasses}`}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(activeRelatedItem.description),
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {Array.isArray(faq) && faq.length > 0 && (
        <div className="mt-12">
          <h2
            className="text-2xl font-bold text-gray-800 mb-6"
            style={{ fontFamily: "\"MuseoModerno\", sans-serif" }}
          >
            {faqSectionTitle}
          </h2>
          <div className="space-y-4">
            {faq.map((faqItem, index) => (
              <details
                key={`${faqItem.question}-${index}`}
                className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50">
                  <span className="text-base pr-4">
                    {faqItem.question}
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
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faqItem.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(tours) && tours.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {pageData.section || "Tours"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour, index) => {
              const rawImage = tour?.image || "";
              const imageUrl =
                rawImage.startsWith("http") ? rawImage : `${BASE_URL}/uploads/${rawImage}`;

              return (
                <div
                  key={`${tour.name}-${index}`}
                  className="bg-white rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-48 overflow-hidden relative bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={tour.name || "Tour"}
                      onError={(event) => {
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
                    {tour.reviews !== undefined && (
                      <div className="text-xs text-gray-400 mb-3">
                        ( {tour.reviews} reviews )
                      </div>
                    )}
                    <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="mr-1">🕒</span>{" "}
                        {tour.duration || "Duration"}, {tour.difficulty || "Tour"}
                      </div>
                      <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1 px-3 rounded-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
