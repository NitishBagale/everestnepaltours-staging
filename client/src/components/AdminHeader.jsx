"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import Image from "next/image";
import Cookies from "js-cookie";

const AdminHeader = () => {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "User",
    email: "",
    profileImage: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("admin_user") ||
      sessionStorage.getItem("admin_user") ||
      Cookies.get("user");

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          name: parsed.name || parsed.fullName || parsed.username || "User",
          email: parsed.email || "",
          profileImage: parsed.profileImage || parsed.image || "",
        });
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/admin/logout", { method: "PUT" });
    } catch (error) {
      // ignore logout network errors and still clear local state
    }
    Cookies.remove("accessToken");
    Cookies.remove("token");
    Cookies.remove("user");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    router.replace("/admin/login");
  };

  return (
    <header className="sticky top-0 z-20 w-full h-16 flex items-center justify-between bg-white border-b border-gray-200 px-4 shadow-sm">
      {/* --- Left Section: Sidebar Trigger & Title --- */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-gray-600 hover:text-[var(--admin-primary)] transition-colors" />

        <h1 className="text-lg font-semibold text-gray-800 hidden md:block">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
          <Bell className="w-5 h-5" />

          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 focus:outline-none"
          >
            <div className="h-9 w-9 rounded-full bg-[var(--admin-primary-soft)] border border-[var(--admin-primary-border)] flex items-center justify-center overflow-hidden">
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt="User"
                  width={36}
                  height={36}
                  className="object-cover h-full w-full"
                />
              ) : (
                <span className="text-[var(--admin-primary)] font-bold text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Dropdown Arrow */}
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              ></div>

              <div className="absolute right-0 mt-3 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email || "admin@helicar.com"}
                  </p>
                </div>

                <a
                  href="/admin/dashboard/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--admin-primary)]"
                >
                  <User className="w-4 h-4" />
                  Profile
                </a>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
