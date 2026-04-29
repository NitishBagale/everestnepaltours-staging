"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  getMediaAlt,
  getMediaObject,
  getMediaUrl,
  getOptimizedCloudinaryUrl,
} from "@/lib/media";

const HERO_IMAGE_WIDTHS = [360, 480, 640, 768, 960];

const getHeroImageSources = (image) => {
  const media = getMediaObject(image);
  const originalUrl =
    getMediaUrl(media, "large") || getMediaUrl(media, "medium") || image?.url || "";
  const fallbackUrl = originalUrl || "/bhutan.jpg";

  if (!originalUrl || !fallbackUrl.includes("res.cloudinary.com")) {
    return { src: fallbackUrl, srcSet: "" };
  }

  return {
    src: getOptimizedCloudinaryUrl(fallbackUrl, {
      width: 960,
      quality: "auto:low",
    }),
    srcSet: HERO_IMAGE_WIDTHS.map((width) =>
      `${getOptimizedCloudinaryUrl(fallbackUrl, {
        width,
        quality: "auto:low",
      })} ${width}w`
    ).join(", "),
  };
};

const Hero = ({ slides = [] }) => {
  const images = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 7000);
    return () => clearInterval(interval);
  }, [images.length]);

  const activeImage = images[currentIndex];
  const activeMedia = getMediaObject(activeImage);
  const activeAlt = getMediaAlt(
    activeMedia,
    activeImage?.title || activeImage?.alt || "Hero image"
  );
  const { src, srcSet } = getHeroImageSources(activeImage || {});

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const delta = touchStartX.current - touchEndX.current;

    if (delta > 50) {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    } else if (delta < -50) {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  if (!activeImage) return null;

  return (
    <section
      className="font-sans relative w-full h-[62vh] min-h-[380px] sm:h-[72vh] sm:min-h-[480px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        key={activeImage.id || activeImage.url || `hero-slide-${currentIndex}`}
        className="absolute inset-0"
      >
        <img
          src={src}
          srcSet={srcSet || undefined}
          sizes="100vw"
          alt={activeAlt}
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />

        {(activeImage.title || activeImage.caption) && (
          <div className="absolute inset-x-0 top-14 text-white sm:top-20 md:top-24">
            <div className="mx-auto max-w-screen-2xl px-6 sm:px-8 lg:px-12">
              <div className="max-w-[74%]">
                {activeImage.title && (
                  <h2 className="font-bold">
                    {activeImage.title.split(",").map((part, titleIndex) => (
                      <span
                        key={`${activeImage.id || activeImage.url || currentIndex}-${titleIndex}`}
                        className="block pb-[14px] text-[52px] font-bold leading-[1] text-white sm:pb-[20px] sm:text-[76px] lg:pb-[26px] lg:text-[108px]"
                        style={{
                          fontFamily: '"MuseoModerno", sans-serif',
                          textShadow: "1px 1px #333",
                        }}
                      >
                        {part.trim()}
                      </span>
                    ))}
                  </h2>
                )}
                {activeImage.caption && (
                  <p className="mt-4 text-base font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] sm:text-lg md:text-xl lg:text-2xl">
                    {activeImage.caption}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 sm:right-4 sm:gap-3 md:right-5">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className="flex h-11 w-11 items-center justify-center -my-3"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to hero slide ${idx + 1}`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? "h-4 w-4 bg-white scale-125"
                    : "h-3 w-3 bg-gray-300 sm:h-4 sm:w-4"
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
