/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      // Production (Render backend)
      {
        protocol: 'https',
        hostname: 'medivault-backend.onrender.com',
      },
    ],
  },
  async rewrites() {
    // Only proxy in local dev; in production NEXT_PUBLIC_API_URL points directly to Render
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/backend/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
