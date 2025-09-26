import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './contexts/AuthContext';
import Header from "./components/Header";
import Footer from "./components/Footer";

// ★★★ ここが修正箇所です ★★★
// Noto Sans JPフォントを読み込む設定
const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"], // 日本語フォントでも 'latin' の指定で問題なく動作します
  weight: ["400", "700"], // 通常(400)と太字(700)のフォントを読み込みます
});

export const metadata = {
  title: 'FLASTAL',
  description: 'フラスタのクラウドファンディングプラットフォーム',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={notoSansJp.className}>
        <div className="flex flex-col min-h-screen">
          <AuthProvider>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}