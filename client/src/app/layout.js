import { Inter, Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import PushNotificationManager from './components/PushNotificationManager';
import ThemeController from './components/ThemeController';
import FloatingMenu from './components/FloatingMenu';
import LiveTicker from './components/LiveTicker';

// フォントの設定
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '700'],
});

// ★修正: themeColor を metadata から削除し、viewport へ移動
export const metadata = {
  title: {
    template: '%s | FLASTAL',
    default: 'FLASTAL - 推しにフラスタを贈ろう',
  },
  description: 'フラスタ専門のクラウドファンディングプラットフォーム。推しのライブやイベントに、ファンのみんなで最高のお花を贈りませんか？',
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'https://flastal.com'),
  manifest: '/manifest.json',
  // OGP設定
  openGraph: {
    title: 'FLASTAL - フラスタ専門クラウドファンディング',
    description: '推しにフラスタを贈ろう！',
    url: 'https://flastal.com',
    siteName: 'FLASTAL',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLASTAL',
    description: '推しにフラスタを贈ろう！',
  },
};

// ★追加: Next.js 15 では viewport 設定を独立させる必要があります
export const viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col">
        {/* テーマ制御 (ダークモード等) */}
        <ThemeController />
        
        <AuthProvider>
          {/* ヘッダー */}
          <Header />
          
          {/* ニュースティッカー (ヘッダー直下) */}
          <LiveTicker />

          {/* メインコンテンツ */}
          <main className="flex-grow w-full max-w-[1920px] mx-auto">
            {children}
          </main>
          
          {/* フローティングメニュー (スマホ用) */}
          <FloatingMenu />
          
          {/* フッター */}
          <Footer />
          
          {/* 通知トースト設定 */}
          <Toaster 
            position="top-center" 
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '50px',
                padding: '12px 24px',
                fontSize: '14px',
              },
              success: {
                style: { background: '#10B981' },
                iconTheme: { primary: '#fff', secondary: '#10B981' },
              },
              error: {
                style: { background: '#EF4444' },
                iconTheme: { primary: '#fff', secondary: '#EF4444' },
              },
            }} 
          /> 
          
          {/* PWA/Push通知マネージャー */}
          <PushNotificationManager />
        </AuthProvider>
      </body>
    </html>
  );
}