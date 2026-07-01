"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const statusClasses = {
  paid: "bg-emerald-100 text-emerald-800",
  initiated: "bg-amber-100 text-amber-800",
  cancelled: "bg-slate-200 text-slate-700",
  failed: "bg-red-100 text-red-700",
};

export default function OnlineBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingRef, setDeletingRef] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const getToken = () =>
    Cookies.get("accessToken") ||
    localStorage.getItem("admin_token") ||
    sessionStorage.getItem("admin_token") ||
    Cookies.get("token");

  useEffect(() => {
    let active = true;

    const loadBookings = async () => {
      setLoading(true);
      setError("");

      try {
        const token = getToken();
        const response = await axios.get(`${BASE_URL}/online-booking/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!active) return;

        setBookings(
          Array.isArray(response.data?.data) ? response.data.data : []
        );
      } catch (err) {
        if (!active) return;
        setError("Failed to load online bookings.");
        setBookings([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      active = false;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;

    return bookings.filter((booking) =>
      [
        booking.bookingRef,
        booking.fullName,
        booking.email,
        booking.tripName,
        booking.paymentStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [bookings, search]);

  const handleDelete = async (bookingRef) => {
    const confirmed = window.confirm(
      `Delete online booking ${bookingRef}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingRef(bookingRef);
    try {
      const token = getToken();
      await axios.delete(`${BASE_URL}/online-booking/${bookingRef}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setBookings((prev) =>
        prev.filter((booking) => booking.bookingRef !== bookingRef)
      );
      if (selectedBooking?.bookingRef === bookingRef) {
        setSelectedBooking(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete online booking."
      );
    } finally {
      setDeletingRef("");
    }
  };

  return (
    <RoleProtectedRoute allowedRoles={["admin", "editor", "superadmin"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Online Bookings</h1>
            <p className="mt-2 text-slate-600">
              HBL online booking records captured from the public payment form.
            </p>
          </div>

          <div className="w-full md:w-80">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search bookings
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ref, name, email, trip..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[var(--admin-primary)]"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {selectedBooking ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Booking Details
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedBooking.bookingRef}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Full Name" value={selectedBooking.fullName} />
              <DetailItem label="Email" value={selectedBooking.email} />
              <DetailItem label="Country" value={selectedBooking.country || "-"} />
              <DetailItem label="Trip Name" value={selectedBooking.tripName} />
              <DetailItem label="Trip Date" value={selectedBooking.tripDate} />
              <DetailItem label="Total Pax" value={selectedBooking.totalPax} />
              <DetailItem
                label="Deposit Amount"
                value={`$${selectedBooking.depositAmount}`}
              />
              <DetailItem
                label="Payment Status"
                value={selectedBooking.paymentStatus}
              />
              <DetailItem
                label="Gateway Status"
                value={selectedBooking.gatewayStatus || "-"}
              />
              <DetailItem
                label="Gateway Reference"
                value={selectedBooking.gatewayReference || "-"}
              />
              <DetailItem
                label="Created"
                value={formatDateTime(selectedBooking.createdAt)}
              />
              <DetailItem
                label="Updated"
                value={formatDateTime(selectedBooking.updatedAt)}
              />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-slate-800">Message</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {selectedBooking.message || "-"}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Booking Ref",
                    "Customer",
                    "Trip",
                    "Amount",
                    "Payment",
                    "Created",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading online bookings...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No online bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id || booking.bookingRef} className="align-top">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {booking.bookingRef}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="font-medium text-slate-900">{booking.fullName}</div>
                        <div>{booking.email}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="font-medium text-slate-900">{booking.tripName}</div>
                        <div>{booking.tripDate}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        ${booking.depositAmount}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusClasses[booking.paymentStatus] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatDateTime(booking.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(booking)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(booking.bookingRef)}
                            disabled={deletingRef === booking.bookingRef}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingRef === booking.bookingRef
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}
