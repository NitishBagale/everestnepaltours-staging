"use client";

import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import { Loader2 } from "lucide-react";

const OTPVerifyPage = () => {
  const [email, setEmail] = useState("");
  const [OTP, setOTP] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [bookingDetails, setBookingDetails] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.put(`${BASE_URL}/booking/verify`, {
        email,
        OTP,
      });

      if (res.status === 200) {
        setSuccessMsg("Email verified successfully!");

        setBookingDetails(res.data.booking || null);
      }
    } catch (error) {
      console.error("Verification Error:", error);
      setErrorMsg(error.response?.data?.message || "Verification failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 font-sans">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">
        Verify Your Booking
      </h2>

      <div className="bg-white p-8 rounded border border-slate-300 shadow-sm">
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Enter Your Email
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              OTP Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={OTP}
              onChange={(e) => setOTP(e.target.value)}
              className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {successMsg}
            </div>
          )}
        </form>

        {bookingDetails && (
          <div className="mt-8 p-6 bg-slate-50 border rounded">
            <h3 className="text-xl font-bold text-slate-800 mb-3">
              Booking Details
            </h3>

            <p>
              <strong>Name:</strong> {bookingDetails?.trvellerInfo?.fullName}
            </p>
            <p>
              <strong>Email:</strong> {bookingDetails?.trvellerInfo?.email}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {bookingDetails?.trvellerInfo?.contactNumber}
            </p>
            <p>
              <strong>Travel Date:</strong>{" "}
              {bookingDetails?.trvellerInfo?.travelDate}
            </p>
            <p>
              <strong>No. of Travellers:</strong>{" "}
              {bookingDetails?.trvellerInfo?.noOfTravellers}
            </p>
            <p>
              <strong>Accommodation:</strong>{" "}
              {bookingDetails?.trvellerInfo?.accommodation}
            </p>
            <p>
              <strong>Passport Country:</strong>{" "}
              {bookingDetails?.trvellerInfo?.passport}
            </p>
            <p>
              <strong>Status:</strong> {bookingDetails?.status}
            </p>
            <p>
              <strong>Payment:</strong> {bookingDetails?.paymentStatus}
            </p>

            {bookingDetails?.details && (
              <p className="mt-3">
                <strong>Notes:</strong> {bookingDetails?.details}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPVerifyPage;
