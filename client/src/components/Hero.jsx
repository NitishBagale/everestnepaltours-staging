"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  getMediaAlt,
  getMediaObject,
  getMediaUrl,
  getOptimizedCloudinaryUrl,
} from "@/lib/media";

const HERO_IMAGE_WIDTHS = [360, 480, 640, 768, 960, 1200];

const getHeroImageSources = (image) => {
  const media = getMediaObject(image);
  const originalUrl = getMediaUrl(media, "large") || getMediaUrl(media, "medium") || image?.url || "";
  const fallbackUrl = originalUrl || "/bhutan.jpg";

  if (!originalUrl) {
    return {
      src: fallbackUrl,
      srcSet: "",
    };
  }

  if (!fallbackUrl.includes("res.cloudinary.com")) {
    return {
      src: fallbackUrl,
      srcSet: "",
    };
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const images = Array.isArray(slides) ? slides : [];

  // Auto slide every 3 seconds
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
    if (touchEndX.current - touchStartX.current > 50) {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const activeImage = images[currentIndex];
  const activeMedia = getMediaObject(activeImage);
  const activeAlt = getMediaAlt(
    activeMedia,
    activeImage?.title || activeImage?.alt || "Hero image"
  );
  const { src, srcSet } = getHeroImageSources(activeImage || {});

  return (
    <div
      className="font-sans relative w-full h-[68vh] min-h-[420px] sm:h-[80vh] sm:min-h-[550px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {activeImage && (
        <div
          key={activeImage.id || activeImage.url || `hero-slide-${currentIndex}`}
          className="absolute top-0 left-0 w-full h-full transition-opacity duration-700 opacity-100"
        >
          <img
            src={src}
            srcSet={srcSet || undefined}
            sizes="100vw"
            alt={activeAlt}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />

          {(activeImage.title || activeImage.caption) && (
            <div className="absolute inset-x-0 top-16 sm:top-20 md:top-24 text-white">
              <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 max-w-[75%]">
              {activeImage.title && (
                <h2 className="font-bold">
                  {activeImage.title.split(",").map((part, i) => (
                    <span
                      key={i}
                      className="block text-[62px] sm:text-[88px] lg:text-[121px] text-white font-bold leading-[1] pb-[18px] sm:pb-[24px] lg:pb-[30px]"
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
                <p className="mt-4 text-base sm:text-lg md:text-xl lg:text-2xl font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
                  {activeImage.caption}
                </p>
              )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vertical circle indicators on right side */}
      <div className="absolute right-2 sm:right-4 md:right-5 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 sm:gap-3 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className="flex h-11 w-11 items-center justify-center -my-3"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to hero slide ${idx + 1}`}
          >
            <span
              className={`block w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                currentIndex === idx ? "bg-white scale-125" : "bg-gray-400"
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Hero;
