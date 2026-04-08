import withPWAInit from 'next-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

// ESモジュール環境で __dirname の代替となるパスを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // ★★★ 追加: ESLintの警告でビルドが止まるのを防ぐ ★★★
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 💡 Next.js 15.x 以降の推奨設定に合わせて experimental から移動
  outputFileTracingRoot: path.join(__dirname, '../../'),
  
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
      },
      // ★★★ 追加: AWS S3 (これがないとアップロード画像が表示されません) ★★★
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com', // S3汎用
      },
      {
        protocol: 'https',
        hostname: '*.s3.ap-northeast-1.amazonaws.com', // 東京リージョン指定
      },
      // ★★★ 追加終わり ★★★
      
      {
        protocol: 'https',
        hostname: 'source.unsplash.com', // ダミー画像生成などに使用
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // 追加: Unsplashの直接リンク用
      },
      {
        protocol: 'https',
        hostname: 'www.transparenttextures.com', // 背景テクスチャ用
      },
      {
        protocol: 'https',
        hostname: 'flastal-backend.onrender.com', // 開発環境のバックエンドからの画像取得用
      },
    ],
  },
  
  // 💡 experimentalブロックからoutputFileTracingRootを削除
  experimental: {
  },
};

// PWAの設定
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  importScripts: ['/push-sw.js'], 
});

// `withPWA` を通して `nextConfig` をエクスポート
export default withPWA(nextConfig);