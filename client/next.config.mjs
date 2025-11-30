import withPWAInit from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像を表示する外部ドメインの許可設定
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cloudinary
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',      // ダミー画像
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org', // 決済ロゴなど
      },
      {
        protocol: 'https',
        hostname: 'cdn.worldvectorlogo.com', // 決済ロゴなど
      }
    ],
  },
};

// PWAの設定
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // ★★★ 追加: カスタムSWをインポート ★★★
  importScripts: ['/push-sw.js'], 
});

export default withPWA(nextConfig);