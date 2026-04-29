import Hero from "@/components/Hero";
import Review from "@/components/Review";
import WelcomeSection from "@/components/WelcomeSection";
import WhyWithUsSection from "@/components/WhyWithUsSection";
import FeaturedPackagesSection from "@/components/FeaturedPackagesSection";
import React from "react";
import { getHomePageData } from "@/lib/siteApi";

export const metadata = {
  title: "Everest Vacation | Nepal, Bhutan & Tibet Tours",
  description:
    "Discover curated tours across Nepal, Bhutan, and Tibet with expert planning, authentic experiences, and trusted guides.",
  keywords:
    "Everest Vacation, Nepal tours, Bhutan tours, Tibet tours, trekking, cultural tours",
};

const page = async () => {
  const homeData = await getHomePageData();

  return (
    <div>
      <Hero slides={homeData.heroImages} />
      <WelcomeSection welcome={homeData.welcome} />
      <WhyWithUsSection data={homeData.whyWithUs} />
      <FeaturedPackagesSection
        featured={homeData.featuredPackages}
        packages={homeData.packages}
        reviewCountMap={homeData.reviewCountMap}
      />
      <Review
        sectionTitle={homeData.reviewsSection?.title}
        selectedIds={homeData.reviewsSection?.reviewIds}
        reviews={homeData.reviews}
      />
    </div>
  );
};

export default page;
