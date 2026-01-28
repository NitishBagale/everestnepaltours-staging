"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserList from "./UserList";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import Cookies from "js-cookie";

export default function UsersPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const accessToken =
      Cookies.get("accessToken") ||
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    if (!accessToken) {
      router.push("/admin/login");
    } else {
      setToken(accessToken);
    }
  }, [router]);

  if (!token) return null;

  return (
    <RoleProtectedRoute allowedRoles={["admin", "superadmin"]}>
      <UserList token={token} />
    </RoleProtectedRoute>
  );
}
