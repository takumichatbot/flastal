import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import './globals.css';
import { Toaster } from 'react-hot-toast'; // ★ 1. Toasterコンポーネントをインポートします
import PushNotificationManager from './components/PushNotificationManager'; // 追加

export const metadata = {
  title: 'FLASTAL',
  description: 'フラスタ専門クラウドファンディング',
  manifest: '/manifest.json', // ★ これを追加
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          {/* ★ 2. ここにToasterコンポーネントを設置します */}
          <Toaster position="top-center" reverseOrder={false} /> 
          <PushNotificationManager /> {/* ★ ここに追加 */}
        </AuthProvider>
      </body>
    </html>
  );
}