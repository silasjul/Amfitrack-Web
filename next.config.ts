import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/configuration-tooltips",
        destination:
          "https://guide.amfitrack.com/_sources/parameter/parameter_sensor.rst.txt",
      },
    ];
  },
};

export default nextConfig;
