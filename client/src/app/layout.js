import { Inter, Noto_Sans_JP, Zen_Kaku_Gothic_New, Plus_Jakarta_Sans, Parisienne } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { GrowthBookProvider } from './contexts/GrowthBookContext';
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
import OfflineBanner from './components/OfflineBanner';
import { WebVitals } from './components/WebVitals';

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

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  variable: '--font-zen-kaku',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const parisienne = Parisienne({
  subsets: ['latin'],
  variable: '--font-parisienne',
  weight: ['400'],
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
  metadataBase: new URL('https://www.flastal.com'),
  title: {
    default: 'FLASTAL（フラスタル）- アイドル・VTuberへのフラワースタンドをみんなで',
    template: '%s | FLASTAL',
  },
  description: 'フラワースタンド（フラスタ）を推しのアイドル・VTuberへ贈るクラウドファンディングプラットフォーム。みんなで集めて、想いを花に込めよう。',
  keywords: ['フラスタ', 'フラワースタンド', 'クラウドファンディング', 'アイドル', 'VTuber', 'フラスタル', 'FLASTAL'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://www.flastal.com',
    siteName: 'FLASTAL',
    title: 'FLASTAL - アイドル・VTuberへのフラワースタンドをみんなで',
    description: 'フラワースタンドを推しへ贈るクラウドファンディング',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'FLASTAL' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@flastal_jp',
    title: 'FLASTAL - フラワースタンドをみんなで',
    description: 'フラワースタンドを推しへ贈るクラウドファンディング',
    images: ['/og-default.png'],
  },
  robots: { index: true, follow: true },
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
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable} ${zenKaku.variable} ${plusJakarta.variable} ${parisienne.variable}`}>
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
      <body className="font-[family-name:var(--font-zen-kaku)] antialiased text-slate-900 bg-white min-h-screen flex flex-col m-0 p-0 overflow-x-hidden">
        <WebVitals />
        <ThemeController />
        <GrowthBookProvider>
        <DarkModeProvider>
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
          <Suspense fallback={null}><OfflineBanner /></Suspense>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                fontFamily: 'var(--font-zen-kaku), sans-serif',
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px 16px',
                maxWidth: '360px',
              },
              success: {
                style: {
                  background: '#fff1f7',
                  color: '#9d174d',
                  border: '1px solid #fbcfe8',
                },
                iconTheme: {
                  primary: '#ec4899',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#fff1f2',
                  color: '#9f1239',
                  border: '1px solid #fecdd3',
                },
                iconTheme: {
                  primary: '#f43f5e',
                  secondary: '#fff',
                },
              },
              loading: {
                style: {
                  background: '#fdf4ff',
                  color: '#6b21a8',
                  border: '1px solid #e9d5ff',
                },
              },
            }}
          />
          <PushNotificationManager />
        </AuthProvider>
        </DarkModeProvider>
        </GrowthBookProvider>
      </body>
    </html>
  );
}