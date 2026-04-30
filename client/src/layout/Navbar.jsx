import Link from "next/link";
import Image from "next/image";
import { getNavigationData } from "@/lib/siteApi";

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

export default async function Navbar() {
  const navLinks = await getNavigationData();

  return (
    <>
      <input id="site-menu-toggle" type="checkbox" className="peer/site-menu sr-only" />

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
              className="flex items-center gap-2 hover:text-[#35a576] transition"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#35a576]/10 text-[#35a576] text-xs font-bold">
                ☎
              </span>
              <span className="font-medium">+977-9851053024</span>
              <span className="text-gray-600">WhatsApp/Viber</span>
            </a>
            <a
              href="mailto:info@everestvacations.com"
              className="flex items-center gap-2 hover:text-[#35a576] transition"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#35a576]/10 text-[#35a576] font-bold">
                @
              </span>
              <span className="font-medium">info@everestvacations.com</span>
            </a>
          </div>

        </div>
      </div>

      <nav className="hidden md:block sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          <div className="flex gap-10 lg:gap-14 items-center h-full">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div key={link.href} className="relative group h-full">
                  <div className="flex items-center uppercase font-semibold text-base text-[#35a576] hover:text-[#2f9369] h-full border-b-2 border-transparent group-hover:border-[#35a576] transition-colors cursor-pointer min-h-11">
                    {link.label}
                    <ChevronIcon className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" />
                  </div>
                  <div className="invisible absolute top-full left-0 z-50 w-64 translate-y-2 rounded-b-md border-t-[3px] border-[#35a576] bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {link.dropdown.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className="flex items-center px-5 py-3 text-base font-medium text-gray-700 hover:bg-[#35a576]/10 hover:text-[#35a576] transition-colors w-full"
                      >
                        <span>{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="h-full flex items-center uppercase font-semibold text-base text-[#35a576] hover:text-[#2f9369] border-b-2 border-transparent hover:border-[#35a576] transition-colors min-h-11"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <label
            htmlFor="site-menu-toggle"
            className="text-gray-700 p-2 min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </label>

        </div>
      </nav>

      <label
        htmlFor="site-menu-toggle"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 cursor-pointer opacity-0 pointer-events-none transition-opacity peer-checked/site-menu:opacity-100 peer-checked/site-menu:pointer-events-auto"
        aria-hidden="true"
      />

      <aside className="fixed inset-y-0 right-0 w-[85%] sm:w-[320px] bg-white z-70 shadow-2xl translate-x-full transition-transform duration-300 ease-out peer-checked/site-menu:translate-x-0">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <span className="font-bold text-lg text-[#35a576]">Menu</span>
          <label
            htmlFor="site-menu-toggle"
            className="p-2 min-h-11 min-w-11 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
            aria-label="Close navigation menu"
          >
            <XIcon />
          </label>
        </div>

        <div className="p-4 overflow-y-auto h-full pb-20">
          {navLinks.map((link) => (
            <div key={link.href} className="border-b border-gray-50">
              {link.dropdown ? (
                <details>
                  <summary className="list-none flex justify-between w-full py-4 font-bold text-gray-800 uppercase hover:text-[#35a576] text-base min-h-11 items-center cursor-pointer">
                    <span>{link.label}</span>
                    <ChevronIcon className="w-5 h-5 text-gray-500" />
                  </summary>

                  <div className="pl-4 pb-4 space-y-1 bg-gray-50 rounded-lg mb-2 pt-2">
                    {link.dropdown.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block py-3 text-base font-medium text-gray-700 hover:text-[#35a576]"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  href={link.href}
                  className="block py-4 font-bold text-gray-800 uppercase hover:text-[#35a576] text-base min-h-11"
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
