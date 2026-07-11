import CustomizeTripClient from "./CustomizeTripClient";
import { buildSeoMetadata, seoSite } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "Customize Trip | Everest Vacation",
  description:
    "Plan a tailor-made holiday with Everest Vacation. Share your travel style, dates, destinations, budget, and booking preferences.",
  keywords:
    "customize trip, book custom tour, tailor made Nepal trip, Everest Vacation custom itinerary",
  path: "/customize-trip",
  image: `${seoSite.url}/lhasa.jpg`,
});

const CustomizeTripPage = () => {
  return <CustomizeTripClient />;
};

export default CustomizeTripPage;
