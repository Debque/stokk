import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nzlkccdzhzwjuuvckulb.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
};

export default nextConfig;