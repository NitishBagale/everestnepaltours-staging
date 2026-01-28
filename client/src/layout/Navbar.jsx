"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  Loader2,
  Phone,
  Clock,
} from "lucide-react";
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
    const groupPackagesByTag = (packages = []) => {
      const map = {};
      packages.forEach((pkg) => {
        const pkgData = pkg?.package || pkg;

        const tags = Array.isArray(pkgData.tags) ? pkgData.tags : [];
        const section = pkgData.section;
        console.log("Package Tags:", tags, "Section:", section);
        const keysToMap = [...tags];
        if (section) keysToMap.push(section);

        keysToMap.forEach((key) => {
          const slug = createSlug(key);
          if (!map[slug]) map[slug] = [];

          if (!map[slug].find((p) => p.id === pkgData.id)) {
            map[slug].push(pkgData);
          }
        });
      });
      return map;
    };

    const fetchMenu = async () => {
      try {
        setIsLoading(true);
        const [catRes, pkgRes] = await Promise.all([
          axios.get(`${BASE_URL}/category/`),
          axios.get(`${BASE_URL}/package-tour/`),
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
        const packages =
          Array.isArray(pkgRes?.data?.data) && pkgRes?.data?.success !== false
            ? pkgRes.data.data
            : [];

        const packageMap = groupPackagesByTag(packages);

        const dynamicLinks = await Promise.all(
          categories.map(async (cat) => {
            const categorySlug = createSlug(cat.name);

            let cmsPages = [];
            try {
              const cmsRes = await axios.get(
                `${BASE_URL}/cms/category/${cat.id}`
              );
              if (cmsRes.data?.success) {
                cmsPages = cmsRes.data.data.map((page) => {
                  const sectionSlug = page.slug || createSlug(page.section);
                  return {
                    label: page.content?.title || page.section,
                    href: `/${sectionSlug}`,
                    packages: packageMap[sectionSlug] || [],
                  };
                });
              }
            } catch (e) {}

            const subCategories = Array.isArray(cat.subCategory)
              ? cat.subCategory.map((subName) => {
                  const subSlug = createSlug(subName);
                  return {
                    label: subName,
                    href: `/${subSlug}`,
                    packages: packageMap[subSlug] || [],
                  };
                })
              : [];

            const categoryPackages = packageMap[categorySlug] || [];

            const dropdown = [...subCategories, ...cmsPages];

            if (!dropdown.length && categoryPackages.length) {
              dropdown.push({
                label: "Popular Packages",
                href: `/${categorySlug}`,
                packages: categoryPackages,
              });
            }

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
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden text-gray-700 p-1"
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
                    <Link
                      href={link.href}
                      className="flex items-center uppercase font-semibold text-base text-[#35a576] hover:text-green-900 h-full border-b-2 border-transparent hover:border-green-600 transition-all"
                    >
                      {link.label}
                      <ChevronDown className="ml-1 w-4 h-4" />
                    </Link>

                    <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-b-md border-t-[3px] border-green-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                      {link.dropdown.map((subItem, j) => {
                        const hasPackages =
                          subItem.packages && subItem.packages.length > 0;
                        const pkgList = hasPackages
                          ? subItem.packages.slice(0, 10)
                          : [];

                        return (
                          <div key={j} className="relative group/sub">
                            <Link
                              href={subItem.href}
                              className="flex items-center justify-between px-5 py-3 text-base font-medium text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors w-full"
                            >
                              <span>{subItem.label}</span>
                              {hasPackages && (
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover/sub:text-green-600" />
                              )}
                            </Link>

                            {hasPackages && (
                              <div
                                className="absolute top-0 left-full w-[320px] bg-white shadow-2xl rounded-md border border-gray-100 
                                            opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible 
                                            transition-all duration-200 z-60 ml-0.5"
                              >
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                                  <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider">
                                    {subItem.label} Packages
                                  </h4>
                                </div>

                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                  {pkgList.map((pkg, idx) => (
                                    <Link
                                      key={idx}
                                      href={`/${createSlug(pkg.title)}`}
                                      className="flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-green-50 transition-colors group/link"
                                    >
                                      {/* <div className="w-12 h-12 rounded bg-gray-200 overflow-hidden shrink-0 mt-0.5">
                                        {pkg.mainImage ? (
                                          <Image
                                            src={pkg.mainImage}
                                            alt={pkg.title}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">
                                            IMG
                                          </div>
                                        )}
                                      </div> */}

                                      <div className="flex-1 min-w-0">
                                        <h5 className="text-base font-bold text-gray-800 leading-snug group-hover/link:text-green-700 truncate">
                                          {pkg.title}
                                        </h5>
                                        <div className="flex items-center gap-3 mt-1.5">
                                          {/* {pkg.duration && (
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                              <Clock className="w-3 h-3" />
                                              {pkg.duration}
                                            </div>
                                          )} */}
                                          {/* {pkg.cost && (
                                            <div className="text-[12px] font-bold text-green-600">
                                              ${pkg.cost}
                                            </div>
                                          )} */}
                                        </div>
                                      </div>
                                    </Link>
                                  ))}
                                </div>

                                {/* <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                                  <Link
                                    href={subItem.href}
                                    className="text-xs font-bold text-green-700 hover:underline"
                                  >
                                    View All Packages
                                  </Link>
                                </div> */}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={i}
                    href={link.href}
                    className="h-full flex items-center uppercase font-semibold text-base text-[#35a576] hover:text-green-900 border-b-2 border-transparent hover:border-green-600 transition-all"
                  >
                    {link.label}
                  </Link>
                )
              )
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-gray-500 hover:text-green-700"
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
            onClick={() => setIsMenuOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100"
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
                    onClick={() =>
                      setMobileDropdown(
                        mobileDropdown === link.label ? null : link.label
                      )
                    }
                    className="flex justify-between w-full py-4 font-bold text-gray-800 uppercase hover:text-green-700 text-base"
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
                        <div key={j}>
                          <Link
                            href={sub.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="block py-2 text-base font-medium text-gray-600 hover:text-green-700"
                          >
                            {sub.label}
                          </Link>
                          {sub.packages && sub.packages.length > 0 && (
                            <div className="pl-3 border-l-2 border-green-200 ml-1 mb-2">
                              {sub.packages.slice(0, 3).map((pkg, pIdx) => (
                                <Link
                                  key={pIdx}
                                  href={`/${createSlug(pkg.title)}`}
                                  onClick={() => setIsMenuOpen(false)}
                                  className="block py-1 text-base text-gray-500 hover:text-green-600 truncate"
                                >
                                  • {pkg.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
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
