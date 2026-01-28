"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";

const WelcomeSection = () => {
  const [welcome, setWelcome] = useState({
    subtitle: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    const fetchWelcome = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/settings/get`);
        const heroSetting = response.data?.data?.find(
          (setting) => setting.name === "hero"
        );
        if (heroSetting?.settings?.welcome) {
          setWelcome(heroSetting.settings.welcome);
        }
      } catch (error) {
        console.error("Error fetching welcome section:", error);
      }
    };
    fetchWelcome();
  }, []);

  if (!welcome.subtitle && !welcome.title && !welcome.description) return null;

  return (
    <section className="bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-14 lg:py-16">
        {welcome.subtitle && (
          <p
            className="text-[#9dbc7a] text-2xl font-medium"
            style={{ fontFamily: "var(--font-museo)" }}
          >
            {welcome.subtitle}
          </p>
        )}
        {welcome.title && (
          <h2
            className="mt-2 text-4xl font-bold text-gray-700"
            style={{ fontFamily: "var(--font-museo)" }}
          >
            {welcome.title}
          </h2>
        )}
        {welcome.description && (
          <div
            className="mt-4 text-lg text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: welcome.description }}
          />
        )}
      </div>
    </section>
  );
};

export default WelcomeSection;
