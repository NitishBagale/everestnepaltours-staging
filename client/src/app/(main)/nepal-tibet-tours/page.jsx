import PhotoGallery from "@/components/PhotoGallery";
import Popular from "@/components/Popular";
import React from "react";

export const metadata = {
  title: "Nepal & Tibet Tours | Everest Vacation",
  description:
    "Discover Nepal and Tibet tours featuring culture, mountains, and once-in-a-lifetime experiences.",
  keywords: "Nepal tours, Tibet tours, trekking, Everest Vacation",
};

const page = () => {
  return (
    <div>
      <Popular />
      <PhotoGallery />
    </div>
  );
};

export default page;
