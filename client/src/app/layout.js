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
    url: 'https://www.flastal.com',
    siteName: 'FLASTAL',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLASTAL - 推しにフラスタを贈ろう',
    description: 'ファン有志で贈る「フラスタ企画」を安全・簡単・感動的に。',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-white min-h-screen flex flex-col m-0 p-0 overflow-x-hidden">
        <ThemeController />
        <AuthProvider>
          {/* 修正ポイント：isolate を追加し、背景色 bg-white を適用。1pxの白い目隠しで微細な隙間も完全遮断 */}
          <header className="w-full flex flex-col m-0 p-0 border-none bg-white relative z-[100] isolate">
            <Header />
            <LiveTicker />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white translate-y-[0.5px] z-[101]" aria-hidden="true" />
          </header>
          
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