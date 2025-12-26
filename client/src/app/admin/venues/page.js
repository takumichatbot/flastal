'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
    FiEdit, FiTrash2, FiPlus, FiCheck, FiX, 
    FiMapPin, FiSearch, FiInfo, FiTruck, FiBox, FiArrowLeft, FiClock, FiCheckCircle, FiLoader
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

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
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 font-sans text-slate-800">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                {initialData ? '会場情報の編集' : '新規会場の登録'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                <FiX size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            <form id="venueForm" onSubmit={handleSubmit} className="space-y-10">
            
            <section className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center gap-2">
                    <FiInfo /> 基本情報
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-black text-slate-500 mb-2 ml-1">会場名</label>
                        <input required name="venueName" value={formData.venueName} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-pink-200 outline-none transition-all font-bold" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-black text-slate-500 mb-2 ml-1">住所</label>
                        <div className="relative">
                            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"/>
                            <input name="address" value={formData.address} onChange={handleChange} className="w-full py-4 pl-12 pr-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-pink-200 outline-none transition-all font-bold text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-2 ml-1">管理ID</label>
                        <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-pink-200 outline-none transition-all font-bold text-sm" />
                    </div>
                    <div className="flex items-end pb-2">
                        <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 px-6 py-4 rounded-2xl w-full border-2 border-transparent hover:border-blue-100 transition-all">
                            <input type="checkbox" name="isOfficial" checked={formData.isOfficial} onChange={handleChange} className="w-5 h-5 rounded-lg text-blue-500 border-slate-200 focus:ring-blue-500" />
                            <span className="text-sm font-black text-slate-700">公式として承認する</span>
                        </label>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center gap-2">
                    <FiBox /> レギュレーション
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-[2rem] border-2 transition-all ${formData.isStandAllowed ? 'bg-green-50/50 border-green-100' : 'bg-slate-50 border-slate-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-black text-slate-800 text-sm">💐 スタンド花</h4>
                            <input type="checkbox" name="isStandAllowed" checked={formData.isStandAllowed} onChange={handleChange} className="w-5 h-5" />
                        </div>
                        {formData.isStandAllowed && (
                            <textarea name="standRegulation" value={formData.standRegulation} onChange={handleChange} rows="3" className="w-full p-4 rounded-xl text-sm bg-white border border-green-100 outline-none font-bold" />
                        )}
                    </div>
                    <div className={`p-6 rounded-[2rem] border-2 transition-all ${formData.isBowlAllowed ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-black text-slate-800 text-sm">🎁 楽屋花</h4>
                            <input type="checkbox" name="isBowlAllowed" checked={formData.isBowlAllowed} onChange={handleChange} className="w-5 h-5" />
                        </div>
                        {formData.isBowlAllowed && (
                            <textarea name="bowlRegulation" value={formData.bowlRegulation} onChange={handleChange} rows="3" className="w-full p-4 rounded-xl text-sm bg-white border border-blue-100 outline-none font-bold" />
                        )}
                    </div>
                </div>
            </section>
            </form>
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-8 py-4 bg-white text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-all text-sm">キャンセル</button>
            <button type="submit" form="venueForm" className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-pink-600 shadow-xl transition-all text-sm">
                {initialData ? '保存' : '登録'}
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
    if (!token) return;

    setLoadingData(true);
    try {
      const res = await fetch(`${API_URL}/api/venues/admin?t=${Date.now()}`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
        }
      });
      
      // 401 (Unauthorized) はトークン切れ
      if (res.status === 401) {
          toast.error('セッションが切れました。ログインし直してください。');
          logout();
          router.push('/login');
          return;
      }

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      const data = await res.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Venue Fetch Failed:", error);
      toast.error('会場リストの読み込みに失敗しました');
    } finally {
      setLoadingData(false);
    }
  }, [getCleanToken, logout, router]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || user?.role !== 'ADMIN') {
        toast.error('管理者としてログインしてください');
        router.push('/login');
        return;
    }
    
    fetchVenues();
  }, [authLoading, isAuthenticated, user, fetchVenues, router]);

  const handleCreateOrUpdate = async (formData) => {
    const token = getCleanToken();
    const url = editingVenue 
      ? `${API_URL}/api/venues/${editingVenue.id}`
      : `${API_URL}/api/venues`;
    const method = editingVenue ? 'PATCH' : 'POST';
    
    const bodyData = { ...formData };
    if (editingVenue && !bodyData.password) delete bodyData.password;

    const promise = fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(bodyData),
    }).then(async res => {
      if (res.status === 401) {
        logout();
        router.push('/login');
        throw new Error('セッション切れ');
      }
      if (!res.ok) throw new Error('保存に失敗しました');
      return res.json();
    });

    toast.promise(promise, {
      loading: '保存中...',
      success: () => {
        setIsModalOpen(false);
        fetchVenues();
        return '保存しました';
      },
      error: (err) => err.message
    });
  };

  const handleApprove = async (id) => {
    const token = getCleanToken();
    try {
      const res = await fetch(`${API_URL}/api/venues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isOfficial: true }),
      });
      if (res.ok) {
        toast.success('承認しました');
        fetchVenues();
      }
    } catch (error) {
      toast.error('エラーが発生しました');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この会場を削除しますか？')) return;
    const token = getCleanToken();
    try {
      const res = await fetch(`${API_URL}/api/venues/${id}`, {
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
    ).sort((a, b) => {
        if (a.isOfficial !== b.isOfficial) return a.isOfficial ? 1 : -1;
        return 0;
    });
  }, [venues, searchTerm]);

  if (authLoading || !isAuthenticated) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
        <FiLoader className="animate-spin text-pink-500 size-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 sm:p-10 font-sans text-slate-800 pt-28">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 px-2">
            <div className="space-y-3">
                <Link href="/admin" className="inline-flex items-center text-[10px] font-black text-slate-300 hover:text-pink-500 transition-colors uppercase tracking-[0.3em]">
                    <FiArrowLeft className="mr-2"/> Dashboard
                </Link>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic">VENUE MANAGER</h1>
                <p className="text-slate-400 font-bold text-xs tracking-[0.2em] uppercase">会場・施設データベース管理</p>
            </div>
            <button onClick={() => { setEditingVenue(null); setIsModalOpen(true); }} className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] hover:bg-pink-600 shadow-2xl transition-all font-black active:scale-95 group">
              <FiPlus size={20} /><span>新規登録</span>
            </button>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10 flex flex-col md:flex-row items-center gap-6 text-slate-800">
            <div className="relative flex-1 w-full group">
                <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 size-5" />
                <input 
                    type="text" 
                    placeholder="キーワード検索..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-pink-100 outline-none transition-all font-bold text-lg"
                />
            </div>
            <div className="px-10 py-5 bg-slate-50 rounded-[1.5rem] text-xs font-black text-slate-300 tracking-widest uppercase">
                Total <span className="text-slate-900 ml-2">{venues.length}</span>
            </div>
        </div>

        <div className="space-y-5">
          {loadingData ? (
            <div className="py-32 flex flex-col items-center justify-center text-slate-200 gap-6">
                <FiLoader className="animate-spin size-12 text-pink-500" />
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Syncing...</p>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="bg-white rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-50 text-slate-300 font-black">NO DATA</div>
          ) : (
            filteredVenues.map((venue) => (
                <div key={venue.id} className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all flex flex-col md:flex-row items-center gap-8 group ${!venue.isOfficial ? 'border-pink-100 bg-pink-50/10 shadow-lg shadow-pink-50' : 'border-slate-50 hover:border-pink-50'}`}>
                    <div className="flex-1 w-full text-slate-800">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="font-black text-slate-800 text-2xl tracking-tight">{venue.venueName}</h3>
                            {!venue.isOfficial && (
                                <span className="bg-pink-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                    <FiClock /> 承認待ち
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-bold text-slate-400 italic flex items-center gap-2">
                            <FiMapPin className="text-pink-500/40"/> {venue.address || '住所未登録'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {!venue.isOfficial && (
                            <button onClick={() => handleApprove(venue.id)} className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:shadow-xl transition-all font-black text-sm active:scale-95">
                                <FiCheckCircle size={18} /><span>承認する</span>
                            </button>
                        )}
                        <button onClick={() => { setEditingVenue(venue); setIsModalOpen(true); }} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-pink-600 transition-all shadow-lg">
                            <FiEdit size={20} />
                        </button>
                        <button onClick={() => handleDelete(venue.id)} className="p-4 bg-slate-50 text-slate-300 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                            <FiTrash2 size={20} />
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