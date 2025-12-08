import withPWAInit from 'next-pwa';
import path from 'path'; // pathモジュールをインポートに追加

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
  
  // 💡 モノレポ環境で依存関係のトレース問題を解決するための設定
  // ログの警告: "To silence this warning, set `outputFileTracingRoot`..." に対応します。
  // ここでの仮定: Next.jsのプロジェクトディレクトリ（client）から見て、
  // プロジェクトのルート（モノレポのルート）が2階層上にある (../../)
  experimental: {
    // 依存関係をトレースするルートディレクトリを明示的に指定
    outputFileTracingRoot: path.join(__dirname, '../../'),
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

// `withPWA` を通して `nextConfig` をエクスポート
export default withPWA(nextConfig);