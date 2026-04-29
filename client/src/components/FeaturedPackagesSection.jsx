import Image from "next/image";
import Link from "next/link";
import { getMediaObject, getMediaUrl } from "@/lib/media";
import { Clock } from "lucide-react";
import {
  getPackageCardAlt,
  getPackageKeys,
  getPackageReviewCount,
} from "@/lib/packageListing";

const toSlugFallback = (value) =>
  value
    ? String(value)
        .toLowerCase()
        .replace(/,/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
    : "";

const FeaturedPackagesSection = ({
  featured = {
    title: "",
    description: "",
    packageIds: [],
  },
  packages = [],
  reviewCountMap = {},
}) => {
  const selected = (() => {
    const ids = (featured.packageIds || [])
      .map((id) => String(id || "").trim())
      .filter(Boolean);
    const map = new Map();
    packages.forEach((pkg) => {
      getPackageKeys(pkg).forEach((key) => map.set(key, pkg));
    });
    return ids.map((id) => map.get(id)).filter(Boolean);
  })();

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
              const slug = item.slug || toSlugFallback(item.title);
              const media = getMediaObject(item.mainImage || item.image);
              const imageSrc = getMediaUrl(media, "medium") || "/bhutan.jpg";
              const imageAlt = getPackageCardAlt(media, item, "Featured package image");
              const reviewCount = getPackageReviewCount(item, reviewCountMap);
              const description =
                item.sub_description || item.subDescription || "";

              return (
                <article
                  key={item.id ?? item._id ?? index}
                  className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200"
                >
                  <Link
                    href={slug ? `/${slug}` : "/"}
                    className="relative block h-56 w-full overflow-hidden"
                    aria-label={`View details for ${item.title || "featured package"}`}
                  >
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={76}
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </Link>
                  <div className="pt-4 px-4 pb-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 leading-tight">
                      {item.title || "Featured Package"}
                    </h3>
                    {description ? (
                      <p
                        className="text-base text-emerald-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
                    ) : (
                      <p className="text-base text-emerald-700 leading-relaxed">
                        Explore this featured package.
                      </p>
                    )}
                    <div className="mt-2 text-sm text-gray-400">
                      ({reviewCount} reviews)
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-600 text-sm">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>
                          {item.duration || "5 Days"},{" "}
                          {item.tourType || item.type || "Private Tour"}
                        </span>
                      </div>
                      <Link
                        href={slug ? `/${slug}` : "/"}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2 rounded shadow-sm transition-colors duration-200"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedPackagesSection;
