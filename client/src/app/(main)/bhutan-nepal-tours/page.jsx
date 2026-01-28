import Faqs from "@/components/Faqs";
import PhotoGallery from "@/components/PhotoGallery";
import Popular from "@/components/Popular";
import Travelguide from "@/components/Travelguide";

import React from "react";

export const metadata = {
  title: "Bhutan & Nepal Tours | Everest Vacation",
  description:
    "Plan Bhutan and Nepal tours with cultural experiences, scenic landscapes, and expert guides.",
  keywords: "Bhutan tours, Nepal tours, Himalayan travel, Everest Vacation",
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
