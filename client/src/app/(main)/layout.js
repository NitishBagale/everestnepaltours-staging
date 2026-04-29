import { MuseoModerno, Poppins } from "next/font/google";
import "../../app/globals.css";
import Navbar from "@/layout/Navbar";
import Footer from "@/layout/Footer";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const museoModerno = MuseoModerno({
  variable: "--font-museo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  metadataBase: new URL("https://www.everestvacations.com"),
  title: "Everest Vacation",
  description: "Tailor-made Nepal, Bhutan, and Tibet journeys with local expertise and trusted support.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        id="top"
        className={`${poppins.variable} ${museoModerno.variable} antialiased`}
      >
        <Navbar />
        <main className="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
