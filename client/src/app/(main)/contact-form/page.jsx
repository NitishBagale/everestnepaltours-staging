import ContactFormClient from "./ContactFormClient";
import { getMediaObject, getMediaUrl } from "@/lib/media";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const DEFAULT_TITLE = "Contact Us | Everest Vacation";
const DEFAULT_DESCRIPTION =
  "Get in touch with Everest Vacation for tour inquiries, custom itineraries, and travel support.";
const DEFAULT_KEYWORDS =
  "contact Everest Vacation, travel inquiry, Nepal tour support, Bhutan travel help";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1920&auto=format&fit=crop";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fetchContactCms = async () => {
  try {
    const res = await fetch(`${BASE_URL}/cms/`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const list = json?.data || [];
    return list.find((item) => item.slug === "contact-form") || null;
  } catch {
    return null;
  }
};

export const generateMetadata = async () => {
  const cms = await fetchContactCms();
  const cmsTitle = cms?.meta_title || DEFAULT_TITLE;
  const cmsDescription = cms?.meta_description || DEFAULT_DESCRIPTION;
  const cmsKeywords = cms?.meta_keywords || DEFAULT_KEYWORDS;
  const bannerMedia =
    cms?.content?.pageBannerImage || cms?.content?.coverImage;
  const bannerImage =
    getMediaUrl(getMediaObject(bannerMedia), "large") || DEFAULT_IMAGE;

  return {
    title: cmsTitle,
    description: cmsDescription,
    keywords: cmsKeywords,
    openGraph: {
      title: cmsTitle,
      description: cmsDescription,
      type: "website",
      images: bannerImage ? [{ url: bannerImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: cmsTitle,
      description: cmsDescription,
      images: bannerImage ? [bannerImage] : undefined,
    },
  };
};

const ContactPage = async () => {
  return <ContactFormClient />;
};

export default ContactPage;
