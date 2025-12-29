'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import ApprovalPendingCard from '@/components/dashboard/ApprovalPendingCard'; 
import FloristAppealPostForm from '@/components/dashboard/FloristAppealPostForm';

import { 
  FiRefreshCw, FiCalendar, FiMapPin, FiClock, FiUser, 
  FiDollarSign, FiLogOut, FiSettings, FiArrowRight,
  FiBriefcase, FiAlertCircle, FiCamera
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristDashboardPage() {
  const { user, logout, isLoading, authenticatedFetch } = useAuth(); 
  const [data, setData] = useState(null);
  const [sessionError, setSessionError] = useState(false);
  const isFetching = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/profile`);
      if (res && res.ok) {
        const json = await res.json();
        setData(json);
        setSessionError(false);
      } else if (res && res.status === 401) {
        setSessionError(true);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      isFetching.current = false;
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    // ロード完了後、お花屋さんであることを確認してから取得
    if (!isLoading && user && user.role === 'FLORIST' && user.status === 'APPROVED') {
      fetchData();
    }
  }, [isLoading, user, fetchData]);

  // 1. ロード中（最優先）
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // 2. 認証失敗が確定した場合（isLoadingが終わった後）
  if (!user || user.role !== 'FLORIST' || sessionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <FiAlertCircle size={48} className="text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">セッションを同期できませんでした</h1>
        <p className="text-sm text-slate-500 mb-8 text-center max-w-xs">
            認証の有効期限が切れたか、正しいアクセス権がありません。再度ログインをお試しください。
        </p>
        <Link href="/florists/login" className="px-10 py-4 bg-pink-600 text-white rounded-full font-bold shadow-xl hover:bg-pink-700 transition-all">
          ログイン画面へ戻る
        </Link>
      </div>
    );
  }

  // 3. 承認待ち（statusがAPPROVEDでない）
  if (user.status !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
          <div className="max-w-2xl mx-auto mt-10"><ApprovalPendingCard /></div>
          <button onClick={() => logout()} className="block mx-auto mt-8 text-slate-400 text-sm underline">ログアウト</button>
      </div>
    );
  }

  // 4. データ取得完了待ち
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-bounce mb-4 text-4xl">💐</div>
        <p className="text-slate-500 font-bold animate-pulse">データを読み込み中...</p>
      </div>
    );
  }

  // 5. 正常レンダリング
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <span className="bg-pink-100 text-pink-600 p-1.5 rounded-lg"><FiBriefcase /></span>
          <span>Florist Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Login as</p>
              <p className="text-sm font-bold text-slate-700">{data.shopName || user.shopName}</p>
          </div>
          <button onClick={() => logout()} className="text-slate-400 hover:text-red-500 transition-colors"><FiLogOut size={20} /></button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg mb-6">
                    <h2 className="text-2xl font-bold">Welcome Back!</h2>
                    <p className="opacity-90 text-sm mt-1">最新の実績をアピールして依頼を獲得しましょう。</p>
                </div>
                <FloristAppealPostForm user={user} onPostSuccess={fetchData} />
             </div>
             <div className="space-y-4">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                   <p className="text-xs text-slate-400 font-bold uppercase mb-1 tracking-widest">売上残高</p>
                   <p className="text-3xl font-black text-slate-800">{(data.balance || 0).toLocaleString()} <span className="text-sm font-normal">pt</span></p>
                </div>
                <Link href="/florists/profile/edit" className="block p-4 bg-slate-800 text-white rounded-2xl text-center font-bold hover:bg-slate-700 transition-all shadow-md">
                   プロフィールを編集
                </Link>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><FiAlertCircle className="text-pink-500"/> 最新のオファー</h3>
             {data.offers?.length > 0 ? (
                <div className="grid gap-3">
                   {data.offers.slice(0, 5).map(o => (
                      <div key={o.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center border border-transparent hover:border-pink-200 transition-all">
                         <div>
                            <p className="font-bold text-slate-800">{o.project?.title || '無題の企画'}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(o.createdAt).toLocaleDateString()}</p>
                         </div>
                         <Link href={`/florists/projects/${o.projectId}`} className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-pink-500 hover:shadow-sm">詳細</Link>
                      </div>
                   ))}
                </div>
             ) : <p className="text-slate-400 text-sm py-16 text-center border-2 border-dashed border-slate-100 rounded-xl">新しいオファーはありません</p>}
          </div>
      </main>
    </div>
  );
}