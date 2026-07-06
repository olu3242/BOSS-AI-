/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Expose Supabase public vars to the browser bundle. The anon key is
  // safe for client-side use — it is rate-limited and scoped by RLS.
  // NEXT_PUBLIC_ vars take precedence if set; otherwise fall back to the
  // server-side names so deployments need only one set of secrets.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "",
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
