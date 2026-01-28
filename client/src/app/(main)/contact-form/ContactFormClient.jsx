"use client";

import React, { useEffect, useState } from "react";

const ContactFormClient = ({ initialData = null }) => {
  const [cmsData, setCmsData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });

  const API_URL = "http://localhost:4000/contact-form/";

  // 1. Fetch CMS Data
  useEffect(() => {
    if (initialData) return;

    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (response.ok) {
          const data = await response.json();
          console.log("CMS Data:", data);
          setCmsData(data);
        }
      } catch (error) {
        console.error("Error fetching CMS data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL, initialData]);

  // 2. Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Thank you! Your message has been sent.");
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-semibold text-gray-600">Loading...</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans text-gray-700 bg-white">
      {/* 1. Page Title (Dynamic) */}
      <h1 className="text-3xl font-bold text-gray-800 mb-10">
        {cmsData?.title || "Contact Form"}
      </h1>

      {/* 2. Scan to Connect Section */}
      <div className="text-center mb-12">
        <h2 className="text-lg text-lime-600 font-medium mb-4">
          {cmsData?.scan_title || "Scan to Connect"}
        </h2>

        {/* QR Codes Container */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          {/* WhatsApp QR */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded shadow-sm w-48 flex flex-col items-center">
            {/* Small user icon */}
            <div className="w-8 h-8 rounded-full bg-blue-100 mb-2 overflow-hidden">
              {/* Replace src with cmsData.whatsapp_icon if available */}
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 mb-2">WhatsApp contact</p>
            {/* QR Image - Using a placeholder if CMS doesn't provide one */}
            <img
              src={
                cmsData?.whatsapp_qr ||
                "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WhatsAppContact"
              }
              alt="WhatsApp QR"
              className="w-32 h-32"
            />
          </div>

          {/* WeChat QR */}
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

      {/* 3. Contact Form Section */}
      <div className="border border-gray-300 p-8 rounded-sm">
        <p className="text-sm text-gray-500 mb-6">
          <span className="text-red-500 font-bold">*</span> Indicates required
          fields
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Name and Email */}
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

          {/* Row 2: Subject */}
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

          {/* Row 3: Message */}
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

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-6 rounded-sm shadow-sm transition-colors"
            >
              SUBMIT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactFormClient;
