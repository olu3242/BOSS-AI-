/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/landing.html",
        permanent: false,
      },
    ];
  },
  transpilePackages: [
    "@boss/api",
    "@boss/db",
    "@boss/industry-pack-general-smb",
    "@boss/mcp",
    "@boss/registries",
    "@boss/shared",
    "@boss/types",
    "@boss/ui",
  ],
  webpack(config) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
