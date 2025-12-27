'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
    FiEdit, FiTrash2, FiPlus, FiCheck, FiX, 
    FiMapPin, FiSearch, FiInfo, FiArrowLeft, FiClock, FiCheckCircle, FiLoader, FiAlertTriangle, FiRefreshCw, FiSlash
} from 'react-icons/fi';

const API_BASE_URL = 'https://flastal-backend.onrender.com/api';

// --- モーダル ---
function VenueModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    isStandAllowed: true,
    standRegulation: '',
    isOfficial: false 
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData({
                ...initialData,
                standRegulation: initialData.standRegulation || '',
                isOfficial: initialData.isOfficial ?? false
            });
        } else {
            setFormData({
                venueName: '',
                address: '',
                isStandAllowed: true,
                standRegulation: '',
                isOfficial: true 
            });
        }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 text-slate-800">
        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-2xl font-black text-slate-800 italic">
                {initialData ? '会場情報を編集' : '新規会場を登録'}
            </h2>
            <button onClick={onClose} className="p-3 hover:bg-white rounded-full text-slate-400 shadow-sm"><FiX size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-10 text-slate-800">
            <form id="venueForm" onSubmit={handleSubmit} className="space-y-10">
                <section className="space-y-6 text-slate-800">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">会場名</label>
                    <input required name="venueName" value={formData.venueName} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-pink-200 outline-none font-bold text-lg text-slate-800 shadow-sm" />
                    
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">所在地</label>
                    <input name="address" value={formData.address} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-pink-200 outline-none font-bold text-slate-800 shadow-sm" />
                    
                    <label className="flex items-center gap-4 cursor-pointer bg-slate-50 p-6 rounded-2xl border-2 border-transparent hover:border-blue-100 transition-all">
                        <input type="checkbox" name="isOfficial" checked={formData.isOfficial} onChange={handleChange} className="w-6 h-6 rounded-lg text-blue-500 border-slate-200" />
                        <div>
                            <span className="text-sm font-black text-slate-800">公式として承認する</span>
                            <p className="text-[10px] text-slate-400 font-bold">一般ユーザーの一覧に公開されます</p>
                        </div>
                    </label>
                </section>
            </form>
        </div>
        <div className="p-10 border-t border-slate-50 flex justify-end gap-5">
            <button type="button" onClick={onClose} className="px-10 py-5 bg-white text-slate-400 font-black rounded-2xl hover:bg-slate-100 text-sm">キャンセル</button>
            <button type="submit" form="venueForm" className="px-12 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-pink-600 shadow-xl text-sm">
                {initialData ? '保存する' : '登録する'}
            </button>
        </div>
      </div>
    </div>
  );
}

