"use client";

import {
  LayoutDashboard,
  Ticket,
  Car,
  Settings,
  FileText,
  UserCircle,
  Menu,
  HelpCircle,
  Star,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    title: "General Settings",
    url: "/home",
    icon: FileText,
    roles: ["admin", "editor"],
  },
  {
    title: "Users",
    url: "/users",
    icon: UserCircle,
    roles: ["admin"],
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: Ticket,
    roles: ["admin"],
  },
  {
    title: "Category",
    url: "/category",
    icon: Car,
    roles: ["admin", "editor"],
  },
  {
    title: "Packages",
    url: "/popular-tour-packages",
    icon: Star,
    roles: ["admin", "editor"],
  },
  {
    title: "Blogs",
    url: "/blog",
    icon: Menu,
    roles: ["admin", "editor"],
  },
  // { title: "General Settings", url: "/general-settings", icon: Settings },
  // { title: "Inquiry", url: "/inquiry", icon: HelpCircle },
  {
    title: "Reviews",
    url: "/reviews",
    icon: Star,
    roles: ["admin", "editor"],
  },
  {
    title: "Pages",
    url: "/pages",
    icon: FileText,
    roles: ["admin", "editor"],
  },
  {
    title: "Travel Info",
    url: "/travel-information",
    icon: FileText,
    roles: ["admin", "editor"],
  },
  {
    title: "Team",
    url: "/team",
    icon: FileText,
    roles: ["admin", "editor"],
  },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  const [user, setUser] = useState({ name: "", email: "", role: "" });

  useEffect(() => {
    const storedUser =
      localStorage.getItem("admin_user") ||
      sessionStorage.getItem("admin_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role?.toLowerCase());
  });

  const isActive = (url) => {
    if (url === "/" && pathname === "/admin/dashboard") return true;
    return pathname?.startsWith(`/admin/dashboard${url}`) && url !== "/";
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-white shadow-md text-[17px]"
    >
      <SidebarContent>
        {/* Logo Section */}
        <div className="flex h-16 items-center border-b border-border px-6 bg-[linear-gradient(90deg,var(--admin-primary),var(--admin-primary-strong))]">
          {state === "expanded" || isMobile ? (
            <h1 className="text-xl font-bold text-white drop-shadow-sm whitespace-nowrap">
              EverestTour
            </h1>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
          )}
        </div>

        {/* Navigation */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="mb-2 px-3 text-gray-500 uppercase tracking-wider text-xs font-semibold">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="w-full mb-1"
                    >
                      <Link
                        href={`/admin/dashboard${item.url}`}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-[linear-gradient(90deg,var(--admin-primary),var(--admin-primary-strong))] !text-white shadow-md translate-x-1"
                            : "text-gray-600 hover:bg-[var(--admin-primary-soft)] hover:text-[var(--admin-primary-strong)]"
                        }`}
                      >
                        {item.icon && (
                          <item.icon
                            className={`h-5 w-5 shrink-0 transition-colors ${
                              active
                                ? "!text-white"
                                : "text-gray-500 group-hover:text-[var(--admin-primary-strong)]"
                            }`}
                          />
                        )}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border p-4 bg-gray-50">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-[var(--admin-primary)] flex items-center justify-center text-white font-semibold shadow-md shrink-0 border-2 border-white">
            ET
          </div>

          {(state === "expanded" || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-900">
                {user.name || "Guest User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email || "No email found"}
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
