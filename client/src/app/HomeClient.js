'use client'; 

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import HomePageContent from './components/HomePageContent';
import { FiLoader } from 'react-icons/fi';

// 読み込み中のプレースホルダー
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

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'USER' || user.role === 'ORGANIZER') { 
        router.push('/mypage');
      }
    }
  }, [user, loading, router]);

  // ログインチェック中、またはログイン済みでリダイレクト待ちの場合
  if (loading || user) {
    return <HomeLoading />;
  }

  // --- 未ログイン時のトップページ表示 ---
  // HomePageContent内で useSearchParams が使われているため、ここで再度 Suspense で囲む
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomePageContent />
    </Suspense>
  );
}