'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
    FiEdit, FiTrash2, FiPlus, FiCheck, FiX, 
    FiMapPin, FiSearch, FiInfo, FiTruck, FiBox, FiArrowLeft, FiClock, FiCheckCircle, FiLoader, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';

// APIのURL。末尾のスラッシュを確実に排除
const API_BASE_URL = 'https://flastal-backend.onrender.com/api';

// --- モーダルコンポーネント ---
function VenueModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    address: '',
    password: '', 
    isStandAllowed: true,
    standRegulation: '',
    isBowlAllowed: true,
    bowlRegulation: '',
    retrievalRequired: true,
    accessInfo: '',
    isOfficial: false 
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData({
                ...initialData,
                password: '', 
                standRegulation: initialData.standRegulation || '',
                bowlRegulation: initialData.bowlRegulation || '',
                accessInfo: initialData.accessInfo || '',
                isOfficial: initialData.isOfficial ?? false
            });
        } else {
            const randomId = Math.random().toString(36).slice(-5);
            setFormData({
                venueName: '',
                email: `venue_${randomId}@flastal.temp`,
                address: '',
                password: 'flastal_venue',
                isStandAllowed: true,
                standRegulation: '',
                isBowlAllowed: true,
                bowlRegulation: '',
                retrievalRequired: true,
                accessInfo: '',
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 font-sans text-slate-800">
        <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 italic uppercase tracking-tighter">
                {initialData ? '会場情報の編集' : '新規会場の登録'}
            </h2>
            <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-colors text-slate-400 shadow-sm">
                <FiX size={24} />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-10">
            <form id="venueForm" onSubmit={handleSubmit} className="space-y-12">
            <section className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-3 flex items-center gap-2">
                    <FiInfo className="text-pink-500" /> 基本情報
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-black text-slate-500 mb-3 ml-1 uppercase tracking-widest">会場・施設名</label>
                        <input required name="venueName" value={formData.venueName} onChange={handleChange} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-pink-200 outline-none transition-all font-bold text-lg" placeholder="例: 東京ガーデンシアター" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-black text-slate-500 mb-3 ml-1 uppercase tracking-widest">所在地</label>
                        <div className="relative">
                            <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"/>
                            <input name="address" value={formData.address} onChange={handleChange} className="w-full py-5 pl-14 pr-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-pink-200 outline-none transition-all font-bold" placeholder="東京都江東区..." />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-4 cursor-pointer group bg-slate-50 p-6 rounded-2xl border-2 border-transparent hover:border-blue-100 transition-all">
                            <input type="checkbox" name="isOfficial" checked={formData.isOfficial} onChange={handleChange} className="w-6 h-6 rounded-lg text-blue-500 border-slate-200 focus:ring-blue-500" />
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-widest">公式データベースとして承認</span>
                                <span className="text-[10px] font-bold text-slate-400">チェックを入れると一般ユーザーの一覧に掲載されます</span>
                            </div>
                        </label>
                    </div>
                </div>
            </section>
            <section className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-3 flex items-center gap-2">
                    <FiBox className="text-pink-500" /> 規約目安
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className={`p-8 rounded-[2rem] border-2 transition-all ${formData.isStandAllowed ? 'bg-green-50/30 border-green-100' : 'bg-slate-50 border-slate-50'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">💐 スタンド花</h4>
                            <input type="checkbox" name="isStandAllowed" checked={formData.isStandAllowed} onChange={handleChange} className="w-6 h-6" />
                        </div>
                        {formData.isStandAllowed && (
                            <textarea name="standRegulation" value={formData.standRegulation} onChange={handleChange} rows="4" className="w-full p-5 rounded-2xl text-sm bg-white border border-green-100 outline-none font-bold leading-relaxed" placeholder="サイズ制限などを記入..." />
                        )}
                    </div>
                </div>
            </section>
            </form>
        </div>
        <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-5">
            <button type="button" onClick={onClose} className="px-10 py-5 bg-white text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all text-sm uppercase tracking-widest">キャンセル</button>
            <button type="submit" form="venueForm" className="px-12 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-pink-600 shadow-2xl transition-all text-sm uppercase tracking-[0.2em]">
                {initialData ? '変更を保存' : '会場を登録'}
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  const getCleanToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const t = localStorage.getItem('authToken');
    return t ? t.replace(/"/g, '') : null;
  }, []);

  const fetchVenues = useCallback(async () => {
    const token = getCleanToken();
    if (!token) {
        setErrorInfo("認証が必要です。再ログインしてください。");
        setLoadingData(false);
        return;
    }

    setLoadingData(true);
    setErrorInfo(null);

    try {
      // app.use('/api', venueRoutes) に合わせ、 venues/admin を指定
      const res = await fetch(`${API_BASE_URL}/venues/admin?t=${Date.now()}`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Accept': 'application/json'
        }
      });
      
      if (res.status === 401 || res.status === 403) {
          setErrorInfo("セッションが切れたか、権限がありません。再ログインしてください。");
          return;
      }

      if (!res.ok) throw new Error(`データ取得失敗 (${res.status})`);
      
      const data = await res.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Venue Fetch error:", error);
      setErrorInfo("通信に失敗しました。サーバーの稼働状況を確認してください。");
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

  const handleCreateOrUpdate = async (formData) => {
    const token = getCleanToken();
    // venues.js の定義 (router.post('/venues', ...)) に合わせる
    const url = editingVenue ? `${API_BASE_URL}/venues/${editingVenue.id}` : `${API_BASE_URL}/venues`;
    const method = editingVenue ? 'PATCH' : 'POST';
    
    const bodyData = { ...formData };
    if (editingVenue && !bodyData.password) delete bodyData.password;

    const promise = fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(bodyData),
    }).then(async res => {
      if (!res.ok) throw new Error('保存に失敗しました');
      return res.json();
    });

    toast.promise(promise, {
      loading: '保存中...',
      success: () => { setIsModalOpen(false); fetchVenues(); return '保存しました'; },
      error: (err) => err.message
    });
  };

  const handleApprove = async (id) => {
    const token = getCleanToken();
    const loadingToast = toast.loading('承認処理中...');
    
    try {
      // 修正: エンドポイントを /api/venues/${id} に固定
      const res = await fetch(`${API_BASE_URL}/venues/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ isOfficial: true }),
      });
      
      toast.dismiss(loadingToast);

      if (res.ok) {
        toast.success('会場を承認しました！一覧に公開されます。');
        fetchVenues();
      } else {
        const err = await res.json();
        toast.error(`承認に失敗しました: ${err.message || res.status}`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('通信エラーが発生しました');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この会場を削除しますか？')) return;
    const token = getCleanToken();
    try {
      const res = await fetch(`${API_BASE_URL}/venues/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('削除しました');
        setVenues(prev => prev.filter(v => v.id !== id));
      }
    } catch (error) {
      toast.error('削除に失敗しました');
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
    <div className="min-h-screen bg-white flex items-center justify-center font-sans text-slate-800">
        <FiLoader className="animate-spin text-pink-500 size-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 sm:p-12 font-sans text-slate-800 pt-28">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 px-2">
            <div className="space-y-4 text-slate-800">
                <Link href="/admin" className="inline-flex items-center text-[10px] font-black text-slate-300 hover:text-pink-500 transition-colors uppercase tracking-[0.3em]">
                    <FiArrowLeft className="mr-2"/> 管理画面に戻る
                </Link>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter italic uppercase">会場管理</h1>
                <p className="text-slate-400 font-bold text-sm tracking-[0.2em] uppercase">データベースの承認と整理</p>
            </div>
            <div className="flex gap-4">
                <button onClick={fetchVenues} className="p-5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm text-slate-400 hover:text-pink-500">
                    <FiRefreshCw className={loadingData ? 'animate-spin' : ''} size={24} />
                </button>
                <button onClick={() => { setEditingVenue(null); setIsModalOpen(true); }} className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] hover:bg-pink-600 shadow-2xl transition-all font-black active:scale-95 group uppercase tracking-widest text-sm">
                  <FiPlus size={20} className="group-hover:rotate-90 transition-transform" /><span>新規追加</span>
                </button>
            </div>
        </div>

        {errorInfo && (
            <div className="mb-12 bg-rose-50 border-2 border-rose-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 text-slate-800">
                <div className="flex items-center gap-6 text-slate-800">
                    <div className="bg-rose-500 text-white p-4 rounded-[1.5rem] shadow-xl shadow-rose-200">
                        <FiAlertTriangle size={32} />
                    </div>
                    <div>
                        <p className="font-black text-rose-900 text-xl tracking-tight">同期エラーが発生しました</p>
                        <p className="text-rose-700/60 text-sm font-bold mt-1 uppercase tracking-widest">{errorInfo}</p>
                    </div>
                </div>
                <button onClick={() => { logout(); router.push('/login'); }} className="px-10 py-5 bg-rose-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-100">
                    再ログインする
                </button>
            </div>
        )}

        <div className="bg-white p-8 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.02)] border border-slate-100 mb-12 flex flex-col md:flex-row items-center gap-8">
            <div className="relative flex-1 w-full group">
                <FiSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 size-6 transition-colors group-focus-within:text-pink-500" />
                <input 
                    type="text" 
                    placeholder="会場名や所在地を検索..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-20 pr-10 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-pink-100 outline-none transition-all font-bold text-xl placeholder:text-slate-200"
                />
            </div>
            <div className="px-12 py-6 bg-slate-50 rounded-[2rem] text-[10px] font-black text-slate-300 tracking-[0.3em] uppercase border border-slate-100/50 whitespace-nowrap">
                登録件数 <span className="text-slate-900 text-base ml-2 tracking-tighter">{venues.length}</span>
            </div>
        </div>

        <div className="space-y-6">
          {loadingData && !errorInfo ? (
            <div className="py-40 flex flex-col items-center justify-center text-slate-200 gap-8">
                <FiLoader className="animate-spin size-16 text-pink-500" />
                <p className="text-[10px] font-black tracking-[0.5em] uppercase animate-pulse">読み込み中...</p>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="bg-white rounded-[3rem] py-40 text-center border-2 border-dashed border-slate-50 text-slate-300 font-black tracking-widest italic uppercase">データが見つかりませんでした</div>
          ) : (
            filteredVenues.map((venue) => (
                <div key={venue.id} className={`bg-white rounded-[3rem] p-10 border-2 transition-all flex flex-col md:flex-row items-center gap-10 group ${!venue.isOfficial ? 'border-pink-200 bg-pink-50/10 shadow-[0_20px_40px_rgba(244,114,182,0.08)]' : 'border-slate-50 hover:border-pink-50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.03)]'}`}>
                    <div className="flex-1 w-full text-slate-800">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <h3 className="font-black text-slate-800 text-3xl tracking-tighter uppercase">{venue.venueName}</h3>
                            {!venue.isOfficial && (
                                <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-pink-200 animate-pulse">
                                    <FiClock /> 承認待ち
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-8">
                            <p className="text-base font-bold text-slate-400 italic flex items-center gap-2">
                                <FiMapPin className="text-pink-500/40" size={18}/> {venue.address || '住所未登録'}
                            </p>
                            <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest border border-slate-100 px-4 py-1 rounded-lg">ID: {venue.id.slice(-6)}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {!venue.isOfficial && (
                            <button onClick={() => handleApprove(venue.id)} className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-5 rounded-[1.5rem] hover:shadow-2xl hover:scale-[1.02] transition-all font-black text-xs uppercase tracking-widest active:scale-95">
                                <FiCheckCircle size={20} /><span>承認する</span>
                            </button>
                        )}
                        <button onClick={() => { setEditingVenue(venue); setIsModalOpen(true); }} className="p-5 bg-slate-900 text-white rounded-[1.5rem] hover:bg-pink-600 transition-all shadow-xl active:scale-95">
                            <FiEdit size={22} />
                        </button>
                        <button onClick={() => handleDelete(venue.id)} className="p-5 bg-slate-50 text-slate-300 rounded-[1.5rem] hover:bg-rose-500 hover:text-white transition-all active:scale-95">
                            <FiTrash2 size={22} />
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