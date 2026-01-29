import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression for smaller responses
  compress: true,
  
  // Optimize package imports for faster builds and smaller bundles
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-switch",
      "@radix-ui/react-label",
    ],
  },
  
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  
  // Strict mode for better React practices
  reactStrictMode: true,
  
  // Image optimization settings
  images: {
    formats: ["image/avif", "image/webp"],
  },
  
  // Headers for caching static assets
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:all*(js|css)",
        headers: [
          {
            key: "Cache-Control", 
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
