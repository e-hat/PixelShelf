/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'uploadthing.com',
      'utfs.io',
      'lh3.googleusercontent.com',
      'github.com',
      'images.unsplash.com'
    ],
  },
  experimental: {
    serverActions: {},
  },
};

module.exports = nextConfig;
