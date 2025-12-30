'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import ApprovalPendingCard from '@/components/dashboard/ApprovalPendingCard'; 
import FloristAppealPostForm from '@/components/dashboard/FloristAppealPostForm';

import { 
  FiRefreshCw, FiDollarSign, FiLogOut, FiSettings, FiBriefcase, FiAlertCircle
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristDashboardPage() {
  const { user, logout, isLoading, authenticatedFetch } = useAuth(); 
  const [data, setData] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null); // デバッグ用
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/profile`);
      if (res && res.ok) {
        const json = await res.json();
        setData(json);
        setErrorInfo(null);
      } else {
        const status = res ? res.status : 'No Response';
        console.error("Dashboard Fetch Error:", status);
        setErrorInfo(`API Error: ${status}`);
        // 1回だけ自動リトライ
        if (retryCount < 1) {
            setRetryCount(prev => prev + 1);
            setTimeout(fetchData, 1000);
        }
      }
    } catch (error) {
      setErrorInfo(error.message);
    }
  }, [authenticatedFetch, retryCount]);

  useEffect(() => {
    // isLoadingが完全にfalse、かつユーザーが存在する場合のみ実行
    if (!isLoading && user && user.role === 'FLORIST' && user.status === 'APPROVED') {
      fetchData();
    }
  }, [isLoading, user, fetchData]);

  // A. ロード中
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
        <p className="text-xs text-slate-400 font-mono">Initializing Auth Session...</p>
      </div>
    );
  }

  // B. セッション同期失敗の表示
  // isLoadingが終わり、2秒以上経ってもuserがいない、あるいはエラー情報がある場合
  if (!user || user.role !== 'FLORIST' || errorInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 flex flex-col items-center max-w-sm w-full shadow-xl">
            <FiAlertCircle size={48} className="text-red-500 mb-4 animate-bounce" />
            <h1 className="text-xl font-bold text-slate-800 mb-2 text-center">セッションを同期できません</h1>
            <div className="bg-white/50 p-3 rounded-lg mb-6 w-full">
                <p className="text-[10px] font-mono text-red-400 break-all text-center">
                    Debug: {errorInfo || (user ? `Role Mismatch: ${user.role}` : 'No User Object')}
                </p>
            </div>
            <p className="text-sm text-slate-500 mb-8 text-center leading-relaxed">
                セキュリティ保護のため、一度ログアウトして再度ログインをお願いします。
            </p>
            <button 
                onClick={() => logout()}
                className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-lg hover:bg-pink-700 transition-all active:scale-95"
            >
                ログアウトして再試行
            </button>
        </div>
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

  // D. データ取得完了待ち
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400 font-bold">データを同期しています...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <span className="bg-pink-100 text-pink-600 p-1.5 rounded-lg"><FiBriefcase /></span>
          <span>Florist Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-600">{data.shopName || user.shopName}</span>
          <button onClick={() => logout()} className="text-slate-400 hover:text-red-500 transition-colors p-2"><FiLogOut size={20} /></button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg mb-6">
                    <h2 className="text-2xl font-bold">Welcome Back!</h2>
                </div>
                <FloristAppealPostForm user={user} onPostSuccess={fetchData} />
             </div>
             <div className="space-y-4">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                   <p className="text-xs text-slate-400 font-bold uppercase mb-1">売上残高</p>
                   <p className="text-3xl font-black text-slate-800">{(data.balance || 0).toLocaleString()} pt</p>
                </div>
                <Link href="/florists/profile/edit" className="block p-4 bg-slate-800 text-white rounded-2xl text-center font-bold">プロフィール編集</Link>
             </div>
          </div>
      </main>
    </div>
  );
}