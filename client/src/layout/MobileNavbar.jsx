"use client";

import { useState } from "react";
import Link from "next/link";

const MenuIcon = ({ className = "w-8 h-8" }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const XIcon = ({ className = "w-6 h-6" }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const ChevronIcon = ({ className = "w-5 h-5" }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
      clipRule="evenodd"
    />
  </svg>
);

export default function MobileNavbar({ navLinks = [] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="text-gray-700 p-2 min-h-11 min-w-11 flex items-center justify-center"
        aria-label="Open navigation menu"
      >
        <MenuIcon />
      </button>

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
            className="p-2 min-h-11 min-w-11 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="Close navigation menu"
          >
            <XIcon />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-full pb-20">
          {navLinks.map((link) => (
            <div key={link.href} className="border-b border-gray-50">
              {link.dropdown ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setMobileDropdown(
                        mobileDropdown === link.label ? null : link.label
                      )
                    }
                    className="flex justify-between w-full py-4 font-bold text-gray-800 uppercase hover:text-green-700 text-base min-h-11 items-center"
                    aria-expanded={mobileDropdown === link.label}
                    aria-label={`Toggle ${link.label} submenu`}
                  >
                    {link.label}
                    <ChevronIcon
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
                      {link.dropdown.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-3 text-base font-medium text-gray-700 hover:text-green-700"
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
                  className="block py-4 font-bold text-gray-800 uppercase hover:text-green-700 text-base min-h-11"
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
