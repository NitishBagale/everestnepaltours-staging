import { seoSite } from "@/lib/seo";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/admin/dashboard"],
      },
    ],
    sitemap: `${seoSite.url}/sitemap.xml`,
    host: seoSite.url,
  };
}
