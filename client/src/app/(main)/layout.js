import { Geist_Mono, MuseoModerno, Poppins } from "next/font/google";
import "../../app/globals.css";
import Navbar from "@/layout/Navbar";
import Footer from "@/layout/Footer";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const museoModerno = MuseoModerno({
  variable: "--font-museo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "Everest Vacation ",
  description: "Everest Vacation ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${geistMono.variable} ${museoModerno.variable} antialiased`}
      >
        <Navbar />
        <main className="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
