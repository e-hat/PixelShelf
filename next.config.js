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
      'empvoqckqx.ufs.sh',
    ],
  },
  experimental: {
    serverActions: {},
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
};

module.exports = nextConfig;
