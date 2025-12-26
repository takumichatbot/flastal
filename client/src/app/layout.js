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
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '700'],
});

export const metadata = {
  title: {
    template: '%s | FLASTAL',
    default: 'FLASTAL - 推しにフラスタを贈ろう',
  },
  description: 'フラスタ専門のクラウドファンディングプラットフォーム。',
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'https://flastal.com'),
  manifest: '/manifest.json',
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

export const viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`} style={{ margin: 0, padding: 0 }}>
      <body className="font-sans antialiased text-slate-900 bg-white min-h-screen flex flex-col m-0 p-0 border-none">
        <ThemeController />
        
        <AuthProvider>
          <Suspense fallback={null}>
            {/* 修正ポイント1: ヘッダーとティッカーを一つの sticky グループにする */}
            <div className="sticky top-0 z-[100] w-full m-0 p-0 border-none leading-[0] flex flex-col">
              <Header />
              <LiveTicker />
            </div>

            {/* 修正ポイント2: mainに強制的にマイナスマージンをかけ、上の要素に1px潜り込ませる */}
            <main className="flex-grow w-full m-0 p-0 relative z-10 -mt-[1px]">
              {children}
            </main>
            
            <FloatingMenu />
          </Suspense>
          
          <Footer />
          
          <Toaster 
            position="top-center" 
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '50px',
              },
            }} 
          /> 
          
          <PushNotificationManager />
        </AuthProvider>
      </body>
    </html>
  );
}