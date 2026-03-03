import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  // basePath only in production (GitHub Pages hosting at /TeachBertPERT/)
  basePath: isProd ? "/TeachBertPERT" : "",
  images: { unoptimized: true },
};

export default nextConfig;
