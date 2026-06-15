import { Inter, Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';
import Footer from './components/Footer';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import PushNotificationManager from './components/PushNotificationManager';
import ThemeController from './components/ThemeController';
import FloatingMenu from './components/FloatingMenu';
import { Suspense } from 'react';

// コンポーネントをインポート
import Header from './components/Header';
import LiveTicker from './components/LiveTicker';
import NativeTabBar from './components/NativeTabBar';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ec4899',
  viewportFit: 'cover',
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.flastal.com'),
  title: {
    template: '%s | FLASTAL',
    default: 'FLASTAL - 推しにフラスタを贈ろう',
  },
  description: 'ファン有志で贈る「フラスタ企画」を安全・簡単・感動的に。FLASTAL（フラスタル）は推し活をアップデートするクラウドファンディング・プラットフォームです。',
  keywords: ['フラスタ', 'フラワースタンド', '推し活', 'クラウドファンディング', 'VTuber', 'アイドル', '応援花'],
  openGraph: {
    title: 'FLASTAL - 推しにフラスタを贈ろう',
    description: 'ファン有志で贈る「フラスタ企画」を安全・簡単・感動的に。',
    url: '/',
    siteName: 'FLASTAL',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FLASTAL - 推しにフラスタを贈ろう',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLASTAL - 推しにフラスタを贈ろう',
    description: 'ファン有志で贈る「フラスタ企画」を安全・簡単・感動的に。',
    images: ['/opengraph-image.png'],
  },
  alternates: {
    canonical: '/',
  },

  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FLASTAL',
    startupImage: [
      { url: '/apple-icon.png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <head>
        {/* ネイティブアプリ判定: React 描画前にクラスを付与してフラッシュを防ぐ */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var isNative =
                window.location.pathname.startsWith('/app') ||
                sessionStorage.getItem('nativeApp') === '1' ||
                (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
              if (isNative) {
                document.documentElement.classList.add('native-app');
              }
            } catch(e) {}
            // Capacitor ネイティブ起動時: / からのリダイレクト
            if (window.location.pathname === '/') {
              var cap = window.Capacitor;
              if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
                try {
                  var raw = localStorage.getItem('authToken');
                  var token = raw ? raw.replace(/['"]+/g, '').trim() : '';
                  window.location.replace(token ? '/mypage' : '/login');
                } catch(e) { window.location.replace('/login'); }
              }
            }
          })();
        `}} />
      </head>
      <body className="font-sans antialiased text-slate-900 bg-white min-h-screen flex flex-col m-0 p-0 overflow-x-hidden">
        <ThemeController />
        <AuthProvider>
          <header className="web-only w-full flex flex-col m-0 p-0 border-none bg-white relative z-[100] isolate">
            <Header />
            <LiveTicker />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white translate-y-[0.5px] z-[101]" aria-hidden="true" />
          </header>

          <Suspense fallback={null}>
            <main className="flex-grow w-full m-0 p-0 relative">
              {children}
            </main>
            <div className="web-only"><FloatingMenu /></div>
          </Suspense>

          <div className="web-only"><Footer /></div>
          <Suspense fallback={null}><NativeTabBar /></Suspense>
          <Toaster position="top-center" />
          <PushNotificationManager />
        </AuthProvider>
      </body>
    </html>
  );
}