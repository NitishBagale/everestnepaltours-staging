"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import { getMediaObject, getMediaUrl } from "@/lib/media";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

const FeaturedPackagesSection = () => {
  const [featured, setFeatured] = useState({
    title: "",
    description: "",
    packageIds: [],
  });
  const [packages, setPackages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, packagesRes] = await Promise.all([
          axios.get(`${BASE_URL}/settings/get`),
          axios.get(`${BASE_URL}/package-tour/`),
        ]);

        const heroSetting = settingsRes.data?.data?.find(
          (setting) => setting.name === "hero"
        );
        if (heroSetting?.settings?.featuredPackages) {
          setFeatured(heroSetting.settings.featuredPackages);
        }

        const list = packagesRes.data?.data || packagesRes.data || [];
        setPackages(list.map((pkg) => pkg.package || pkg));
      } catch (error) {
        console.error("Error fetching featured packages:", error);
      }
    };
    fetchData();
  }, []);

  const selected = useMemo(() => {
    const ids = (featured.packageIds || []).map(String);
    const map = new Map();
    packages.forEach((pkg) => {
      const key =
        pkg.id ??
        pkg._id ??
        pkg.packageId ??
        pkg.package_id ??
        pkg.slug ??
        pkg.title;
      if (key == null) return;
      map.set(String(key), pkg);
    });
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, [packages, featured.packageIds]);

  if (!featured.title && !featured.description && selected.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-14 lg:py-16">
        {featured.title && (
          <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-wider">
            {featured.title}
          </h2>
        )}
        {featured.description && (
          <div
            className="mt-4 text-lg text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: featured.description }}
          />
        )}

        {selected.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selected.map((item, index) => {
              const slug = item.title
                ? item.title.toLowerCase().replace(/,/g, "").replace(/\s+/g, "-")
                : "";
              const media = getMediaObject(item.mainImage || item.image);
              const imageSrc = getMediaUrl(media, "medium") || "/bhutan.jpg";
              const description =
                item.sub_description || item.subDescription || "";

              return (
                <div
                  key={item.id ?? item._id ?? index}
                  className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200"
                >
                  <div
                    className="relative h-56 w-full overflow-hidden cursor-pointer"
                    onClick={() => slug && router.push(`/${slug}`)}
                  >
                    <img
                      src={imageSrc}
                      alt={item.title || "Featured Package"}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="pt-4 px-4 pb-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 leading-tight">
                      {item.title || "Featured Package"}
                    </h3>
                    {description ? (
                      <p
                        className="text-base text-emerald-500 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
                    ) : (
                      <p className="text-base text-emerald-500 leading-relaxed">
                        Explore this featured package.
                      </p>
                    )}
                    <div className="mt-2 text-sm text-gray-400">
                      ({item.reviewCount || item.reviews || 0} reviews)
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-600 text-sm">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>
                          {item.duration || "5 Days"},{" "}
                          {item.tourType || item.type || "Private Tour"}
                        </span>
                      </div>
                      <button
                        onClick={() => slug && router.push(`/${slug}`)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded shadow-sm transition-colors duration-200"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedPackagesSection;