// --- メインページ ---
export default function AdminVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  const getCleanToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const t = localStorage.getItem('authToken');
    if (!t) return null;
    return t.replace(/"/g, '').trim();
  }, []);

  const fetchVenues = useCallback(async () => {
    const token = getCleanToken();
    if (!token) {
        setErrorInfo("ログインが必要です。");
        setLoadingData(false);
        return;
    }

    setLoadingData(true);
    setErrorInfo(null);

    try {
      const res = await fetch(`${API_BASE_URL}/venues/admin?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
      });
      
      if (res.status === 401 || res.status === 403) {
          setErrorInfo("管理者権限エラー。ログアウトしてログインし直してください。");
          return;
      }
      if (!res.ok) throw new Error(`エラー (${res.status})`);
      
      const data = await res.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorInfo("データの取得に失敗しました。");
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

  const handleApprove = async (id) => {
    const token = getCleanToken();
    const loadingToast = toast.loading('サーバーで承認しています...');
    try {
      const res = await fetch(`${API_BASE_URL}/venues/${id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ isOfficial: true }),
      });
      
      const resData = await res.json().catch(() => ({}));
      toast.dismiss(loadingToast);
      
      if (res.ok) {
        toast.success('会場を承認しました！');
        fetchVenues();
      } else {
        toast.error(`承認失敗: ${resData.message || 'サーバー側で拒否されました'}`, { duration: 6000 });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('ネットワークエラーが発生しました');
    }
  };

  // 否認（削除）処理
  const handleReject = async (id, name) => {
    if (!window.confirm(`「${name}」の申請を否認（削除）しますか？この操作は取り消せません。`)) return;
    
    const token = getCleanToken();
    const loadingToast = toast.loading('削除しています...');
    try {
      const res = await fetch(`${API_BASE_URL}/venues/${id}`, {
        method: 'DELETE',
        headers: { 
            'Authorization': `Bearer ${token}` 
        }
      });
      
      toast.dismiss(loadingToast);
      
      if (res.ok) {
        toast.success('申請を否認・削除しました。');
        fetchVenues();
      } else {
        const resData = await res.json().catch(() => ({}));
        toast.error(`削除失敗: ${resData.message || '権限がありません'}`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('通信エラーが発生しました');
    }
  };

  const handleCreateOrUpdate = async (formData) => {
    const token = getCleanToken();
    const url = editingVenue ? `${API_BASE_URL}/venues/${editingVenue.id}` : `${API_BASE_URL}/venues`;
    const method = editingVenue ? 'PATCH' : 'POST';

    const promise = fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData),
    }).then(async res => {
      if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'サーバーエラー');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '同期中...',
      success: () => { setIsModalOpen(false); fetchVenues(); return '保存しました'; },
      error: (err) => err.message
    });
  };

  const filteredVenues = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return venues.filter(v => 
        (v.venueName || '').toLowerCase().includes(lower) || 
        (v.address || '').toLowerCase().includes(lower)
    ).sort((a, b) => (a.isOfficial === b.isOfficial) ? 0 : a.isOfficial ? 1 : -1);
  }, [venues, searchTerm]);

  if (authLoading) return <div className="min-h-screen bg-white flex items-center justify-center font-sans"><FiLoader className="animate-spin text-pink-500 size-10" /></div>;

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 sm:p-12 font-sans text-slate-800 pt-28">
      <div className="max-w-7xl mx-auto text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 px-2 text-slate-800">
            <div className="space-y-4">
                <Link href="/admin" className="inline-flex items-center text-[10px] font-black text-slate-300 hover:text-pink-500 transition-colors uppercase tracking-[0.3em]">
                    <FiArrowLeft className="mr-2"/> ダッシュボードに戻る
                </Link>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter italic">会場管理</h1>
                <p className="text-slate-400 font-bold text-sm tracking-[0.2em] uppercase">承認済みおよび未承認の会場リスト</p>
            </div>
            <div className="flex gap-4">
                <button onClick={fetchVenues} className="p-5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 shadow-sm text-slate-400 transition-all">
                    <FiRefreshCw className={loadingData ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => { setEditingVenue(null); setIsModalOpen(true); }} className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] hover:bg-pink-600 shadow-2xl transition-all font-black active:scale-95 group text-sm uppercase">
                  <FiPlus size={20} className="group-hover:rotate-90 transition-transform" /><span>会場を追加</span>
                </button>
            </div>
        </div>

        {errorInfo && (
            <div className="mb-12 bg-rose-50 border-2 border-rose-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 text-slate-800 shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="bg-rose-500 text-white p-4 rounded-[1.5rem] shadow-xl"><FiAlertTriangle size={32} /></div>
                    <div>
                        <p className="font-black text-rose-900 text-xl tracking-tight">管理権限に問題があります</p>
                        <p className="text-rose-700/60 text-sm font-bold mt-1 uppercase tracking-widest">{errorInfo}</p>
                    </div>
                </div>
                <button onClick={() => { logout(); router.push('/login'); }} className="px-10 py-5 bg-rose-500 text-white rounded-[1.5rem] font-black text-xs uppercase hover:bg-rose-600 transition-all shadow-lg">一度ログアウトして再開</button>
            </div>
        )}

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 mb-12 flex flex-col md:flex-row items-center gap-8">
            <div className="relative flex-1 w-full group">
                <FiSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 size-6 transition-colors group-focus-within:text-pink-500" />
                <input 
                    type="text" 
                    placeholder="名前や住所でフィルタリング..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-20 pr-10 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-pink-100 outline-none transition-all font-bold text-xl placeholder:text-slate-200 text-slate-800 shadow-sm"
                />
            </div>
            <div className="px-12 py-6 bg-slate-50 rounded-[2rem] text-[10px] font-black text-slate-300 tracking-[0.3em] border border-slate-100/50 whitespace-nowrap uppercase">
                現在の件数 <span className="text-slate-900 text-base ml-2 tracking-tighter">{venues.length}</span>
            </div>
        </div>

        <div className="space-y-6">
          {loadingData && venues.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center text-slate-200 gap-8">
                <FiLoader className="animate-spin size-16 text-pink-500" />
                <p className="text-[10px] font-black tracking-[0.5em] uppercase">サーバーと同期中...</p>
            </div>
          ) : filteredVenues.length === 0 && !errorInfo ? (
            <div className="bg-white rounded-[3rem] py-40 text-center border-2 border-dashed border-slate-50 text-slate-300 font-black italic">該当データなし</div>
          ) : (
            filteredVenues.map((venue) => (
                <div key={venue.id} className={`bg-white rounded-[3rem] p-10 border-2 transition-all flex flex-col md:flex-row items-center gap-10 group shadow-sm ${!venue.isOfficial ? 'border-pink-200 bg-pink-50/10 shadow-pink-50' : 'border-slate-50 hover:border-pink-50'}`}>
                    <div className="flex-1 w-full text-slate-800">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <h3 className="font-black text-slate-800 text-2xl tracking-tighter uppercase">{venue.venueName}</h3>
                            {!venue.isOfficial && (
                                <span className="bg-pink-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse shadow-lg shadow-pink-100"><FiClock /> 承認待ち</span>
                            )}
                        </div>
                        <p className="text-base font-bold text-slate-400 italic flex items-center gap-2">
                            <FiMapPin className="text-pink-500/40" size={18}/> {venue.address || '住所未登録'}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        {!venue.isOfficial ? (
                            <>
                                <button onClick={() => handleApprove(venue.id)} className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-5 rounded-[1.5rem] hover:shadow-2xl hover:scale-[1.02] transition-all font-black text-xs uppercase active:scale-95 shadow-lg shadow-green-100">
                                    <FiCheckCircle size={20} /><span>承認する</span>
                                </button>
                                <button onClick={() => handleReject(venue.id, venue.venueName)} className="flex items-center gap-3 bg-white border-2 border-rose-100 text-rose-500 px-10 py-5 rounded-[1.5rem] hover:bg-rose-500 hover:text-white transition-all font-black text-xs uppercase active:scale-95 shadow-sm">
                                    <FiSlash size={20} /><span>否認</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => handleReject(venue.id, venue.venueName)} className="p-5 bg-slate-100 text-slate-300 rounded-[1.5rem] hover:bg-rose-500 hover:text-white transition-all shadow-sm group-hover:text-slate-400">
                                <FiTrash2 size={22} />
                            </button>
                        )}
                        <button onClick={() => { setEditingVenue(venue); setIsModalOpen(true); }} className="p-5 bg-slate-900 text-white rounded-[1.5rem] hover:bg-pink-600 transition-all shadow-xl active:scale-95">
                            <FiEdit size={22} />
                        </button>
                    </div>
                </div>
            ))
          )}
        </div>
      </div>

      <VenueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateOrUpdate} initialData={editingVenue} />
      <style jsx global>{` body { background-color: #fafafa; } `}</style>
    </div>
  );
}