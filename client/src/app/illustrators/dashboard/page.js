'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiPenTool, FiCheckCircle, FiClock, FiSettings, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function IllustratorDashboard() {
  const { user, logout, isLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedOrders: 0,
    salesBalance: 0
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/illustrators/login');
    }
  }, [user, isLoading, router]);

  // ダッシュボードデータの取得
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        const res = await authenticatedFetch(`${API_URL}/api/illustrators/dashboard`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    if (user && !isLoading) {
      fetchDashboardData();
    }
  }, [user, isLoading, authenticatedFetch]);

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <FiPenTool size={20} />
            </div>
            <span className="font-bold text-slate-800">Illustrator Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-600">{user.handleName || user.activityName} 様</span>
            <button onClick={() => { logout(); router.push('/illustrators/login'); }} className="text-slate-400 hover:text-red-500 transition">
                <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">ダッシュボード</h1>
            <p className="text-slate-500 text-sm mt-1">案件の管理やプロフィールの編集が行えます。</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-blue-50 text-blue-500 p-3 rounded-xl"><FiClock size={24}/></div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">依頼受付中</p>
                    <p className="text-2xl font-black text-slate-800">{stats.activeOrders || 0} <span className="text-sm font-normal text-slate-400">件</span></p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-green-50 text-green-500 p-3 rounded-xl"><FiCheckCircle size={24}/></div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">納品完了</p>
                    <p className="text-2xl font-black text-slate-800">{stats.completedOrders || 0} <span className="text-sm font-normal text-slate-400">件</span></p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-purple-50 text-purple-500 p-3 rounded-xl"><FiSettings size={24}/></div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">売上残高</p>
                    <p className="text-2xl font-black text-slate-800">¥{(stats.salesBalance || 0).toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <FiPenTool size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">まだ案件がありません</h3>
            <p className="text-slate-500 text-sm mb-6">プロフィールを充実させて、依頼を待ちましょう！</p>
            <button className="bg-amber-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition">
                プロフィールを編集
            </button>
        </div>
      </main>
    </div>
  );
}