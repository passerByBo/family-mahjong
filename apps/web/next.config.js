/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@family-mahjong/shared'],
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
