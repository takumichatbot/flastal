import { Inter, Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from './contexts/AuthProvider'; // パスがAuthProviderの場合は修正してください
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

export const viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-white min-h-screen flex flex-col m-0 p-0">
        <ThemeController />
        <AuthProvider>
          <Suspense fallback={null}>
            {/* 修正：HeaderとTickerを独立させ、変なラップを解除 */}
            <Header />
            <LiveTicker />
            <main className="flex-grow w-full">
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