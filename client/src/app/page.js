'use client';

// 静的解析を完全にスキップ
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import { FiLoader, FiShield } from 'react-icons/fi';

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

function AdminDashboardInner() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!isAuthenticated || !user || user.role !== 'ADMIN') {
      router.push('/mypage');
    }
  }, [user, loading, isAuthenticated, router, isMounted]);

  // 【重要】isMountedがfalseの間は何も表示しない、またはLoadingのみ。
  // これによりビルド時の解析から保護します。
  if (!isMounted) return <AdminLoading message="Initializing..." />;
  if (loading || !user || user.role !== 'ADMIN') return <AdminLoading />;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
          <h1 className="text-3xl font-black text-slate-800 mb-6">管理者ダッシュボード</h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            ようこそ、{user.name || '管理者'}様。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            <a href="/admin/project-approval" className="p-6 bg-slate-50 rounded-2xl border border-slate-100 font-bold">企画審査一覧</a>
            <a href="/admin/venues" className="p-6 bg-slate-50 rounded-2xl border border-slate-100 font-bold">会場管理</a>
            <a href="/admin/users" className="p-6 bg-slate-50 rounded-2xl border border-slate-100 font-bold">ユーザー管理</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading message="システムを起動中..." />}>
      <AdminDashboardInner />
    </Suspense>
  );
}