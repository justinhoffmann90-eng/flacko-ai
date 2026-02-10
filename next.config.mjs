/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // yahoo-finance2 pulls in @gadicc/fetch-mock-cache which references
      // a file-system store module that doesn't exist in production builds.
      // This tells webpack to treat it as an empty module.
      config.resolve.alias = {
        ...config.resolve.alias,
        '@gadicc/fetch-mock-cache/stores/fs.ts': false,
        '@gadicc/fetch-mock-cache': false,
      };
    }
    return config;
  },
};

export default nextConfig;
