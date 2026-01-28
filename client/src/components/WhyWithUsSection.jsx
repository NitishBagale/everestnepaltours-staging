"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import {
  Medal,
  HandCoins,
  UserCheck,
  Users,
  Map,
  CalendarDays,
} from "lucide-react";

const iconMap = {
  Medal,
  HandCoins,
  UserCheck,
  Users,
  Map,
  CalendarDays,
};

const WhyWithUsSection = () => {
  const [data, setData] = useState({
    title: "",
    description: "",
    items: [],
  });

  useEffect(() => {
    const fetchWhy = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/settings/get`);
        const heroSetting = response.data?.data?.find(
          (setting) => setting.name === "hero"
        );
        if (heroSetting?.settings?.whyWithUs) {
          setData(heroSetting.settings.whyWithUs);
        }
      } catch (error) {
        console.error("Error fetching why-with-us section:", error);
      }
    };
    fetchWhy();
  }, []);

  if (!data.title && !data.description && !data.items?.length) return null;

  const lines = data.title ? data.title.split("\n").filter(Boolean) : [];

  return (
    <section className="bg-[rgb(53,165,118)] text-white">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 sm:gap-10 lg:gap-14 items-center">
          <div>
            {lines.length > 0 && (
              <h3
                className="text-2xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-museo)" }}
              >
                {lines.map((line, idx) => (
                  <span key={idx} className="block">
                    {line}
                  </span>
                ))}
              </h3>
            )}
            {data.description && (
              <p className="mt-4 text-lg text-white/90">
                {data.description}
              </p>
            )}
          </div>

          {data.items?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {data.items.map((item, index) => {
                const Icon = iconMap[item.icon] || Medal;
                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/30 bg-white/5 px-4 sm:px-5 py-3 sm:py-4"
                    style={{ fontFamily: "var(--font-museo)" }}
                  >
                    <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white/80" />
                    </span>
                    <span className="text-lg font-semibold">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WhyWithUsSection;
