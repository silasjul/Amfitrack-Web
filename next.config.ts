import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/configuration-tooltips/:file",
        destination:
          "https://guide.amfitrack.com/_sources/parameter/parameter_:file.rst.txt",
      },
    ];
  },
};

export default nextConfig;
