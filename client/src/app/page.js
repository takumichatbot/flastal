'use client'; 

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import HomePageContent from './components/HomePageContent';
import { FiLoader } from 'react-icons/fi';

/**
 * 読み込み中表示（fallback用）
 */
function HomeLoading() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-sky-50 to-pink-50 text-center">
      <div className="mb-6 inline-block p-4 bg-white rounded-full shadow-xl">
         <div className="text-4xl">💐</div>
      </div>
      <h1 className="text-2xl font-extrabold text-slate-800 tracking-widest mb-2">FLASTAL</h1>
      <div className="flex justify-center mt-4">
        <FiLoader className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    </div>
  );
}

/**
 * 【動的部分】
 * useAuth や useRouter, および内部で useSearchParams を使うコンポーネントをここに封じ込めます。
 */
function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // ログイン済みなら、各ロールのダッシュボードへ飛ばす
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'USER' || user.role === 'ORGANIZER') { 
        router.push('/mypage');
      }
    }
  }, [user, loading, router]);

  // ローディング中、またはリダイレクト待機中
  if (loading || user) {
    return <HomeLoading />;
  }

  // 未ログイン時のトップページ表示
  return <HomePageContent />;
}

/**
 * 【メインエクスポート】
 * ページ全体を Suspense でラップ。
 * これにより Next.js 15 のビルドエンジンは「この中身は動的だからビルド時はスキップ」と正しく判断します。
 */
export default function Page() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}