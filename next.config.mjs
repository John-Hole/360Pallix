/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  experimental: {
    agentUpgrade: "security",
  },
  async redirects() {
    return [
      {
        source: "/tutorial",
        destination: "/guide",
        permanent: true,
      },
      {
        source: "/best-seller",
        destination: "/sellers",
        permanent: true,
      },
      {
        source: "/bestseller",
        destination: "/sellers",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
