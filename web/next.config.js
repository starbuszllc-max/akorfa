/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.replit.dev', '*.worf.replit.dev', '*.repl.co', '*.kirk.replit.dev', '*.picard.replit.dev', '*.spock.replit.dev', '*.janeway.replit.dev', '127.0.0.1', 'localhost'],
  transpilePackages: ['@akorfa/shared'],
  typescript: {
    tsc: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

module.exports = nextConfig;
