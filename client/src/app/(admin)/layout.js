import { Geist_Mono, Poppins } from "next/font/google";
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

export const metadata = {
  title: "Everest Vacation Admin",
  description: "Everest Vacation Admin Panel",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${geistMono.variable} antialiased`}
        style={{
          "--admin-primary": "#3ba883",
          "--admin-primary-strong": "#2f8c6e",
          "--admin-primary-soft": "#e7f6f1",
          "--admin-primary-soft-strong": "#d8efe7",
          "--admin-primary-ring": "#3ba883",
          "--admin-primary-border": "#3ba883",
          "--admin-primary-shadow": "0 10px 15px -3px rgba(59,168,131,0.25)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
