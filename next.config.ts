import type { NextConfig } from "next";

// Support subpath deployment (e.g. https://lens4web.com/projects/grok-cartoon-builder/)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH !== undefined
  ? process.env.NEXT_PUBLIC_BASE_PATH
  : '/projects/grok-cartoon-builder';

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  // Allow processing larger video uploads/payloads in API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
