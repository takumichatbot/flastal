'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/profile`);
      if (res && res.ok) {
        const json = await res.json();
        setData(json);
      } else if (res && res.status === 401) {
        setErrorStatus(401);
      }
    } catch (error) {
      console.error(error);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (!isLoading && user && user.role === 'FLORIST' && user.status === 'APPROVED') {
      fetchData();
    }
  }, [isLoading, user, fetchData]);

  // A. ロード中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // B. セッション切れ or 権限なし（勝手に飛ばさずメッセージを出す）
  if (!user || user.role !== 'FLORIST' || errorStatus === 401) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <FiAlertCircle size={48} className="text-gray-200 mb-4" />
        <h1 className="text-lg font-bold text-slate-800 mb-4">セッションが切断されました</h1>
        <Link href="/florists/login" className="px-8 py-3 bg-pink-500 text-white rounded-full font-bold shadow-lg">
          再ログインする
        </Link>
      </div>
    );
  }

  // C. 承認待ち
  if (user.status !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
          <div className="max-w-2xl mx-auto mt-10"><ApprovalPendingCard /></div>
          <button onClick={() => logout()} className="block mx-auto mt-8 text-slate-400 text-sm underline">ログアウト</button>
      </div>
    );
  }

  // D. データ取得待ち
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">データを同期中...</div>;
  }

  // E. 正常表示
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <span className="bg-pink-100 text-pink-600 p-1.5 rounded-lg"><FiBriefcase /></span>
          <span className="hidden sm:inline">Florist Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-600">{data.shopName || user.shopName}</span>
          <button onClick={() => logout()} className="text-slate-400 hover:text-red-500 transition-colors"><FiLogOut size={20} /></button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg mb-6">
                    <h2 className="text-2xl font-bold">Welcome Back!</h2>
                    <p className="opacity-90 text-sm">今日の実績を更新しましょう。</p>
                </div>
                <FloristAppealPostForm user={user} onPostSuccess={fetchData} />
             </div>
             <div className="space-y-4">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                   <p className="text-xs text-slate-400 font-bold uppercase mb-1">現在の売上残高</p>
                   <p className="text-3xl font-black text-slate-800">{(data.balance || 0).toLocaleString()} <span className="text-sm font-normal">pt</span></p>
                </div>
                <Link href="/florists/profile/edit" className="block p-4 bg-slate-800 text-white rounded-2xl text-center font-bold hover:bg-slate-700 transition-all shadow-md">
                   プロフィールを編集
                </Link>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FiAlertCircle className="text-pink-500"/> 最新のオファー</h3>
             {data.offers?.length > 0 ? (
                <div className="space-y-3">
                   {data.offers.slice(0, 5).map(o => (
                      <div key={o.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                         <div>
                            <p className="font-bold text-slate-800">{o.project?.title}</p>
                            <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                         </div>
                         <Link href={`/florists/projects/${o.projectId}`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-pink-500 hover:bg-pink-50">詳細</Link>
                      </div>
                   ))}
                </div>
             ) : <p className="text-slate-400 text-sm py-8 text-center">新しいオファーはありません</p>}
          </div>
      </main>
    </div>
  );
}