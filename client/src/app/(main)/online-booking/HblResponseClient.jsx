"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";

const statusMap = {
  success: {
    paymentStatus: "paid",
    gatewayStatus: "success",
    title: "Payment received",
    message:
      "We have received your payment notification. Our team will review and confirm the booking shortly.",
  },
  cancel: {
    paymentStatus: "cancelled",
    gatewayStatus: "cancelled",
    title: "Payment cancelled",
    message:
      "The payment was cancelled before completion. You can return to the booking page and try again.",
  },
  failed: {
    paymentStatus: "failed",
    gatewayStatus: "failed",
    title: "Payment failed",
    message:
      "The payment did not complete successfully. Please try again or contact support.",
  },
};

export default function HblResponseClient({ bookingRef, payment, amount }) {
  const [syncState, setSyncState] = useState("pending");
  const [syncError, setSyncError] = useState("");

  const status = useMemo(
    () => statusMap[payment] || statusMap.failed,
    [payment]
  );

  useEffect(() => {
    if (!bookingRef) {
      setSyncState("done");
      return;
    }

    let cancelled = false;

    const updateBookingStatus = async () => {
      try {
        await axios.patch(`${BASE_URL}/online-booking/${bookingRef}/status`, {
          paymentStatus: status.paymentStatus,
          gatewayStatus: status.gatewayStatus,
          gatewayReference: bookingRef,
        });
        if (!cancelled) {
          setSyncState("done");
        }
      } catch (error) {
        if (!cancelled) {
          setSyncState("error");
          setSyncError(
            error.response?.data?.message ||
              "Could not update booking status automatically."
          );
        }
      }
    };

    updateBookingStatus();

    return () => {
      cancelled = true;
    };
  }, [bookingRef, status.gatewayStatus, status.paymentStatus]);

  return (
    <div className="bg-[#f7fbf8]">
      <section className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_20px_70px_-45px_rgba(13,63,37,0.45)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            HBL Response
          </p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">
            {status.title}
          </h1>
          <p className="mt-4 text-lg text-slate-600">{status.message}</p>

          <div className="mt-8 grid gap-4 rounded-3xl bg-slate-50 p-5 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-900">Booking Ref</p>
              <p>{bookingRef || "Unavailable"}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Amount</p>
              <p>{amount ? `$${amount}` : "Unavailable"}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
            {syncState === "pending"
              ? "Finalizing your booking status..."
              : syncState === "error"
                ? syncError
                : "Booking status has been updated."}
          </div>

          <div className="mt-8">
            <a
              href="/online-booking"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-7 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-emerald-700"
            >
              Back To Booking Page
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
