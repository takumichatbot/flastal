'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
    FiEdit, FiTrash2, FiPlus, FiCheck, FiX, 
    FiMapPin, FiSearch, FiInfo, FiArrowLeft, FiClock, FiCheckCircle, FiLoader, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';

const API_BASE_URL = 'https://flastal-backend.onrender.com/api';

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  // トークン取得の徹底クリーンアップ
  const getCleanToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const t = localStorage.getItem('authToken');
    if (!t) return null;
    return t.replace(/"/g, '').trim();
  }, []);

  const fetchVenues = useCallback(async () => {
    const token = getCleanToken();
    if (!token) return;

    setLoadingData(true);
    setErrorInfo(null);

    try {
      const res = await fetch(`${API_BASE_URL}/venues/admin?t=${Date.now()}`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
        }
      });
      
      if (res.status === 401 || res.status === 403) {
          setErrorInfo("管理者権限が確認できません。一度ログアウトして再ログインを試してください。");
          return;
      }
      
      const data = await res.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("読み込み失敗:", error);
      setErrorInfo("データの取得に失敗しました。サーバーの接続を確認してください。");
    } finally {
      setLoadingData(false);
    }
  }, [getCleanToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/login');
        return;
    }
    fetchVenues();
  }, [authLoading, isAuthenticated, user, fetchVenues, router]);

  // 【最重要】承認処理の修正
  const handleApprove = async (id) => {
    const token = getCleanToken();
    const loadingToast = toast.loading('会場を承認しています...');

    try {
      // バックエンドの PATCH /api/venues/:id を叩く
      const res = await fetch(`${API_BASE_URL}/venues/${id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
            isOfficial: true,
            // サーバー側で role チェックが厳しい場合を考慮し、明示的に情報を付与（気休め）
            role: 'ADMIN' 
        }),
      });
      
      const resultData = await res.json().catch(() => ({}));
      toast.dismiss(loadingToast);

      if (res.ok) {
        toast.success('会場を承認しました！一覧に公開されます。');
        // リストを再取得して画面を更新
        fetchVenues();
      } else {
        // 失敗した理由（403など）を具体的に表示
        console.error("承認エラー詳細:", resultData);
        toast.error(`承認に失敗しました: ${resultData.message || '権限がありません (403)'}`, {
            duration: 5000
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('通信エラーが発生しました');
    }
  };

  const filteredVenues = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return venues.filter(v => 
        (v.venueName || '').toLowerCase().includes(lower) || 
        (v.address || '').toLowerCase().includes(lower)
    ).sort((a, b) => (a.isOfficial === b.isOfficial) ? 0 : a.isOfficial ? 1 : -1);
  }, [venues, searchTerm]);

  if (authLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
        <FiLoader className="animate-spin text-pink-500 size-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 sm:p-12 font-sans text-slate-800 pt-28">
      <div className="max-w-7xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="space-y-4">
                <Link href="/admin" className="inline-flex items-center text-[10px] font-black text-slate-300 hover:text-pink-500 transition-colors uppercase tracking-[0.3em]">
                    <FiArrowLeft className="mr-2"/> 管理画面トップへ
                </Link>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter italic">会場データ管理</h1>
                <p className="text-slate-400 font-bold text-sm tracking-widest">データベースの承認と整理</p>
            </div>
            <div className="flex gap-4">
                <button onClick={fetchVenues} className="p-5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                    <FiRefreshCw className={loadingData ? 'animate-spin' : 'text-slate-300'} />
                </button>
            </div>
        </div>

        {/* エラー表示 */}
        {errorInfo && (
            <div className="mb-12 bg-rose-50 border-2 border-rose-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="bg-rose-500 text-white p-4 rounded-[1.5rem] shadow-xl shadow-rose-200">
                        <FiAlertTriangle size={32} />
                    </div>
                    <div>
                        <p className="font-black text-rose-900 text-xl tracking-tight">権限エラーが発生しました</p>
                        <p className="text-rose-700/60 text-sm font-bold mt-1 uppercase tracking-widest">{errorInfo}</p>
                    </div>
                </div>
                <button onClick={() => { logout(); router.push('/login'); }} className="px-10 py-5 bg-rose-500 text-white rounded-[1.5rem] font-black text-xs hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 whitespace-nowrap">
                    ログアウトして再試行
                </button>
            </div>
        )}

        {/* 検索バー */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 mb-12 flex flex-col md:flex-row items-center gap-8">
            <div className="relative flex-1 w-full group">
                <FiSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 size-6 transition-colors group-focus-within:text-pink-500" />
                <input 
                    type="text" 
                    placeholder="会場名や所在地で検索..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-20 pr-10 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-pink-100 outline-none transition-all font-bold text-xl placeholder:text-slate-200"
                />
            </div>
            <div className="px-12 py-6 bg-slate-50 rounded-[2rem] text-xs font-black text-slate-400 tracking-widest uppercase">
                登録数 <span className="text-slate-900 text-base ml-2 tracking-tighter">{venues.length}</span>
            </div>
        </div>

        {/* リスト */}
        <div className="space-y-6">
          {loadingData && venues.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center text-slate-200 gap-8">
                <FiLoader className="animate-spin size-16 text-pink-500" />
                <p className="text-[10px] font-black tracking-widest uppercase">サーバーと同期中...</p>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="bg-white rounded-[3rem] py-40 text-center border-2 border-dashed border-slate-50 text-slate-300 font-black italic">データがありません</div>
          ) : (
            filteredVenues.map((venue) => (
                <div key={venue.id} className={`bg-white rounded-[3rem] p-10 border-2 transition-all flex flex-col md:flex-row items-center gap-10 group ${!venue.isOfficial ? 'border-pink-200 bg-pink-50/10 shadow-lg shadow-pink-50' : 'border-slate-50'}`}>
                    <div className="flex-1 w-full text-slate-800">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <h3 className="font-black text-slate-800 text-3xl tracking-tighter">{venue.venueName}</h3>
                            {!venue.isOfficial && (
                                <span className="bg-pink-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-pink-200 animate-pulse">
                                    <FiClock /> 承認待ち
                                </span>
                            )}
                        </div>
                        <p className="text-base font-bold text-slate-400 italic flex items-center gap-2">
                            <FiMapPin className="text-pink-500/40" size={18}/> {venue.address || '住所未登録'}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        {!venue.isOfficial && (
                            <button onClick={() => handleApprove(venue.id)} className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-5 rounded-[1.5rem] hover:shadow-2xl hover:scale-[1.02] transition-all font-black text-sm active:scale-95 shadow-lg shadow-green-100">
                                <FiCheckCircle size={20} /><span>承認して公開</span>
                            </button>
                        )}
                        <button className="p-5 bg-slate-100 text-slate-400 rounded-[1.5rem] hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                            <FiEdit size={22} />
                        </button>
                    </div>
                </div>
            ))
          )}
        </div>
      </div>
      <style jsx global>{` body { background-color: #fafafa; } `}</style>
    </div>
  );
}