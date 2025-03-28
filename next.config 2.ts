/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // This will ignore TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Also ignore ESLint errors during builds
  }
}

module.exports = nextConfig
