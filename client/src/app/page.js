'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import { FiLoader, FiShield, FiAlertCircle } from 'react-icons/fi';
// もし元のファイルで他のコンポーネントを読み込んでいる場合は、ここに追加してください

/**
 * 読み込み中・アクセス制限表示
 */
function AdminLoading({ message = "管理者権限を確認中..." }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <div className="mb-6 p-4 bg-slate-800 rounded-full shadow-2xl">
        <FiShield className="w-12 h-12 text-sky-400 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold tracking-widest mb-4">{message}</h2>
      <FiLoader className="w-8 h-8 text-sky-500 animate-spin" />
    </div>
  );
}

/**
 * 管理者ダッシュボードのメインロジック
 */
function AdminDashboardInner() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (loading || !isMounted) return;

    // 権限チェック
    if (!isAuthenticated || !user || user.role !== 'ADMIN') {
      router.push('/mypage');
    }
  }, [user, loading, isAuthenticated, router, isMounted]);

  // ローディング中や権限確認中
  if (!isMounted || loading || !user || user.role !== 'ADMIN') {
    return <AdminLoading />;
  }

  // --- 実際のダッシュボード表示内容 ---
  // ここに元の page.js の return 以降にあった JSX を記述してください。
  // もし AdminDashboardContent のような別コンポーネントを呼んでいるなら、それを返します。
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
      {/* 既存のコンテンツをここに配置 */}
      <p className="mt-4 text-slate-500">
        ここから各管理メニュー（企画審査、会場管理、通報確認など）へアクセスできます。
      </p>
    </div>
  );
}

/**
 * メインエクスポート
 * Suspense境界を設けることで、Next.js 15 のビルドエラーを確実に回避します。
 */
export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading message="システムを起動中..." />}>
      <AdminDashboardInner />
    </Suspense>
  );
}