/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@akorfa/shared'],
  typescript: {
    ignoreBuildErrors: false,
  },
  productionBrowserSourceMaps: false,
  turbopack: {},
  allowedDevOrigins: ['*'],
};

module.exports = nextConfig;
