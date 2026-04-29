import Link from "next/link";
import Image from "next/image";
import { getNavigationData } from "@/lib/siteApi";
import MobileNavbar from "@/layout/MobileNavbar";

const ChevronIcon = ({ className = "w-4 h-4" }) => (
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

export default async function Navbar() {
  const navLinks = await getNavigationData();

  return (
    <>
      <div className="bg-white border-b border-gray-100 relative z-50">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 py-3 flex justify-between items-center gap-4">
          <Link href="/" className="shrink-0 cursor-pointer">
            <Image
              src="/logo.png"
              alt="Everest Vacation"
              width={220}
              height={80}
              priority
              className="w-[170px] md:w-[215px] h-auto"
            />
          </Link>

          <div className="hidden md:flex gap-8 text-base text-gray-700 items-center">
            <a
              href="tel:+9779851053024"
              className="flex items-center gap-2 hover:text-green-800 transition"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                ☎
              </span>
              <span className="font-medium">+977-9851053024</span>
              <span className="text-gray-600">WhatsApp/Viber</span>
            </a>
            <a
              href="mailto:info@everestvacations.com"
              className="flex items-center gap-2 hover:text-green-800 transition"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 font-bold">
                @
              </span>
              <span className="font-medium">info@everestvacations.com</span>
            </a>
          </div>

          <div className="md:hidden">
            <MobileNavbar navLinks={navLinks} />
          </div>
        </div>
      </div>

      <nav className="hidden md:block sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          <div className="flex gap-10 lg:gap-14 items-center h-full">
            {navLinks.map((link) =>
              link.dropdown ? (
                <details key={link.href} className="relative group h-full">
                  <summary className="list-none flex items-center uppercase font-semibold text-base text-[#1f6a4a] hover:text-green-900 h-full border-b-2 border-transparent hover:border-green-600 transition-colors cursor-pointer min-h-11">
                    {link.label}
                    <ChevronIcon className="ml-1 w-4 h-4" />
                  </summary>
                  <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-b-md border-t-[3px] border-green-700 z-50 py-2">
                    {link.dropdown.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className="flex items-center px-5 py-3 text-base font-medium text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors w-full"
                      >
                        <span>{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="h-full flex items-center uppercase font-semibold text-base text-[#1f6a4a] hover:text-green-900 border-b-2 border-transparent hover:border-green-600 transition-colors min-h-11"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center">
            <MobileNavbar navLinks={navLinks} />
          </div>
        </div>
      </nav>
    </>
  );
}
