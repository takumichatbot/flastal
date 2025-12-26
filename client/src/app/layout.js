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
          {/* 修正ポイント：isolate を追加し、背景色 bg-white を適用。1pxの白い目隠しで微細な隙間も完全遮断 */}
          <div className="w-full flex flex-col m-0 p-0 border-none bg-white relative z-[100] isolate">
            <Header />
            <LiveTicker />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white translate-y-[0.5px] z-[101]" />
          </div>
          
          <Suspense fallback={null}>
            {/* main 自体の余白を完全にゼロにし、子要素（HomePageContent）を直後に接続 */}
            <main className="flex-grow w-full m-0 p-0 relative z-0">
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