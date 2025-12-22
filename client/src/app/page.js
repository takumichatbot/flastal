'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import { FiLoader, FiShield, FiArrowRight, FiHeart, FiStar } from 'react-icons/fi';
import Link from 'next/link';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <FiLoader className="w-10 h-10 text-pink-500 animate-spin mb-4" />
      <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">Initializing...</p>
    </div>
  );
}

function HomeContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // マウント前や認証チェック中はロード画面を表示
  if (!isMounted || loading) return <LoadingScreen />;

  // --- ケース1: ログインしている場合 ---
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-slate-100">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShield size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">おかえりなさい</h1>
          <p className="text-slate-500 mb-8 font-medium">
            {user?.role === 'ADMIN' ? 'システム管理者' : 'FLASTAL 会員'} として認証されています。
          </p>
          <div className="space-y-4">
            <Link 
              href={user?.role === 'ADMIN' ? '/admin' : '/mypage'} 
              className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-lg"
            >
              ダッシュボードへ進む <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- ケース2: 未ログインの場合（ここが紹介ページになります） ---
  return (
    <div className="min-h-screen bg-white">
      {/* ヒーローセクション */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-500 rounded-full text-xs font-bold mb-6 tracking-widest uppercase">
            <FiStar /> Welcome to FLASTAL
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
            推しに最高の<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">フラスタ</span>を。
          </h1>
          <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            FLASTALは、ファンのみんなでフラワースタンドを贈るためのクラウドファンディングプラットフォームです。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto px-10 py-4 bg-pink-500 text-white font-bold rounded-2xl shadow-xl shadow-pink-200 hover:bg-pink-600 transition-all flex items-center justify-center gap-2">
              今すぐ始める <FiArrowRight />
            </Link>
            <Link href="/projects" className="w-full sm:w-auto px-10 py-4 bg-white text-slate-600 border border-slate-200 font-bold rounded-2xl hover:bg-slate-50 transition-all">
              企画を探す
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}