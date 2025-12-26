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
      <body className="font-sans antialiased text-slate-900 bg-white min-h-screen flex flex-col m-0 p-0 overflow-x-hidden">
        <ThemeController />
        <AuthProvider>
          {/* 修正ポイント: sticky と absolute 的な挙動を排除し、通常のブロック配置にする */}
          <div className="w-full bg-white flex flex-col">
            <Header />
            <LiveTicker />
          </div>
          
          <Suspense fallback={null}>
            {/* main の relative や不要な padding をリセット */}
            <main className="flex-grow w-full m-0 p-0">
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