/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'uploadthing.com',
      'utfs.io',
      'lh3.googleusercontent.com',
      'github.com',
      'images.unsplash.com',
      'loremflickr.com',
      'picsum.photos',
      'cdn.jsdelivr.net',
      'avatars.githubusercontent.com',
    ],
  },
  experimental: {
    serverActions: {},
  },
};

module.exports = nextConfig;
