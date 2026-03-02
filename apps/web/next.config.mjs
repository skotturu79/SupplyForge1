/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@supplyforge/types', '@supplyforge/validators', '@supplyforge/crypto'],
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    // Use 'fallback' so Next.js App Router route handlers (including dynamic
    // segments like [id]/[action]) take precedence over the proxy rewrite.
    // The proxy only fires when no matching route file is found.
    return {
      fallback: [
        {
          source: '/api/v1/:path*',
          destination: `${process.env.API_URL || 'http://localhost:3001'}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
