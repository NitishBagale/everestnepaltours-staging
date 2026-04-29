"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronDown, X, Menu, Loader2, Phone } from "lucide-react";
import { FaWhatsapp, FaViber } from "react-icons/fa";
import axios from "axios";
import { BASE_URL } from "@/config/Config";

const createSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [navLinks, setNavLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true);
        const [catRes] = await Promise.all([
          axios.get(`${BASE_URL}/category/`),
        ]);

        const categoriesRaw =
          catRes.data?.success && Array.isArray(catRes.data.data)
            ? catRes.data.data
            : [];
        const categories = [...categoriesRaw].sort((a, b) => {
          const aOrder = Number(a.sort_order) || 0;
          const bOrder = Number(b.sort_order) || 0;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return String(a.name || "").localeCompare(String(b.name || ""));
        });
        const dynamicLinks = await Promise.all(
          categories.map(async (cat) => {
            const categorySlug = cat.slug || createSlug(cat.name);

            let cmsPages = [];
            try {
              const categoryId = cat._id || cat.id;
              const cmsRes = await axios.get(
                `${BASE_URL}/cms/category/${categoryId}`
              );
              if (cmsRes.data?.success) {
                cmsPages = cmsRes.data.data.map((page) => {
                  const sectionSlug = page.slug || createSlug(page.section);
                  const content =
                    typeof page.content === "string"
                      ? (() => {
                          try {
                            return JSON.parse(page.content);
                          } catch (error) {
                            return {};
                          }
                        })()
                      : page.content || {};
                  const rawSortOrder =
                    page.sort_order ??
                    content.sort_order ??
                    content.sortOrder ??
                    page.sortOrder;
                  const normalizedSortOrder = Number.isFinite(
                    Number(rawSortOrder)
                  )
                    ? Number(rawSortOrder)
                    : null;
                  return {
                    label: page.content?.title || page.section,
                    href: `/${sectionSlug}`,
                    sort_order: normalizedSortOrder,
                  };
                });
              }
            } catch (e) {}

            const dropdown = [...cmsPages].sort((a, b) => {
              const aOrder =
                a.sort_order !== null && Number.isFinite(a.sort_order)
                  ? a.sort_order
                  : 9999;
              const bOrder =
                b.sort_order !== null && Number.isFinite(b.sort_order)
                  ? b.sort_order
                  : 9999;
              if (aOrder !== bOrder) return aOrder - bOrder;
              return String(a.label || "").localeCompare(String(b.label || ""));
            });

            return {
              label: cat.name,
              href: `/${categorySlug}`,
              dropdown: dropdown.length ? dropdown : null,
            };
          })
        );

        setNavLinks([...dynamicLinks]);
      } catch (error) {
        console.error(error);
        setNavLinks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return (
    <>
      <div className="bg-white border-b border-gray-100 relative z-50">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 py-3 flex justify-between items-center">
          <Link href="/" className="shrink-0 cursor-pointer">
            <Image
              src="/logo.png"
              alt="Logo"
              width={220}
              height={80}
              priority
              className="w-[170px] md:w-[215px] h-auto"
            />
          </Link>

          <div className="hidden md:flex gap-8 text-base text-gray-600 items-center">
            <a
              href="tel:+9779851053024"
              className="flex items-center gap-2 hover:text-green-700 transition"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700">
                <Phone className="w-3.5 h-3.5" />
              </span>
              <span className="font-medium">+977-9851053024</span>
              <span className="text-gray-500">WhatsApp/Viber</span>
              <span className="inline-flex items-center gap-1">
                <FaWhatsapp className="w-4 h-4 text-green-600" />
                <FaViber className="w-4 h-4 text-purple-600" />
              </span>
            </a>
            <a
              href="mailto:info@everestvacations.com"
              className="flex items-center gap-2 hover:text-green-700 transition"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">
                @
              </span>
              <span className="font-medium">info@everestvacations.com</span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden text-gray-700 p-1"
            aria-label="Open navigation menu"
          >
            <Menu className="w-8 h-8" />
          </button>
        </div>
      </div>

      <div className="hidden md:block sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 h-16 flex justify-between items-center">
          <div className="flex gap-12 lg:gap-16 items-center h-full">
            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin w-4 h-4" /> Loading...
              </div>
            ) : (
              navLinks.map((link, i) =>
                link.dropdown ? (
                  <div
                    key={i}
                    className="relative group h-full flex items-center"
                  >
                    <button
                      type="button"
                      className="flex items-center uppercase font-semibold text-base text-[#1f6a4a] hover:text-green-900 h-full border-b-2 border-transparent hover:border-green-600 transition-all"
                      aria-haspopup="true"
                      aria-expanded="false"
                      aria-label={`${link.label} submenu`}
                    >
                      {link.label}
                      <ChevronDown className="ml-1 w-4 h-4" />
                    </button>

                    <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-b-md border-t-[3px] border-green-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                      {link.dropdown.map((subItem, j) => (
                        <Link
                          key={j}
                          href={subItem.href}
                          className="flex items-center justify-between px-5 py-3 text-base font-medium text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors w-full"
                        >
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={i}
                    href={link.href}
                    className="h-full flex items-center uppercase font-semibold text-base text-[#1f6a4a] hover:text-green-900 border-b-2 border-transparent hover:border-green-600 transition-all"
                  >
                    {link.label}
                  </Link>
                )
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="text-gray-500 hover:text-green-700"
            aria-label="Open navigation menu"
          >
            <Menu className="w-8 h-8" />
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-y-0 right-0 w-[85%] sm:w-[320px] bg-white z-70 shadow-2xl transform transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <span className="font-bold text-lg text-green-700">Menu</span>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-full pb-20">
          {navLinks.map((link, i) => (
            <div key={i} className="border-b border-gray-50">
              {link.dropdown ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setMobileDropdown(
                        mobileDropdown === link.label ? null : link.label
                      )
                    }
                    className="flex justify-between w-full py-4 font-bold text-gray-800 uppercase hover:text-green-700 text-base"
                    aria-expanded={mobileDropdown === link.label}
                    aria-label={`Toggle ${link.label} submenu`}
                  >
                    {link.label}
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        mobileDropdown === link.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      mobileDropdown === link.label
                        ? "max-h-[1000px]"
                        : "max-h-0"
                    }`}
                  >
                    <div className="pl-4 pb-4 space-y-1 bg-gray-50 rounded-lg mb-2 pt-2">
                      {link.dropdown.map((sub, j) => (
                        <Link
                          key={j}
                          href={sub.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-2 text-base font-medium text-gray-600 hover:text-green-700"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-4 font-bold text-gray-800 uppercase hover:text-green-700 text-base"
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-60 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}
