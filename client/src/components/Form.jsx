"use client";

import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";

const Form = ({ packageName = "" }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    travelers: "",
    country: "",
    travelDate: "",
    accommodation: "",
    details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const accommodations = [
    "Prefer Hotel Category",
    "3 Star",
    "4 Star",
    "5 Star",
    "Resort",
    "Luxury/High-end",
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status !== "idle") {
      setStatus("idle");
      setFeedbackMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setFeedbackMessage("");

    try {
      const message = [
        packageName ? `Package: ${packageName}` : "",
        `Travelers: ${formData.travelers}`,
        `Country of passport: ${formData.country}`,
        `Travel date: ${formData.travelDate}`,
        `Accommodation: ${formData.accommodation}`,
        formData.details ? `Trip details: ${formData.details}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      await axios.post(`${BASE_URL}/enquiry/create`, {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone,
        message,
      });

      setStatus("success");
      setFeedbackMessage("Thank you. Your enquiry has been sent successfully.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        travelers: "",
        country: "",
        travelDate: "",
        accommodation: "",
        details: "",
      });
    } catch (error) {
      setStatus("error");
      setFeedbackMessage(
        error.response?.data?.message ||
          "Sorry, there was an error submitting your enquiry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-sans flex justify-center items-center p-2 mb-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl bg-white shadow-md rounded-lg p-8 border border-gray-200"
      >
        <h2
          style={{
            marginBottom: "25px",
            fontSize: "30px",
            color: "rgb(53, 165, 118)",
            fontFamily: "MuseoModerno, sans-serif",
          }}
        >
          Ask to Expert about this trip
        </h2>
        <p className="text-gray-600 mb-1 text-sm">
          Fill the form below for your interest.
        </p>
        <p className="text-sm text-gray-600 mb-6">
          <span className="text-red-500 font-bold">*</span> indicates required
          fields
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Number of Travelers <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="travelers"
              value={formData.travelers}
              onChange={handleChange}
              placeholder="Number of Travelers"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Country of Passport <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country of passport"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Travel Date (Tentative) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="travelDate"
              value={formData.travelDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Accommodation <span className="text-red-500">*</span>
            </label>
            <select
              name="accommodation"
              value={formData.accommodation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
              required
            >
              {accommodations.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Trip details if you want to share
          </label>
          <textarea
            name="details"
            value={formData.details}
            onChange={handleChange}
            rows="5"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`font-semibold px-6 py-2 rounded text-sm uppercase transition ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700"
          } text-white`}
        >
          {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
        </button>

        {feedbackMessage && (
          <div
            className={`mt-4 p-3 rounded-md ${
              status === "error"
                ? "bg-red-100 text-red-700 border border-red-400"
                : "bg-green-100 text-green-700 border border-green-400"
            }`}
            role="alert"
            aria-live="polite"
          >
            {feedbackMessage}
          </div>
        )}
      </form>
    </div>
  );
};

export default Form;
