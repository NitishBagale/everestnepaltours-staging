"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminUser =
        sessionStorage.getItem("admin_user") ||
        localStorage.getItem("admin_user");

      if (!adminUser) {
        router.replace("/admin/login");
        return;
      }

      try {
        const user = JSON.parse(adminUser);
        const userRole = user.role?.toLowerCase();

        if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
          setHasAccess(true);
        } else {
          if (userRole === "Editor") {
            router.replace("/admin/dashboard/category");
          } else {
            router.replace("/admin/dashboard");
          }
        }
      } catch (error) {
        console.error("Error parsing admin user:", error);
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    }
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-lg animate-pulse">
          Checking permissions…
        </p>
      </div>
    );
  }

  if (!hasAccess) return null;

  return <>{children}</>;
};

export default RoleProtectedRoute;
