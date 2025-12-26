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
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-white min-h-screen flex flex-col m-0 p-0">
        <ThemeController />
        <AuthProvider>
          <Suspense fallback={null}>
            {/* 【隙間対策の決定打】
              HeaderとTickerをラップし、Tickerの下地の色(bg-slate-900)を背景に敷きます。
              これで、ブラウザの計算で1pxの隙間が出ても「黒い線」となり、違和感が消えます。
            */}
            <div className="sticky top-0 z-[100] bg-slate-900">
              <Header />
              <LiveTicker />
            </div>

            <main className="flex-grow w-full relative z-10">
              {children}
            </main>
            
            <FloatingMenu />
          </Suspense>
          <Footer />
          <Toaster position="top-center" /> 
          <PushNotificationManager />
        </AuthProvider>
      </body>
    </html>
  );
}