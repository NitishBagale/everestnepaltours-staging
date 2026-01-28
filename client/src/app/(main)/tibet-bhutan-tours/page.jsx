import Faqs from "@/components/Faqs";
import PhotoGallery from "@/components/PhotoGallery";
import Popular from "@/components/Popular";
import Travelguide from "@/components/Travelguide";

import React from "react";

export const metadata = {
  title: "Tibet & Bhutan Tours | Everest Vacation",
  description:
    "Explore Tibet and Bhutan tour packages with curated itineraries and cultural highlights.",
  keywords: "Tibet tours, Bhutan tours, Himalayan travel, Everest Vacation",
};

const page = () => {
  return (
    <div>
      <Popular />
      <PhotoGallery />
      <Travelguide />
      <Faqs />
    </div>
  );
};

export default page;
