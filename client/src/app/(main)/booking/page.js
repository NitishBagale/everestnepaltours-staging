"use client";

import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const Page = ({ packageName }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    noOfTravellers: "",
    passport: "",
    travelDate: "",
    accommodation: "3-Star Hotel",
    details: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      bookingDate: new Date().toISOString().split("T")[0],
      pickupDate: formData.travelDate,
      returnDate: formData.travelDate,
      totalAmount: "0",
      status: "pending",
      paymentStatus: "unpaid",
      pickUp: "Kathmandu",
      destination: "Nepal",
      anotherDestination: "",
      packageName: packageName || "Custom Trip",
      details: "Online Website Booking Request",
      trvellerInfo: {
        fullName: formData.fullName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        travelDate: formData.travelDate,
        noOfTravellers: Number(formData.noOfTravellers),
        accommodation: formData.accommodation,
        passport: formData.passport,
        details: formData.details,
      },
    };

    try {
      const res = await axios.post(`${BASE_URL}/booking/create`, payload);

      if (res.status === 200 || res.status === 201) {
        setSuccessMsg("Booking request sent successfully! Check your email.");

        setFormData({
          fullName: "",
          email: "",
          contactNumber: "",
          noOfTravellers: "",
          passport: "",
          travelDate: "",
          accommodation: "3-Star Hotel",
          details: "",
        });

        router.push("/otp");
      }
    } catch (error) {
      console.error("Booking Error", error);
      setErrorMsg("Failed to submit booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 font-sans">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Customize Trip</h2>

      <div className="bg-white border border-slate-300 rounded-sm p-8 shadow-sm">
        <p className="text-sm text-slate-500 mb-6">
          <span className="text-orange-500 font-bold">*</span> indicates
          required fields
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Full Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Email Address <span className="text-orange-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Phone Number <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                name="contactNumber"
                required
                placeholder="Phone Number"
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Number of Travelers <span className="text-orange-500">*</span>
              </label>
              <input
                type="number"
                name="noOfTravellers"
                required
                placeholder="Number of Travelers"
                value={formData.noOfTravellers}
                onChange={handleChange}
                className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Country of Passport <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                name="passport"
                required
                placeholder="Country of passport"
                value={formData.passport}
                onChange={handleChange}
                className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Travel Date (Tentative){" "}
                <span className="text-orange-500">*</span>
              </label>
              <input
                type="date"
                name="travelDate"
                required
                value={formData.travelDate}
                onChange={handleChange}
                className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Accommodation <span className="text-orange-500">*</span>
              </label>
              <select
                name="accommodation"
                value={formData.accommodation}
                onChange={handleChange}
                className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700 bg-white"
              >
                <option value="3-Star Hotel">3-Star Hotel</option>
                <option value="4-Star Hotel">4-Star Hotel</option>
                <option value="5-Star Hotel">5-Star Hotel</option>
                <option value="Hostel">Hostel</option>
                <option value="Homestay">Homestay</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Trip details if you want to share
            </label>
            <textarea
              name="details"
              rows="4"
              value={formData.details}
              onChange={handleChange}
              className="w-full border border-slate-400 rounded px-3 py-2 text-slate-700"
            ></textarea>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#3ba883] hover:bg-[#2e8a6b] text-white font-bold py-2 px-8 rounded shadow-sm uppercase text-sm flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <strong className="font-bold">Success! </strong> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong className="font-bold">Error! </strong> {errorMsg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Page;
