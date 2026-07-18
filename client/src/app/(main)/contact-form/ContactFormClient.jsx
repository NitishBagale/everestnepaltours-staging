"use client";

import React, { useState } from "react";
import Form from "@/components/Form";

const ContactFormClient = ({ initialData = null }) => {
  const [cmsData] = useState(initialData);
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

      <Form />
    </div>
  );
};

export default ContactFormClient;
