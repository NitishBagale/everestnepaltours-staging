"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import {
  Clock,
  MapPin,
  CheckCircle,
  HelpCircle,
  ThumbsUp,
  Star,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Hotel,
  Utensils,
  Mountain,
  Flag,
  Car,
} from "lucide-react";
import { BASE_URL } from "@/config/Config";
import Faqs from "@/components/Faqs";
import Form from "@/components/Form";
import {
  getMediaAlt,
  getMediaObject,
  getMediaSrcSet,
  getMediaUrl,
  getMediaUniqueKey,
} from "@/lib/media";

const TourDetailPage = ({
  initialTourRecord = null,
  initialTourData = null,
  slugFromUrl: propSlug = "",
}) => {
  const params = useParams();
  const slugFromUrl = propSlug || params.title || params.slug || "";

  const [tourRecord, setTourRecord] = useState(initialTourRecord);
  const [tourData, setTourData] = useState(initialTourData);
  const [loading, setLoading] = useState(!initialTourData);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [openItineraryIndex, setOpenItineraryIndex] = useState(null);
  const [expandAll, setExpandAll] = useState(false);
  const [packageReviews, setPackageReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [askExpertStatus, setAskExpertStatus] = useState("idle");
  const [askExpertMessage, setAskExpertMessage] = useState("");
  const [askExpertError, setAskExpertError] = useState("");
  const [askExpertForm, setAskExpertForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const getRatingStars = (rating) => {
    const value = String(rating || "").toLowerCase();
    if (!value) return 0;
    if (value.includes("excellent")) return 5;
    if (value.includes("very")) return 4;
    if (value.includes("good")) return 3;
    if (value.includes("average")) return 2;
    if (value.includes("poor")) return 1;
    return 0;
  };

  const getReviewStars = (rating) => {
    const value = Number(rating || 0);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.round(value));
  };

  useEffect(() => {
    const slugify = (value) =>
      value
        ? value
            .toLowerCase()
            .replace(/,/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "")
        : "";
    const normalizeSlug = (value) => slugify(String(value || ""));
    const getPackageSlug = (pkg) => {
      const item = pkg?.package || pkg || {};
      return item.slug || slugify(item.title);
    };

    const currentSlug = getPackageSlug(tourData);
    if (currentSlug && normalizeSlug(currentSlug) === normalizeSlug(slugFromUrl)) {
      setLoading(false);
      return;
    }

    const getSpecificPackage = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/package-tour/`);
        const allPackages = res.data.data;

        const targetSlug = normalizeSlug(slugFromUrl);
        const found = allPackages.find(
          (pkg) => normalizeSlug(getPackageSlug(pkg)) === targetSlug
        );

        if (found) {
          setTourRecord(found);
          setTourData(found.package);
        } else {
          setTourRecord(null);
          setTourData(null);
        }
      } catch (error) {
        console.error("Error fetching specific package:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slugFromUrl) {
      setLoading(true);
      getSpecificPackage();
    }
  }, [slugFromUrl, tourData]);

  useEffect(() => {
    const packageId = tourRecord?.id || tourRecord?._id || tourData?.id;
    if (!packageId) return;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/review/?limit=200`);
        const list = res.data?.data || [];
        const normalizedId = String(packageId);
        const filtered = list.filter((review) =>
          Array.isArray(review.packageIds)
            ? review.packageIds.map(String).includes(normalizedId)
            : false
        );
        setPackageReviews(filtered);
      } catch (error) {
        console.error("Error fetching package reviews:", error);
        setPackageReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [tourRecord?.id, tourRecord?._id, tourData?.id]);

  const selectedPackageReviews = useMemo(() => {
    if (!packageReviews.length) return [];
    return packageReviews;
  }, [packageReviews]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowStickyNav(true);
      } else {
        setShowStickyNav(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .prose img {
        max-width: 45%;
        height: auto;
        float: right !important;
        margin: 0 0 15px 20px !important;
        display: inline !important;
        object-fit: contain;
      }
      .ql-editor img {
        max-width: 45%;
        height: auto;
        float: right !important;
        margin: 0 0 15px 20px !important;
        display: inline !important;
        object-fit: contain;
      }
      .ql-container {
        overflow: visible !important;
      }
      .prose {
        overflow: visible !important;
      }
      @media (max-width: 768px) {
        .prose img,
        .ql-editor img {
          max-width: 100%;
          float: none !important;
          margin: 12px 0 !important;
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Function to check if FAQs should be shown for this package
  const shouldShowFaqs = () => {
    if (!tourData) return false;

    // Primary option: Check if admin enabled showFaqs for this package
    if (tourData.showFaqs === true) {
      return true;
    }

    // Fallback option: Show FAQs based on specific tags (if showFaqs field is not set)
    const tagsToShowFaqs = ["kathmandu"];
    const hasMatchingTag = tourData.tags?.some((tag) =>
      tagsToShowFaqs.includes(tag.toLowerCase())
    );

    // Fallback option 2: Show FAQs based on tour type
    const tourTypesToShowFaqs = ["cultural", "pilgrimage", "adventure"];
    const hasMatchingTourType = tourTypesToShowFaqs.includes(
      tourData.tour_type?.toLowerCase()
    );

    // Return true if any fallback condition matches
    return hasMatchingTag || hasMatchingTourType;
  };

  const stripHtml = (html) =>
    typeof html === "string" ? html.replace(/<[^>]+>/g, "").trim() : "";

  const mainImageMedia = getMediaObject(tourData?.mainImage || tourData?.image);
  const overviewMedia = getMediaObject(tourData?.overviewImage);
  const overviewSrc =
    getMediaUrl(overviewMedia, "medium") ||
    getMediaUrl(overviewMedia, "large") ||
    getMediaUrl(overviewMedia, "small") ||
    "";

  const galleryImages = (tourData?.imageGallary || [])
    .map((item) => getMediaObject(item))
    .filter((media) => {
      if (!media) return false;
      const src = getMediaUrl(media, "small") || "";
      return src && !src.startsWith("#");
    });

  const dedupedGallery = (() => {
    const seen = new Set();
    return galleryImages.filter((media) => {
      const key = getMediaUniqueKey(media);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const galleryWithoutMain = dedupedGallery.filter((media) => {
    const key = getMediaUniqueKey(media);
    const mainKey = getMediaUniqueKey(mainImageMedia);
    return key && key !== mainKey;
  });

  const normalizeActivities = (activities) => {
    if (!Array.isArray(activities)) return [];
    return activities
      .map((activity) => {
        if (typeof activity === "string") return activity;
        if (typeof activity === "object") {
          return activity.title || activity.text || activity.name || "";
        }
        return "";
      })
      .filter(Boolean);
  };

  const normalizedItinerary = (tourData?.itinerary || [])
    .map((item, index) => {
      const order =
        item.order || item.day || item.dayNumber || item.day_no || index + 1;
      return {
        id: item.id || `${order}-${index}`,
        title: item.title || item.heading || `Day ${order}`,
        order: Number(order) || index + 1,
        richText: item.richText || "",
        description: item.description || "",
        image: getMediaObject(item.image),
        activities: normalizeActivities(item.activities),
        accommodation: item.accommodation || "",
        meal: item.meal || "",
        elevation: item.elevation || "",
      };
    })
    .sort((a, b) => a.order - b.order);

  const hasTripFacts = Boolean(
    tourData?.trip_attractions ||
      tourData?.trip_max_elevation ||
      tourData?.trip_best_season ||
      tourData?.trip_meals ||
      tourData?.trip_accommodation ||
      tourData?.trip_transportations ||
      tourData?.difficulty
  );

  const handleAskExpertChange = (event) => {
    const { name, value } = event.target;
    setAskExpertForm((prev) => ({ ...prev, [name]: value }));
    if (askExpertStatus !== "idle") {
      setAskExpertStatus("idle");
      setAskExpertMessage("");
      setAskExpertError("");
    }
  };

  const handleAskExpertSubmit = async (event) => {
    event.preventDefault();
    if (!tourRecord?.id) {
      setAskExpertError("Package information is missing.");
      return;
    }

    setAskExpertStatus("loading");
    setAskExpertError("");
    setAskExpertMessage("");

    try {
      await axios.post(`${BASE_URL}/package-tour/${tourRecord.id}/ask-expert`, {
        name: askExpertForm.name,
        email: askExpertForm.email,
        message: askExpertForm.message,
      });
      setAskExpertStatus("success");
      setAskExpertMessage("Thanks! Our expert will reach out shortly.");
      setAskExpertForm({ name: "", email: "", message: "" });
    } catch (error) {
      setAskExpertStatus("error");
      setAskExpertError(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!tourData)
    return (
      <div className="h-screen flex items-center justify-center">Not Found</div>
    );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 overflow-x-hidden">
      <div
        className={`fixed top-0 left-0 w-full z-50 bg-white shadow-md transition-transform duration-300 ease-in-out ${
          showStickyNav ? "translate-y-0" : "-translate-y-full"
        }`}
      >
</div>

      <div className="pt-0 pb-10 md:pb-14">
        <div className="py-5 mb-8 border-b pb-8 bg-[#f8f9fa]">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">
            <div className="flex flex-wrap gap-2 mb-4">
              {tourData.tags?.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-[1.15] wrap-break-word break-all">
                {tourData.title}
                <span className="mt-2 block text-[50%] text-[#35a576] font-semibold">
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#35a576]">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </span>
                    {tourData.duration || "—"}
                  </span>
                  <span className="text-emerald-600">,</span>
                  <span className="mx-2 capitalize whitespace-nowrap">
                    {tourData.trip_type_level || tourData.tour_type || "Private Tour"}
                  </span>
                </span>
              </h1>

              {tourData.cost && (
                <div className="bg-white border-2 border-green-200 rounded-lg p-4 text-center min-w-[180px]">
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    Starting Price
                  </p>
                  <p className="text-3xl font-bold text-green-600 mb-1">
                    US ${tourData.cost}
                  </p>
                  <p className="text-xs italic text-slate-500 mb-3">
                    based on per person
                  </p>
                  <button
                    className="inline-block bg-green-400 hover:bg-green-500 text-white font-semibold px-6 py-2 rounded transition-colors duration-200"
                    onClick={() => (window.location.href = "/booking")}
                  >
                    Book Now
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm md:text-base text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                {Array.from({ length: getRatingStars(tourData.rating) }).map(
                  (_, idx) => (
                    <Star
                      key={idx}
                      className="w-5 h-5 text-amber-400 fill-amber-400"
                    />
                  )
                )}
              </span>
              <span className="font-semibold text-slate-700">
                {tourData.rating ? `- ${tourData.rating}` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 space-y-12">
          <div>
            <h2 className="text-2xl font-bold mb-4" id="overview">
              Overview
            </h2>
            <div
              className={`grid gap-6 items-start ${
                overviewSrc ? "lg:grid-cols-[1.15fr_0.85fr]" : ""
              }`}
            >
              <div
                className="prose prose-slate max-w-none text-slate-600 text-lg leading-relaxed 
               wrap-break-word break-all whitespace-pre-line
                [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5"
                dangerouslySetInnerHTML={{
                  __html: tourData.descriptions || "",
                }}
              />
              {overviewSrc && (
                <div className="w-full">
                  <img
                    src={overviewSrc}
                    alt={getMediaAlt(overviewMedia, "Overview")}
                    className="w-full h-auto rounded-lg object-cover shadow-sm border border-gray-100"
                  />
                </div>
              )}
            </div>
            {hasTripFacts && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-600 text-lg leading-relaxed">
                {tourData.trip_attractions && (
                  <div className="flex gap-4 items-start">
                    <MapPin className="w-10 h-10 text-[#9dbc7a]" />
                    <div>
                      <p className="text-base text-slate-500">
                        Trip Attractions
                      </p>
                      <p className="font-semibold text-slate-700">
                        {tourData.trip_attractions}
                      </p>
                    </div>
                  </div>
                )}
                {tourData.trip_max_elevation && (
                  <div className="flex gap-4 items-start">
                    <Mountain className="w-10 h-10 text-[#9dbc7a]" />
                    <div>
                      <p className="text-base text-slate-500">Max Elevation</p>
                      <p className="font-semibold text-slate-700">
                        {tourData.trip_max_elevation}
                      </p>
                    </div>
                  </div>
                )}
                {tourData.trip_best_season && (
                  <div className="flex gap-4 items-start">
                    <Calendar className="w-10 h-10 text-[#9dbc7a]" />
                    <div>
                      <p className="text-base text-slate-500">Best Season</p>
                      <p className="font-semibold text-slate-700">
                        {tourData.trip_best_season}
                      </p>
                    </div>
                  </div>
                )}
                {tourData.trip_meals && (
                  <div className="flex gap-4 items-start">
                    <Utensils className="w-10 h-10 text-[#9dbc7a]" />
                    <div>
                      <p className="text-base text-slate-500">Meals</p>
                      <p className="font-semibold text-slate-700">
                        {tourData.trip_meals}
                      </p>
                    </div>
                  </div>
                )}
                {tourData.trip_accommodation && (
                  <div className="flex gap-4 items-start">
                    <Hotel className="w-10 h-10 text-[#9dbc7a]" />
                    <div>
                      <p className="text-base text-slate-500">Accommodation</p>
                      <p className="font-semibold text-slate-700">
                        {tourData.trip_accommodation}
                      </p>
                    </div>
                  </div>
                )}
                {tourData.trip_transportations && (
                  <div className="flex gap-4 items-start">
                    <Car className="w-10 h-10 text-[#9dbc7a]" />
                    <div>
                      <p className="text-base text-slate-500">
                        Transportation
                      </p>
                      <p className="font-semibold text-slate-700">
                        {tourData.trip_transportations}
                      </p>
                    </div>
                  </div>
                )}
                {tourData.difficulty && (
                  <div className="flex gap-4 items-start">
                    <Flag className="w-10 h-10 text-[#9dbc7a]" />
                    <div>
                      <p className="text-base text-slate-500">Difficulty</p>
                      <p className="font-semibold text-slate-700">
                        {tourData.difficulty}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {(Array.isArray(tourData.highlights) &&
            tourData.highlights.length > 0) ||
          (typeof tourData.trip_highlights === "string" &&
            tourData.trip_highlights.trim()) ? (
            <div className="bg-white">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">
                {tourData.trip_highlights_title || "Tour Highlights"}
              </h3>
              {Array.isArray(tourData.highlights) &&
              tourData.highlights.length > 0 ? (
                <ul className="space-y-4">
                  {tourData.highlights.map((highlight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-4 text-slate-700 text-lg"
                    >
                      <span className="mt-1.5 text-emerald-600 text-2xl leading-none">
                        ›
                      </span>
                      <span className="wrap-break-word break-all">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  className="trip-highlights-content prose prose-slate max-w-none text-slate-700 text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: tourData.trip_highlights || "",
                  }}
                />
              )}
            </div>
          ) : null}

          {/* Full-width Gallery */}
          {galleryWithoutMain.length > 0 && (
              <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#86c167] py-12">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-white">
                    Photo/Visual Gallery
                  </h3>
                </div>
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {galleryWithoutMain.map((media, i) => {
                      const src = getMediaUrl(media, "small");
                      if (!src) return null;
                      return (
                        <button
                          key={getMediaUniqueKey(media) || i}
                          type="button"
                          className="relative w-[150px] h-[150px] overflow-hidden rounded-lg shadow-sm"
                          onClick={() => setSelectedImageIndex(i)}
                        >
                          <img
                            src={src}
                            srcSet={getMediaSrcSet(media)}
                            sizes="(max-width: 768px) 25vw, (max-width: 1200px) 12.5vw, 10vw"
                            alt={getMediaAlt(media, `Gallery ${i + 1}`)}
                            className="w-full h-full object-contain hover:scale-105 transition duration-300 cursor-pointer"
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          {normalizedItinerary.length > 0 && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2
                  className="text-3xl md:text-4xl font-bold flex items-center gap-2 text-[#35a576]"
                  id="itinerary"
                >
                  {tourData.itinerary_title || "Itinerary"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setExpandAll((prev) => !prev);
                    setOpenItineraryIndex(null);
                  }}
                  className="bg-[#35a576] hover:bg-[#2f8c6e] text-white font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  {expandAll ? "Collapse All" : "Expand All"}
                </button>
              </div>

              <div
                className="ml-8 md:ml-10 space-y-6"
                style={{ borderLeft: "2px dotted rgb(158, 202, 131)" }}
              >
                {normalizedItinerary.map((item, index) => (
                  <div key={item.id || index} className="relative pl-6 md:pl-8">
                    <div className="absolute left-0 top-0 -translate-x-1/2 flex items-center justify-center">
                      {index === 0 ? (
                        <span className="w-12 h-12 rounded-full bg-[#a6c97a] text-white flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </span>
                      ) : index === normalizedItinerary.length - 1 ? (
                        <span className="w-9 h-9 rounded-full bg-[#a6c97a] text-white flex items-center justify-center">
                          <Flag className="w-4 h-4 fill-white" />
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-white border-2 border-[#a6c97a]" />
                      )}
                    </div>

                    {/* Clickable Header */}
                    <div
                      className="cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                      onClick={() => {
                        setExpandAll(false);
                        setOpenItineraryIndex(
                          openItineraryIndex === index ? null : index
                        );
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-xl md:text-2xl font-bold text-slate-900">
                            Day {item.order}: {item.title}
                          </h4>

                          {/* Icons Row */}
                          <div className="flex flex-wrap items-center gap-5 text-sm mt-2">
                            {item.accommodation && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Hotel className="w-4 h-4 text-green-600 shrink-0" />
                                <span>{item.accommodation}</span>
                              </div>
                            )}
                            {item.meal && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Utensils className="w-4 h-4 text-green-600 shrink-0" />
                                <span>{item.meal}</span>
                              </div>
                            )}
                            {item.elevation && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Mountain className="w-4 h-4 text-green-600 shrink-0" />
                                <span>Elevation: {item.elevation}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Toggle Icon */}
                        <div className="shrink-0 mt-1">
                          <div
                            className={`transition-transform duration-300 ${
                              expandAll || openItineraryIndex === index
                                ? "rotate-180"
                                : "rotate-0"
                            }`}
                          >
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        expandAll || openItineraryIndex === index
                          ? "max-h-[2000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="mt-4 pl-3 pb-2">
                        {item.image && (
                          <div className="mb-4">
                            <img
                              src={getMediaUrl(item.image, "medium")}
                              srcSet={getMediaSrcSet(item.image)}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              alt={getMediaAlt(item.image, item.title)}
                              className="w-full max-w-2xl h-auto object-contain rounded-lg border border-slate-200"
                              loading="lazy"
                            />
                          </div>
                        )}
                        {item.richText ? (
                          <div
                            className="prose prose-slate max-w-none text-slate-600 text-sm md:text-base leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: item.richText,
                            }}
                          />
                        ) : null}
                        {!item.richText && item.description && (
                          <p className="text-slate-600 text-sm md:text-base mb-4 whitespace-pre-line leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.activities?.length > 0 && (
                          <ul className="space-y-2">
                            {item.activities.map((act, i) => (
                              <li
                                key={i}
                                className="text-slate-600 text-sm md:text-base flex items-start gap-2"
                              >
                                <span className="shrink-0">•</span>{" "}
                                <span className="wrap-break-word break-all">
                                  {act}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional FAQs Section */}
          {shouldShowFaqs() && (
            <div>
              <Faqs />
            </div>
          )}

          {/* Cost Include/Exclude Sections */}
          {tourData.customSections?.length > 0 && (
            <div className="space-y-8">
              {tourData.customSections
                .filter((section) => section.type === "list")
                .map((section, index) => {
                  const isExclude = /exclude|excludes|not included|not include/i.test(
                    section.title || ""
                  );
                  const listClass = isExclude
                    ? "custom-section-list custom-section-list--exclude"
                    : "custom-section-list custom-section-list--include";
                  const descriptionClass = isExclude
                    ? "custom-section-description custom-section-description--exclude"
                    : "custom-section-description custom-section-description--include";
                  return (
                  <div key={section.id || index}>
                    <h3 className="text-2xl font-bold text-[#35a576] mb-4">
                      {section.title}
                    </h3>
                    {section.note && (
                      <div
                        className="custom-section-note prose prose-slate max-w-none text-slate-600 text-base italic leading-relaxed mb-4"
                        dangerouslySetInnerHTML={{ __html: section.note }}
                      />
                    )}
                    {section.description ? (
                      <div
                        className={`${descriptionClass} prose prose-slate max-w-none text-slate-700 text-lg leading-relaxed`}
                        dangerouslySetInnerHTML={{ __html: section.description }}
                      />
                    ) : (
                      Array.isArray(section.content) &&
                      section.content.length > 0 && (
                        <ul className={`${listClass} space-y-3`}>
                          {section.content.map((item, i) => (
                            <li
                              key={i}
                              className="custom-section-list-item text-slate-600 text-lg"
                            >
                              <span className="wrap-break-word break-all leading-relaxed">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {tourData.suitable_for?.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-[#2FB99E] mb-4">
                Is It Right for You?
              </h3>
              <ul className="space-y-2">
                {tourData.suitable_for.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-slate-600"
                  >
                    <span className="text-red-500 text-[11px] mt-[5px] shrink-0">
                      ▶
                    </span>
                    <span className="leading-relaxed wrap-break-word">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Custom Package FAQs */}
        {tourData.faq && tourData.faq.length > 0 && (
          <div className="mt-0 px-8 md:px-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#35a576] mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {tourData.faq.map((faqItem, index) => (
                <details
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-[#35a576] hover:bg-gray-50">
                    <span className="text-lg pr-4">
                      {faqItem.question}
                    </span>
                    <svg
                      className="w-5 h-5 text-teal-600 shrink-0"
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
                  <div
                    className="px-5 pb-5 text-lg text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: faqItem.answer || "" }}
                  />
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info Sections */}
        {tourData.customSections?.length > 0 && (
          <div className="mt-10 space-y-8">
            {tourData.customSections
              .filter((section) => section.type !== "list")
              .map((section, index) => {
                const isOdd = (index + 1) % 2 === 1;
                return (
                  <div
                    key={section.id || index}
                    className={
                      isOdd
                        ? "relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#f8f9fa] py-8"
                        : ""
                    }
                  >
                    <div
                      className={
                        isOdd
                          ? "max-w-screen-2xl mx-auto px-8 md:px-10"
                          : "px-8 md:px-10"
                      }
                    >
                      <h3 className="text-2xl font-bold text-[#35a576] mb-4">
                        {section.title}
                      </h3>
                      <div className="other-info-list prose prose-slate max-w-none text-slate-700 text-lg leading-relaxed">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: section.content?.[0] || "",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {!reviewsLoading && selectedPackageReviews.length > 0 && (
          <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#e9ecef]">
            <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
              <div className="mb-8 sm:mb-10 lg:mb-12">
                <h2 className="flex items-center gap-2 sm:gap-3 text-3xl font-semibold text-[#3c9f87]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={20}
                    height={20}
                    className="sm:w-6 sm:h-6"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill="currentColor"
                      d="M14 14.2c0-.6 2-1.8 2-3.1c0-1.5-1.4-2.7-3.1-3.2c.7-.8 1.1-1.7 1.1-2.8C14 2.3 11.1 0 7.4 0C3.9 0 0 2.1 0 5.1c0 2.1 1.6 3.6 2.3 4.2c-.1 1.2-.6 1.7-.6 1.7L.5 12H2c1.6 0 2.9-.5 3.7-1.1v.2c0 2 2.2 3.6 5 3.6h.6c.4.5 1.7 1.4 3.4 1.4c.1-.1-.7-.5-.7-1.9M7.4 1C10.5 1 13 2.9 13 5.1s-2.6 4.1-5.8 4.1H6.1l-.1.2c-.3.4-1.5 1.2-3.1 1.5c.1-.4.1-1 .1-1.8v-.3C2 8 .9 6.6.9 5.2C.9 3 4.1 1 7.4 1"
                    ></path>
                  </svg>
                  Traveler&apos;s Reviews
                </h2>
              </div>

              {selectedPackageReviews.map((review, index) => {
                const reviewImage =
                  getMediaUrl(review.image, "medium") ||
                  getMediaUrl(review.image, "large") ||
                  "/review.jpg";
                const travelDate = review.travelDate
                  ? new Date(review.travelDate).toLocaleDateString()
                  : "";

                return (
                  <div
                    key={review.id || review._id || index}
                    className={`grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 md:grid-cols-3 ${
                      index < selectedPackageReviews.length - 1
                        ? "pb-10 sm:pb-12 lg:pb-14 border-b border-gray-200 mb-10 sm:mb-12 lg:mb-14"
                        : ""
                    }`}
                  >
                    <div className="md:col-span-1">
                      <div className="relative mb-4 sm:mb-6 aspect-3/4 w-full overflow-hidden rounded-lg shadow-md">
                        <img
                          src={reviewImage}
                          alt={`Photo of ${review.guestName || "Guest"}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-gray-800">
                          {review.guestName || "Guest"}
                        </p>
                        <p className="text-base text-gray-600">
                          {review.country || ""}
                        </p>
                        {travelDate && (
                          <p className="text-base text-gray-400 mt-2 lg:mt-3">
                            Travel time: {travelDate}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-800 leading-tight mb-3 sm:mb-4 lg:mb-5">
                        {review.title || "Guest Review"}
                      </h3>
                      <div className="my-3 sm:my-4 lg:my-5 flex items-center gap-1">
                        {Array.from({
                          length: getReviewStars(review.rating),
                        }).map((_, idx) => (
                          <Star
                            key={idx}
                            className="w-5 h-5 text-yellow-500 fill-yellow-500"
                          />
                        ))}
                      </div>
                      <div
                        className="prose prose-slate max-w-none text-gray-600 text-lg leading-relaxed [&>p]:mb-5"
                        dangerouslySetInnerHTML={{
                          __html: review.reviewText || "",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      
      </div>
        {/* Booking Form */}
        {tourData.showBookingForm && (
          <div className="bg-[#fff]" id="booking-form">
            <Form />
          </div>
        )}

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && galleryWithoutMain.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-4xl max-h-full p-4 flex items-center">
            {/* Previous Button */}
            <button
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) =>
                  prev > 0 ? prev - 1 : galleryWithoutMain.length - 1
                );
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Image */}
            {(() => {
              const currentMedia = galleryWithoutMain[selectedImageIndex];
              const src = getMediaUrl(currentMedia, "large");
              return (
                <img
                  src={src}
                  srcSet={getMediaSrcSet(currentMedia)}
                  alt={getMediaAlt(currentMedia, "Gallery")}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              );
            })()}

            {/* Next Button */}
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) =>
                  prev < galleryWithoutMain.length - 1 ? prev + 1 : 0
                );
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors"
              onClick={() => setSelectedImageIndex(null)}
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {selectedImageIndex + 1} / {galleryWithoutMain.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourDetailPage;
