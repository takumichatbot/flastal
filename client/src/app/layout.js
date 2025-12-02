import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import PushNotificationManager from './components/PushNotificationManager';
import ThemeController from './components/ThemeController';
import FloatingMenu from './components/FloatingMenu';
// ★ 1. インポート
import LiveTicker from './components/LiveTicker';

export const metadata = {
  title: 'FLASTAL',
  description: 'フラスタ専門クラウドファンディング',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <ThemeController />
        
        <AuthProvider>
          <Header />
          
          {/* ★ 2. ヘッダーの直下に配置 */}
          <LiveTicker />

          <main>{children}</main>
          
          <FloatingMenu />
          <Footer />
          <Toaster position="top-center" reverseOrder={false} /> 
          <PushNotificationManager />
        </AuthProvider>
      </body>
    </html>
  );
}