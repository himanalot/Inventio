/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Make sure we copy all static assets
  distDir: '.next',
  // Handle CSS properly
  optimizeCss: true,
  // Output configuration for standalone
  output: {
    standalone: true,
    // Copy all static files
    export: {
      trailingSlash: true
    }
  },
  // Add more tracing to ensure all files are included
  experimental: {
    outputFileTracingRoot: process.cwd(),
    outputFileTracingIncludes: {
      '/**': ['./public/**/*']
    },
    // Enable verbose tracing to debug static file inclusion
    outputFileTracingVerbose: true
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
