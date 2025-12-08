/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.replit.dev', '*.worf.replit.dev', '*.repl.co', '*.kirk.replit.dev', '*.picard.replit.dev', '*.spock.replit.dev', '127.0.0.1', 'localhost'],
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
