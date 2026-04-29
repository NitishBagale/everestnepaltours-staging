import React from "react";
import {
  getMediaAlt,
  getMediaObject,
  getMediaUrl,
  getOptimizedCloudinaryUrl,
} from "@/lib/media";

const HERO_IMAGE_WIDTHS = [360, 480, 640, 768, 960, 1200];

const getHeroImageSources = (image) => {
  const media = getMediaObject(image);
  const originalUrl =
    getMediaUrl(media, "large") || getMediaUrl(media, "medium") || image?.url || "";
  const fallbackUrl = originalUrl || "/bhutan.jpg";

  if (!originalUrl || !fallbackUrl.includes("res.cloudinary.com")) {
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

const HeroSlide = ({ image, index }) => {
  const media = getMediaObject(image);
  const alt = getMediaAlt(
    media,
    image?.title || image?.alt || "Hero image"
  );
  const { src, srcSet } = getHeroImageSources(image || {});
  const isFirst = index === 0;

  return (
    <article
      id={`hero-slide-${index + 1}`}
      className="relative h-[68vh] min-h-[420px] w-full shrink-0 snap-center overflow-hidden sm:h-[80vh] sm:min-h-[550px]"
    >
      <img
        src={src}
        srcSet={srcSet || undefined}
        sizes="100vw"
        alt={alt}
        className="h-full w-full object-cover"
        loading={isFirst ? "eager" : "lazy"}
        fetchPriority={isFirst ? "high" : "auto"}
        decoding={isFirst ? "sync" : "async"}
      />

      {(image?.title || image?.caption) && (
        <div className="absolute inset-x-0 top-16 text-white sm:top-20 md:top-24">
          <div className="mx-auto max-w-screen-2xl px-6 sm:px-8 lg:px-12">
            <div className="max-w-[75%]">
              {image?.title && (
                <h2 className="font-bold">
                  {image.title.split(",").map((part, titleIndex) => (
                    <span
                      key={`${image.id || image.url || index}-${titleIndex}`}
                      className="block pb-[18px] text-[62px] font-bold leading-[1] text-white sm:pb-[24px] sm:text-[88px] lg:pb-[30px] lg:text-[121px]"
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
              {image?.caption && (
                <p className="mt-4 text-base font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] sm:text-lg md:text-xl lg:text-2xl">
                  {image.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

const Hero = ({ slides = [] }) => {
  const images = Array.isArray(slides) ? slides.filter(Boolean) : [];

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="relative font-sans">
      <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((image, index) => (
          <HeroSlide
            key={image.id || image.url || `hero-slide-${index}`}
            image={image}
            index={index}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 sm:right-4 sm:gap-3 md:right-5">
          {images.map((_, index) => (
            <a
              key={`hero-indicator-${index}`}
              href={`#hero-slide-${index + 1}`}
              className="flex h-11 w-11 items-center justify-center -my-3"
              aria-label={`Go to hero slide ${index + 1}`}
            >
              <span
                className={`block rounded-full ${
                  index === 0 ? "h-4 w-4 bg-white" : "h-3 w-3 bg-gray-300 sm:h-4 sm:w-4"
                }`}
                aria-hidden="true"
              />
            </a>
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
