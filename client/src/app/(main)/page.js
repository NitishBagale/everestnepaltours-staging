import Form from "@/components/Form";
import Hero from "@/components/Hero";
import Review from "@/components/Review";
import WelcomeSection from "@/components/WelcomeSection";
import WhyWithUsSection from "@/components/WhyWithUsSection";
import FeaturedPackagesSection from "@/components/FeaturedPackagesSection";
import React from "react";

export const metadata = {
  title: "Everest Vacation | Nepal, Bhutan & Tibet Tours",
  description:
    "Discover curated tours across Nepal, Bhutan, and Tibet with expert planning, authentic experiences, and trusted guides.",
  keywords:
    "Everest Vacation, Nepal tours, Bhutan tours, Tibet tours, trekking, cultural tours",
};

const page = () => {
  return (
    <div>
      <Hero />
      <WelcomeSection />
      <WhyWithUsSection />
      <FeaturedPackagesSection />
      <Review />
    </div>
  );
};

export default page;
