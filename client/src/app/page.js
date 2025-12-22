'use client'; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import HomePageContent from './components/HomePageContent';
import { FiLoader } from 'react-icons/fi'; // アイコン追加

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. ローディング中は待機
    if (loading) return;

    // 2. ログイン済みなら、ロールに応じてリダイレクト
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'USER' || user.role === 'ORGANIZER') { 
        // ORGANIZERもマイページへ (必要に応じて調整)
        router.push('/mypage');
      }
      // Note: FLORIST, VENUE は Header等の別ロジックまたはログイン画面で分岐させる想定
    }
  }, [user, loading, router]);

  // --- ローディング画面 (スプラッシュスクリーン) ---
  // loading中、またはリダイレクト待機中(user有)の場合に表示
  if (loading || user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-sky-50 to-pink-50">
        <div className="text-center animate-fadeIn">
          {/* ロゴやアイコン (必要に応じて画像に差し替え可) */}
          <div className="mb-6 inline-block p-4 bg-white rounded-full shadow-xl">
             <div className="text-4xl">💐</div>
          </div>
          
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-widest mb-2">
            FLASTAL
          </h1>
          <p className="text-xs text-slate-500 font-bold mb-8 uppercase tracking-widest">
            Crowdfunding for Flowers
          </p>

          <div className="flex justify-center">
            <FiLoader className="w-8 h-8 text-sky-500 animate-spin" />
          </div>
          <p className="mt-3 text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // --- 未ログイン時のトップページ表示 ---
  return <HomePageContent />;
}