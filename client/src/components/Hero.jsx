"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  getMediaAlt,
  getMediaObject,
  getMediaUrl,
  getOptimizedCloudinaryUrl,
} from "@/lib/media";

const HERO_IMAGE_WIDTHS = [640, 960, 1280, 1600, 1920];

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
      width: 1600,
      quality: "auto:good",
    }),
    srcSet: HERO_IMAGE_WIDTHS.map((width) =>
      `${getOptimizedCloudinaryUrl(fallbackUrl, {
        width,
        quality: "auto:good",
      })} ${width}w`
    ).join(", "),
  };
};

const Hero = ({ slides = [] }) => {
  const [images, setImages] = useState(slides);

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    setImages(Array.isArray(slides) ? slides : []);
  }, [slides]);

  // Auto slide every 3 seconds
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
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

  return (
    <div
      className="font-sans relative w-full h-[80vh] min-h-[550px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {images.map((image, index) => (
        <div
          key={image.id || image.url || `hero-slide-${index}`}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          {(() => {
            const { src, srcSet } = getHeroImageSources(image);
            const alt = getMediaAlt(
              getMediaObject(image),
              image.title || image.alt || "Hero image"
            );

            return (
          <img
            src={src}
            srcSet={srcSet || undefined}
            sizes="100vw"
            alt={alt}
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding={index === 0 ? "sync" : "async"}
          />
            );
          })()}

          {(image.title || image.caption) && (
            <div className="absolute inset-x-0 top-16 sm:top-20 md:top-24 text-white">
              <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 max-w-[75%]">
              {image.title && (
                <h2 className="font-bold">
                  {image.title.split(",").map((part, i) => (
                    <span
                      key={i}
                      className="block text-[121px] text-white font-bold leading-[1] pb-[30px]"
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
              {image.caption && (
                <p className="mt-4 text-base sm:text-lg md:text-xl lg:text-2xl font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
                  {image.caption}
                </p>
              )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Vertical circle indicators on right side */}
      <div className="absolute right-2 sm:right-4 md:right-5 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 sm:gap-3 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full cursor-pointer transition-all duration-300 ${
              currentIndex === idx ? "bg-white scale-125" : "bg-gray-400"
            }`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to hero slide ${idx + 1}`}
            aria-pressed={currentIndex === idx}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;
