"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  BookOpen,
  FileText,
  FolderKanban,
  Map,
  Package,
  ShieldUser,
  Star,
  Users,
} from "lucide-react";
import { BASE_URL } from "@/config/Config";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

const summaryCards = [
  { key: "users", label: "Users", icon: ShieldUser, color: "bg-sky-50 text-sky-700 border-sky-100" },
  { key: "categories", label: "Categories", icon: FolderKanban, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { key: "packages", label: "Packages", icon: Package, color: "bg-amber-50 text-amber-700 border-amber-100" },
  { key: "blogs", label: "Blogs", icon: BookOpen, color: "bg-rose-50 text-rose-700 border-rose-100" },
  { key: "reviews", label: "Reviews", icon: Star, color: "bg-violet-50 text-violet-700 border-violet-100" },
  { key: "pages", label: "Pages", icon: FileText, color: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  { key: "travelInfo", label: "Travel Info", icon: Map, color: "bg-lime-50 text-lime-700 border-lime-100" },
  { key: "team", label: "Team", icon: Users, color: "bg-orange-50 text-orange-700 border-orange-100" },
];

const DashboardPage = () => {
  const [counts, setCounts] = useState({
    users: 0,
    categories: 0,
    packages: 0,
    blogs: 0,
    reviews: 0,
    pages: 0,
    travelInfo: 0,
    team: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const token =
      Cookies.get("accessToken") ||
      (typeof window !== "undefined"
        ? localStorage.getItem("admin_token") ||
          sessionStorage.getItem("admin_token")
        : null) ||
      Cookies.get("token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const getList = async (url) => {
      const response = await axios.get(url, { headers: authHeaders });
      const payload = response.data;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.teams)) return payload.teams;
      if (Array.isArray(payload?.categories)) return payload.categories;
      if (Array.isArray(payload?.blogs)) return payload.blogs;
      if (Array.isArray(payload)) return payload;
      return [];
    };

    const fetchCounts = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          users,
          categories,
          packages,
          blogs,
          reviews,
          pages,
          travelInfo,
          team,
        ] = await Promise.all([
          getList(`${BASE_URL}/admin/getAll`),
          getList(`${BASE_URL}/category/`),
          getList(`${BASE_URL}/package-tour/`),
          getList(`${BASE_URL}/blog/`),
          getList(`${BASE_URL}/review/?limit=5000`),
          getList(`${BASE_URL}/cms/`),
          getList(`${BASE_URL}/travel-info/`),
          getList(`${BASE_URL}/team/`),
        ]);

        if (!active) return;

        setCounts({
          users: users.length,
          categories: categories.length,
          packages: packages.length,
          blogs: blogs.length,
          reviews: reviews.length,
          pages: pages.length,
          travelInfo: travelInfo.length,
          team: team.length,
        });
      } catch (fetchError) {
        if (!active) return;
        setError("Failed to load dashboard summary.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCounts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ProtectedRoute>
      <RoleProtectedRoute allowedRoles={["admin"]}>
        <div className="min-h-screen bg-[#f8fafc] p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="mt-2 text-slate-600">
                Quick summary of the main content and admin entities.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.key}
                    className={`rounded-2xl border p-5 shadow-sm ${card.color}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{card.label}</p>
                        <p className="mt-3 text-4xl font-bold text-slate-900">
                          {loading ? "..." : counts[card.key]}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
};

export default DashboardPage;
