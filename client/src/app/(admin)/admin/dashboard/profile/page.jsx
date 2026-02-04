"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import axios from "axios";
import { BASE_URL } from "@/config/Config";

const emptyUser = {
  name: "Admin User",
  email: "",
  profileImage: "",
  role: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(emptyUser);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser =
      localStorage.getItem("admin_user") ||
      sessionStorage.getItem("admin_user") ||
      Cookies.get("user");
    const accessToken =
      Cookies.get("accessToken") ||
      Cookies.get("token") ||
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    if (!accessToken) {
      router.replace("/admin/login");
      return;
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          ...emptyUser,
          name: parsed.name || parsed.fullName || parsed.username || "Admin User",
          email: parsed.email || "",
          profileImage: parsed.profileImage || parsed.image || "",
          role: parsed.role || "",
        });
      } catch (error) {
        console.error("Failed to parse user cookie:", error);
      }
    }
  }, [router]);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setMessage("Please enter and confirm a new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const accessToken =
      Cookies.get("accessToken") ||
      Cookies.get("token") ||
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    if (!accessToken) {
      setMessage("Session expired. Please login again.");
      router.replace("/admin/login");
      return;
    }

    try {
      setSaving(true);
      await axios.patch(
        `${BASE_URL}/admin/reset-password`,
        { password: newPassword },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setMessage("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to update password.";
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl w-full">
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-[var(--admin-primary-soft)] border border-[var(--admin-primary-border)] flex items-center justify-center overflow-hidden">
            {user.profileImage ? (
              <Image
                src={user.profileImage}
                alt="Profile"
                width={80}
                height={80}
                className="object-cover h-full w-full"
              />
            ) : (
              <span className="text-[var(--admin-primary)] font-bold text-2xl">
                {user.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">
              {user.email || "Not set"}
            </p>
            {user.role && (
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">
                {user.role}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="bg-gray-50 border border-gray-100 rounded-md p-4">
            <p className="text-xs text-gray-500 mb-1">Display Name</p>
            <p className="text-sm text-gray-800">{user.name}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-md p-4">
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <p className="text-sm text-gray-800">
              {user.email || "Not set"}
            </p>
          </div>
          {user.role && (
            <div className="bg-gray-50 border border-gray-100 rounded-md p-4">
              <p className="text-xs text-gray-500 mb-1">Role</p>
              <p className="text-sm text-gray-800">{user.role}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h3>

        <form onSubmit={handlePasswordChange} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full border px-3 py-2 rounded"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full border px-3 py-2 rounded"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--admin-primary)] text-white py-2 rounded hover:bg-[var(--admin-primary-strong)] transition disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>

          {message && <p className="text-sm text-gray-600">{message}</p>}
        </form>
      </div>
    </div>
  );
}
