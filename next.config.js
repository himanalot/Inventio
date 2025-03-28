/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Ensure static assets are copied to the standalone output
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  // Ensure static assets like CSS and images are properly served
  staticPageGenerationTimeout: 120,
  // Commenting out rewrites as we now want to use these pages with authentication
  // async rewrites() {
  //   return [
  //     // Redirect problematic pages to a simple placeholder
  //     {
  //       source: '/pdf/thumbnails',
  //       destination: '/',
  //     },
  //     {
  //       source: '/search',
  //       destination: '/',
  //     },
  //     {
  //       source: '/pdf/test',
  //       destination: '/',
  //     },
  //     {
  //       source: '/pdf/optimal',
  //       destination: '/',
  //     },
  //     {
  //       source: '/pdf/complete',
  //       destination: '/',
  //     },
  //   ];
  // },
  typescript: {
    ignoreBuildErrors: true, // This will ignore TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Also ignore ESLint errors during builds
  }
}

module.exports = nextConfig
