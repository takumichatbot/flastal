import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import './globals.css';
import { Toaster } from 'react-hot-toast'; // ★ 1. Toasterコンポーネントをインポートします

export const metadata = {
  title: 'FLASTAL',
  description: 'オールインワン・フラスタ支援プラットフォーム',
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
        </AuthProvider>
      </body>
    </html>
  );
}