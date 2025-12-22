'use client'; 

import { useEffect, Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import HomePageContent from './components/HomePageContent';
import { FiLoader } from 'react-icons/fi';

/**
 * 読み込み中・リダイレクト待機用のローディング表示
 */
function HomeLoading() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
      <FiLoader className="w-10 h-10 text-indigo-500 animate-spin" />
      <p className="mt-4 text-sm text-slate-400 font-medium">FLASTAL Loading...</p>
    </div>
  );
}

/**
 * ロジック本体
 * useSearchParams() 等に依存する HomePageContent を安全に呼び出します
 */
function HomeInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // マウント確認（ハイドレーションエラーとビルドエラーの防止）
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (loading || !isMounted) return;
    
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'USER' || user.role === 'ORGANIZER') { 
        router.push('/mypage');
      }
    }
  }, [user, loading, router, isMounted]);

  // マウント前、読み込み中、またはログイン済みの場合はローディングを表示
  if (!isMounted || loading || user) {
    return <HomeLoading />;
  }

  // ここで HomePageContent を表示。
  // HomePageContent 内部の useSearchParams も親の Suspense で保護されます。
  return <HomePageContent />;
}

/**
 * ページエントリポイント
 * ここで Suspense 境界を定義することで、Next.js 15 のビルドエラーを物理的に回避します。
 */
export default function Page() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeInner />
    </Suspense>
  );
}