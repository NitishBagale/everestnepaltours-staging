import { MuseoModerno } from "next/font/google";
import "../../app/globals.css";
import Navbar from "@/layout/Navbar";
import Footer from "@/layout/Footer";
import { buildSeoMetadata, seoSite } from "@/lib/seo";

const museoModerno = MuseoModerno({
  variable: "--font-museo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  metadataBase: new URL(seoSite.url),
  applicationName: seoSite.name,
  ...buildSeoMetadata({
    title: seoSite.name,
    description: seoSite.defaultDescription,
    path: "/",
    image: seoSite.defaultOgImage,
  }),
  title: {
    default: seoSite.name,
    template: `%s | ${seoSite.name}`,
  },
  category: "travel",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: seoSite.name,
    url: seoSite.url,
    logo: seoSite.defaultOgImage,
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seoSite.name,
    url: seoSite.url,
  };

  return (
    <html lang="en">
      <body
        id="top"
        className={`${museoModerno.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Navbar />
        <main className="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
