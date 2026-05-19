"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import CmsContentRenderer from "@/components/CmsContentRenderer";

const slugify = (value) =>
  value
    ? value
        .toLowerCase()
        .trim()
        .replace(/,/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
    : "";

const normalizeCmsData = (payload) => {
  if (!payload) return null;
  if (payload?.data?.content || payload?.data?.section) return payload.data;
  if (payload?.data) return payload.data;
  if (payload?.content || payload?.section) return payload;
  return null;
};

const isPublished = (statusValue) => {
  if (statusValue === undefined || statusValue === null) return true;
  if (statusValue === true) return true;
  if (typeof statusValue === "string") {
    const normalized = statusValue.toLowerCase();
    return !["draft", "unpublished"].includes(normalized);
  }
  return false;
};

const findCmsBySlug = (items, slug) => {
  const targetSlug = slugify(decodeURIComponent(slug || ""));
  return (
    items.find((item) => {
      if (!isPublished(item?.status)) return false;
      const pageSlug =
        slugify(item?.slug) ||
        slugify(item?.section) ||
        slugify(item?.content?.title);
      return pageSlug === targetSlug;
    }) || null
  );
};

const CmsContentPage = ({
  section,
  slug,
  backLink,
  backLabel,
  headingClassName,
  headingStyle,
  children,
}) => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        if (!section && !slug) {
          setLoading(true);
          return;
        }

        setLoading(true);
        setError(null);

        if (section) {
          const response = await axios.get(
            `${BASE_URL}/cms/${encodeURIComponent(section)}`
          );
          const data = normalizeCmsData(response.data);
          if (!active) return;
          if (data) {
            setPageData(data);
          } else {
            setError("Page not found");
          }
          return;
        }

        if (slug) {
          const response = await axios.get(`${BASE_URL}/cms/`);
          const list = response?.data?.data || [];
          const page = findCmsBySlug(list, slug);
          if (!active) return;
          if (page) {
            setPageData(page);
          } else {
            setError("Page not found");
          }
          return;
        }

        setError("Page not found");
      } catch (err) {
        if (!active) return;
        setError("Failed to load page content");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [section, slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <>
      <CmsContentRenderer
        pageData={pageData}
        error={error}
        backLink={backLink}
        backLabel={backLabel}
        headingClassName={headingClassName}
        headingStyle={headingStyle}
      >
        {children}
      </CmsContentRenderer>
    </>
  );
};

export default CmsContentPage;
