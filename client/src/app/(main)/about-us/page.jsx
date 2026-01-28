import { BASE_URL } from "@/config/Config";
import AboutUsClient from "./AboutUsClient";

const stripHtml = (value) =>
  typeof value === "string" ? value.replace(/<[^>]+>/g, "") : "";

const extractCmsData = (payload) => {
  if (payload?.data?.content) return payload.data.content;
  if (payload?.content) return payload.content;
  if (payload?.data) return payload.data;
  return null;
};

const getAboutUsData = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/cms/${encodeURIComponent("About Us")}`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return extractCmsData(payload);
  } catch (error) {
    console.error("Error fetching About Us data:", error);
    return null;
  }
};

export const generateMetadata = async () => {
  const cmsData = await getAboutUsData();
  const metaTitle = cmsData?.title || "About Us";
  const metaDescription =
    stripHtml(cmsData?.description).slice(0, 160) ||
    "Learn more about Everest Vacation, our mission, and our travel expertise.";
  const metaKeywords =
    cmsData?.meta_keywords ||
    "about Everest Vacation, Nepal travel experts, Bhutan tours, Tibet tours";

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
    },
  };
};

const AboutUsPage = async () => {
  const cmsData = await getAboutUsData();
  return <AboutUsClient initialData={cmsData} />;
};

export default AboutUsPage;
