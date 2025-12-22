'use client';

// Next.js 15 のビルドエラーを確実に回避する設定
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import { FiLoader, FiShield } from 'react-icons/fi';

/**
 * 読み込み中表示用コンポーネント
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <FiLoader className="w-10 h-10 text-sky-500 animate-spin mb-4" />
      <p className="text-slate-400 font-medium tracking-widest">SYSTEM CHECKING...</p>
    </div>
  );
}

/**
 * 実際のコンテンツ部分
 */
function HomeContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;

    // 認証状態に応じたリダイレクト処理
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role === 'ADMIN') {
      // 管理者の場合は管理者メニューを表示（またはリダイレクト）
    } else {
      router.push('/mypage');
    }
  }, [isMounted, loading, isAuthenticated, user, router]);

  // マウント前やロード中は何も表示しない（ビルドエラー防止）
  if (!isMounted || loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
      <div className="text-center">
        <FiShield className="w-16 h-16 text-sky-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">FLASTAL DASHBOARD</h1>
        <p className="text-slate-500 mt-2">権限を確認しました。移動しています...</p>
      </div>
    </div>
  );
}

/**
 * メインエクスポート
 */
export default function HomePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}