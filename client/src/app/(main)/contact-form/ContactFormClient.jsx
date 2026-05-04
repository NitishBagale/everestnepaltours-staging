"use client";

import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";

const ContactFormClient = ({ initialData = null }) => {
  const [cmsData] = useState(initialData);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      await axios.post(`${BASE_URL}/contact-form/`, formData);
      setFeedback({
        type: "success",
        message: "Thank you. Your message has been sent.",
      });
      setFormData({
        fullName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to send your message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans text-gray-700 bg-white">
      <h1 className="text-3xl font-bold text-gray-800 mb-10">
        {cmsData?.title || "Contact Form"}
      </h1>

      <div className="text-center mb-12">
        <h2 className="text-lg text-lime-600 font-medium mb-4">
          {cmsData?.scan_title || "Scan to Connect"}
        </h2>

        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          <div className="bg-gray-50 border border-gray-100 p-4 rounded shadow-sm w-48 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 mb-2 overflow-hidden">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 mb-2">WhatsApp contact</p>
            <img
              src={
                cmsData?.whatsapp_qr ||
                "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WhatsAppContact"
              }
              alt="WhatsApp QR"
              className="w-32 h-32"
            />
          </div>

          <div className="bg-gray-50 border border-gray-100 p-4 rounded shadow-sm w-48 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 mb-2 overflow-hidden">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 mb-2">WeChat contact</p>
            <img
              src={
                cmsData?.wechat_qr ||
                "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WeChatContact"
              }
              alt="WeChat QR"
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-300 p-8 rounded-sm">
        <p className="text-sm text-gray-500 mb-6">
          <span className="text-red-500 font-bold">*</span> Indicates required
          fields
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border border-gray-400 p-2 text-gray-700 focus:outline-none focus:border-lime-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-400 p-2 text-gray-700 focus:outline-none focus:border-lime-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-gray-400 p-2 text-gray-700 focus:outline-none focus:border-lime-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Your message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              rows="6"
              placeholder="Your Question/message/suggestion/review"
              value={formData.message}
              onChange={handleChange}
              className="w-full border border-gray-400 p-2 text-gray-700 focus:outline-none focus:border-lime-600 resize-y"
              required
            ></textarea>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-6 rounded-sm shadow-sm transition-colors"
            >
              {isSubmitting ? "SENDING..." : "SUBMIT"}
            </button>
          </div>

          {feedback.message && (
            <div
              className={`rounded-sm border px-4 py-3 text-sm ${
                feedback.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {feedback.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContactFormClient;
