"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Toaster } from "../ui/sonner";
import { BASE_URL } from "@/config/Config";

const Form = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      window.location.href = "/admin/dashboard";
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/admin/login`, {
        email,
        password,
      });

      const token = res?.data?.data?.token;
      const admin = res?.data?.data?.admin;

      if (token) {
        document.cookie = `accessToken=${token}; path=/;`;

        if (remember) {
          localStorage.setItem("admin_token", token);
          localStorage.setItem("admin_user", JSON.stringify(admin));
        } else {
          sessionStorage.setItem("admin_token", token);
          sessionStorage.setItem("admin_user", JSON.stringify(admin));
        }

        toast.success("Login successful");

        setTimeout(() => {
          window.location.href = "/admin/dashboard";
        }, 500);
      } else {
        const msg = res?.data?.message || "Login failed";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Login error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96 rounded-2xl border border-emerald-200/80 bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Admin login
            </h2>
          </div>

          <div className="mt-10">
            <Toaster />
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div>
                <label className="block text-sm font-medium">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 ring-1 ring-gray-300 text-gray-900 focus:ring-2 focus:ring-[#3ba883] hover:ring-[#3ba883]/70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 ring-1 ring-gray-300 text-gray-900 focus:ring-2 focus:ring-[#3ba883] hover:ring-[#3ba883]/70"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 text-[#3ba883] focus:ring-[#3ba883]"
                  />
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#3ba883] py-2.5 text-white hover:bg-[#339674] disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form;
