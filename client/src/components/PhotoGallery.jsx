"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getMediaAlt,
  getMediaObject,
  getMediaSrcSet,
  getMediaUrl,
  getMediaUniqueKey,
} from "@/lib/media";

const PhotoGallery = ({ categoryId = null, categoryName = null }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/cms/`);
        const pages = response.data.data || [];

        // Filter by category if provided
        let filteredPages = pages.filter((page) => page.status === true);

        if (categoryId) {
          filteredPages = filteredPages.filter(
            (page) => String(page.categoryId) === String(categoryId)
          );
        }

        // Extract gallery images from the dedicated galleryImages field
        const extractedImages = [];
        filteredPages.forEach((page) => {
          const content = page.content || {};
          const galleryImages = content.galleryImages || [];

          // Add gallery images if they exist
          if (galleryImages.length > 0) {
            extractedImages.push(...galleryImages);
          }
        });

        setImages(extractedImages.length > 0 ? extractedImages : []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch images:", err);
        setError("Failed to load gallery images");
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [categoryId]);

  // Lightbox navigation functions
  const openLightbox = (index) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const goToPrevious = () => {
    if (selectedImage === null) return;
    const prevIndex =
      selectedImage > 0 ? selectedImage - 1 : displayImages.length - 1;
    setSelectedImage(prevIndex);
  };

  const goToNext = () => {
    if (selectedImage === null) return;
    const nextIndex =
      selectedImage < displayImages.length - 1 ? selectedImage + 1 : 0;
    setSelectedImage(nextIndex);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImage === null) return;

      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  // Fallback placeholder images if no images found
  const placeholderImages = Array.from(
    { length: 24 },
    (_, i) => `https://picsum.photos/seed/${i + 10}/300/300`
  );

  const displayImages = useMemo(() => {
    const sourceImages = images.length > 0 ? images : placeholderImages;
    return sourceImages
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
  }, [images, placeholderImages]);

  if (loading) {
    return (
      <div className="bg-[#68a145] w-full font-sans">
        <div className="max-w-7xl mx-auto p-6 sm:p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-white text-lg">Loading gallery...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#68a145] w-full font-sans">
      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
          {categoryName
            ? `${categoryName} Photo Gallery`
            : "Photo Gallery with varieties"}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {displayImages.length === 0 ? (
          <div className="text-white text-center py-10">
            No images available for this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {displayImages.map((image, index) => (
              <div
                key={image.key}
                className="aspect-square relative group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={image.src}
                  srcSet={getMediaSrcSet(image.media)}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12.5vw"
                  alt={image.alt}
                  className="w-full h-full object-contain rounded-md transition-transform duration-300 ease-in-out group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-full p-4 flex items-center">
            {/* Previous Button */}
            <button
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Image */}
            <img
              src={getMediaUrl(displayImages[selectedImage]?.media, "large")}
              srcSet={getMediaSrcSet(displayImages[selectedImage]?.media)}
              alt={displayImages[selectedImage]?.alt || "Gallery image"}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next Button */}
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors"
              onClick={closeLightbox}
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {selectedImage + 1} / {displayImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
