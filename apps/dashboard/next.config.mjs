/** @type {import('next').NextConfig} */
const nextConfig = {
  // @leah/shared ships raw TypeScript from its src/, so let Next transpile it.
  transpilePackages: ["@leah/shared"],
  reactStrictMode: true,
  webpack(config) {
    // The shared package uses explicit ".js" specifiers (required for Node ESM),
    // but the files on disk are ".ts". Teach webpack to resolve ".js" → ".ts".
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ...config.resolve.extensionAlias,
    };
    return config;
  },
};

export default nextConfig;
