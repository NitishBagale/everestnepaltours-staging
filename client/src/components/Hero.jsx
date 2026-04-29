import Image from "next/image";
import { getMediaAlt, getMediaObject, getMediaUrl } from "@/lib/media";

const Hero = ({ slides = [] }) => {
  const primarySlide = slides[0] || {};
  const media = getMediaObject(primarySlide);
  const imageUrl = getMediaUrl(media, "large") || getMediaUrl(media, "medium") || "/bhutan.jpg";
  const imageAlt = getMediaAlt(media, primarySlide.title || primarySlide.alt || "Everest Vacation hero image");
  const titleLines = primarySlide.title
    ? String(primarySlide.title)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

  return (
    <section className="font-sans relative w-full min-h-[520px] overflow-hidden bg-slate-900">
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          priority
          quality={82}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/40 to-slate-900/15" />
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-24 md:py-28 lg:py-32 min-h-[520px] flex items-center">
        <div className="max-w-4xl text-white">
          {titleLines.length > 0 && (
            <h1 className="font-bold">
              {titleLines.map((line, index) => (
                <span
                  key={`${line}-${index}`}
                  className="block text-5xl sm:text-6xl lg:text-8xl leading-[0.95] pb-3 sm:pb-4"
                  style={{ fontFamily: "var(--font-museo)" }}
                >
                  {line}
                </span>
              ))}
            </h1>
          )}
          {primarySlide.caption && (
            <p className="mt-4 max-w-2xl text-lg sm:text-xl lg:text-2xl font-medium text-white/95">
              {primarySlide.caption}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
