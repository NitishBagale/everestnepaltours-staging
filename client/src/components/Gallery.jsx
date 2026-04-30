"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  getMediaAlt,
  getMediaObject,
  getMediaSrcSet,
  getMediaUrl,
  getMediaUniqueKey,
} from "@/lib/media";

const Gallery = ({
  galleryImages = [],
  title = "Photo Gallery",
  embedded = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(null);

  const images = useMemo(() => {
    return (galleryImages || [])
      .map((item, index) => {
        const media = getMediaObject(item);
        const src = getMediaUrl(media, "medium");
        if (!src) return null;
        return {
          key: getMediaUniqueKey(media) || `${src}-${index}`,
          media,
          src,
          alt: getMediaAlt(media, `Gallery image ${index + 1}`),
        };
      })
      .filter(Boolean);
  }, [galleryImages]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (currentIndex === null) return;
      if (event.key === "Escape") setCurrentIndex(null);
      if (event.key === "ArrowRight") {
        setCurrentIndex((prev) =>
          prev === null ? 0 : (prev + 1) % images.length
        );
      }
      if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) =>
          prev === null ? 0 : (prev - 1 + images.length) % images.length
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length]);

  if (!images.length) return null;

  return (
    <>
      {embedded ? (
        <>
          {title && (
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              {title}
            </h3>
          )}
          <div className="mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {images.map((image, index) => (
                <button
                  key={image.key}
                  type="button"
                  className="relative w-[150px] h-[150px] overflow-hidden rounded-lg shadow-sm"
                  onClick={() => setCurrentIndex(index)}
                >
                  <img
                    src={image.src}
                    srcSet={getMediaSrcSet(image.media)}
                    sizes="(max-width: 768px) 25vw, (max-width: 1200px) 12.5vw, 10vw"
                    alt={image.alt}
                    className="w-full h-full object-contain hover:scale-105 transition duration-300 cursor-pointer"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <section className="bg-[#35a576] py-8 sm:py-12 md:py-16">
          <div className="font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
              {title}
            </h2>
          </div>

          <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6 lg:gap-8">
              {images.map((image, index) => (
                <button
                  key={image.key}
                  type="button"
                  className="aspect-square overflow-hidden rounded-md shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300"
                  onClick={() => setCurrentIndex(index)}
                >
                  <img
                    src={image.src}
                    srcSet={getMediaSrcSet(image.media)}
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16.66vw, (max-width: 1280px) 12.5vw, 11.11vw"
                    alt={image.alt}
                    className="object-contain w-full h-full"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {currentIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setCurrentIndex(null)}
        >
          <button
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white text-3xl sm:text-4xl z-50 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            onClick={() => setCurrentIndex(null)}
            aria-label="Close"
          >
            &times;
          </button>

          <button
            className="absolute left-2 sm:left-4 md:left-10 text-white text-3xl sm:text-4xl z-50 p-2 sm:p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all"
            onClick={(event) => {
              event.stopPropagation();
              setCurrentIndex((prev) =>
                prev === null ? 0 : (prev - 1 + images.length) % images.length
              );
            }}
            aria-label="Previous"
          >
            &#8249;
          </button>

          <div
            className="relative w-full max-w-[90vw] max-h-[80vh] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={getMediaUrl(images[currentIndex].media, "large")}
              srcSet={getMediaSrcSet(images[currentIndex].media)}
              alt={images[currentIndex].alt}
              className="object-contain w-full h-full max-h-[80vh]"
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 1200px"
            />
          </div>

          <button
            className="absolute right-2 sm:right-4 md:right-10 text-white text-3xl sm:text-4xl z-50 p-2 sm:p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all"
            onClick={(event) => {
              event.stopPropagation();
              setCurrentIndex((prev) =>
                prev === null ? 0 : (prev + 1) % images.length
              );
            }}
            aria-label="Next"
          >
            &#8250;
          </button>
        </div>
      )}
    </>
  );
};

export default Gallery;
