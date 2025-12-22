'use client'; 

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import HomePageContent from './components/HomePageContent';
import { FiLoader } from 'react-icons/fi';

/**
 * 読み込み中・リダイレクト待機中のスプラッシュ画面
 */
function HomeLoading() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-sky-50 to-pink-50">
      <div className="text-center animate-fadeIn">
        <div className="mb-6 inline-block p-4 bg-white rounded-full shadow-xl">
           <div className="text-4xl">💐</div>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-widest mb-2">FLASTAL</h1>
        <div className="flex justify-center">
          <FiLoader className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
        <p className="mt-3 text-sm text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}

/**
 * 実際のトップページロジック（useAuthやHomePageContentを含む）
 */
function HomeInner() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // ログイン済みの場合の自動リダイレクト
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'USER' || user.role === 'ORGANIZER') { 
        router.push('/mypage');
      }
    }
  }, [user, loading, router]);

  // ログイン状態の判定中、またはリダイレクト実行中の表示
  if (loading || user) {
    return <HomeLoading />;
  }

  // 未ログイン時のメインコンテンツ
  // HomePageContent内の深い階層で useSearchParams() が呼ばれていても、
  // この直上の Suspense でキャッチされるためビルドエラーを防げます
  return <HomePageContent />;
}

/**
 * メインエクスポート
 * ページ全体を Suspense でラップしてエクスポートします
 */
export default function Page() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeInner />
    </Suspense>
  );
}