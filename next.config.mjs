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
      // yahoo-finance2 v2.13 pulls @gadicc/fetch-mock-cache which has a
      // fs.ts store that webpack can't resolve. Mark as external to skip bundling.
      config.externals = config.externals || [];
      config.externals.push({
        '@gadicc/fetch-mock-cache/stores/fs.ts': 'commonjs @gadicc/fetch-mock-cache/stores/fs.ts',
        '@gadicc/fetch-mock-cache': 'commonjs @gadicc/fetch-mock-cache',
      });
    }
    return config;
  },
};

export default nextConfig;
