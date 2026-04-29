const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiPattern = (() => {
  if (!apiUrl) return null;

  try {
    const parsed = new URL(apiUrl);
    return {
      protocol: parsed.protocol.replace(":", ""),
      hostname: parsed.hostname,
      port: parsed.port || undefined,
    };
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: [
      ...(apiPattern ? [apiPattern] : []),
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "everestnepaltours.com",
      },
      {
        protocol: "https",
        hostname: "www.everestnepaltours.com",
      },
      {
        protocol: "https",
        hostname: "imgs.search.brave.com",
      },
    ],
  },
};

export default nextConfig;
