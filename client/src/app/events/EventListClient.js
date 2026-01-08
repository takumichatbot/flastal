'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  FiCalendar, FiMapPin, FiSearch, FiAlertTriangle, FiCheckCircle, 
  FiPlus, FiCpu, FiLink, FiX, FiInfo, FiFilter, FiHeart, FiLoader,
  FiEdit3, FiTrash2, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ジャンル定義
const GENRES = [
  { id: 'ALL', label: 'すべて', color: 'from-gray-500 to-slate-500' },
  { id: 'IDOL', label: 'アイドル', color: 'from-pink-400 to-rose-500' },
  { id: 'VTUBER', label: 'VTuber', color: 'from-sky-400 to-blue-500' },
  { id: 'MUSIC', label: '音楽・バンド', color: 'from-purple-400 to-indigo-500' },
  { id: 'ANIME', label: 'アニメ・声優', color: 'from-orange-400 to-red-500' },
  { id: 'STAGE', label: '舞台・演劇', color: 'from-emerald-400 to-teal-500' },
  { id: 'OTHER', label: 'その他', color: 'from-gray-400 to-slate-500' },
];

function EventListContent() {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [sortBy, setSortBy] = useState('date'); 

  // モーダル状態
  const [showAiModal, setShowAiModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editTargetEvent, setEditTargetEvent] = useState(null);
  const [reportTargetId, setReportTargetId] = useState(null);

  // データ取得関数
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGenre !== 'ALL') params.append('genre', selectedGenre);
      if (sortBy) params.append('sort', sortBy);
      if (searchTerm) params.append('keyword', searchTerm);

      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken')?.replace(/^"|"$/g, '') : null;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_URL}/api/events/public?${params.toString()}`, { headers }); 

      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (e) {
      console.error(e);
      toast.error('イベント情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [selectedGenre, sortBy, searchTerm]);

  // デバウンス検索
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 500); 
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const handleEventAdded = () => {
    fetchEvents();
  };

  // イベント削除
  const handleDeleteEvent = async (e, eventId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('このイベント情報を削除しますか？')) return;

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('イベントを削除しました');
        fetchEvents();
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 興味ありボタン
  const handleInterest = async (e, eventId) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (!isAuthenticated) return toast.error('ログインが必要です');

    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const isInterested = ev.interests && ev.interests.some(i => i.userId === user.id);
        const newCount = isInterested ? (ev._count.interests - 1) : (ev._count.interests + 1);
        const newInterests = isInterested 
            ? ev.interests.filter(i => i.userId !== user.id)
            : [...(ev.interests || []), { userId: user.id }];
        
        return { 
            ...ev, 
            _count: { ...ev._count, interests: Math.max(0, newCount) }, 
            interests: newInterests 
        };
      }
      return ev;
    }));

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/events/${eventId}/interest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('通信エラー');
    } catch (error) {
      console.error(error);
      toast.error('操作に失敗しました');
      fetchEvents(); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      
      {/* 1. ヘッダーエリア */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <FiCalendar size={24}/>
                </div>
                <div>
                    <h1 className="text-xl font-extrabold text-gray-900 leading-tight">イベント情報局</h1>
                    <p className="text-[10px] text-gray-500 font-bold hidden sm:block">推しのイベントを探してフラスタを贈ろう</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center justify-end">
                <div className="relative flex-grow lg:flex-grow-0 min-w-[200px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text"
                        placeholder="イベント名・会場名..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                </div>
                
                <div className="relative">
                    <select 
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none hover:bg-gray-50 transition-colors"
                    >
                        {GENRES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                    </select>
                    <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14}/>
                </div>

                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <option value="date">開催日順</option>
                    <option value="newest">新着順</option>
                    <option value="popular">人気順</option>
                </select>
            </div>

            <div className="flex gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 border-gray-100 pt-3 lg:pt-0">
                 <button onClick={() => isAuthenticated ? setShowManualModal(true) : toast.error('ログインが必要です')} className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-xs shadow-sm">
                    <FiPlus className="mr-1.5"/> 手動追加
                 </button>
                 <button onClick={() => isAuthenticated ? setShowAiModal(true) : toast.error('ログインが必要です')} className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:scale-105 transition-all text-xs">
                    <FiCpu className="mr-1.5"/> AI解析
                 </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. リストエリア */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <FiSearch size={32} className="text-gray-300 mb-4"/>
            <p className="text-gray-600 font-bold text-lg mb-2">イベントが見つかりませんでした</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {events.map(event => {
                const isInterested = user && event.interests?.some(i => i.userId === user.id);
                const isOwner = user && (event.creatorId === user.id || user.role === 'ADMIN');
                const genreData = GENRES.find(g => g.id === event.genre) || GENRES[GENRES.length - 1];

                return (
                  <div key={event.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full relative">
                    
                    <div className="absolute top-2 right-2 z-20 flex -space-x-1.5">
                         {event.creator && (
                           <div className="w-8 h-8 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden" title={`投稿者: ${event.creator.handleName}`}>
                              {event.creator.iconUrl ? <img src={event.creator.iconUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400"><FiUser size={14}/></div>}
                           </div>
                         )}
                         {event.lastEditor && event.lastEditorId !== event.creatorId && (
                           <div className="w-8 h-8 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden" title={`更新者: ${event.lastEditor.handleName}`}>
                              {event.lastEditor.iconUrl ? <img src={event.lastEditor.iconUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-500"><FiEdit3 size={14}/></div>}
                           </div>
                         )}
                    </div>

                    <Link href={`/events/${event.id}`} className="flex-grow flex flex-col">
                        <div className={`h-40 flex items-center justify-center relative bg-gradient-to-br ${genreData.color}`}>
                            <div className="absolute top-3 left-3 bg-black/20 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20 uppercase">
                                {genreData.label}
                            </div>
                            <span className="text-7xl filter drop-shadow-lg opacity-80 transform group-hover:scale-110 transition-transform duration-500">
                                {event.sourceType === 'AI' ? '🤖' : event.sourceType === 'OFFICIAL' ? '🎤' : '👤'}
                            </span>
                        </div>
                        
                        <div className="p-5 flex flex-col flex-grow">
                            <div className="mb-2">
                                {event.sourceType === 'OFFICIAL' ? (
                                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 uppercase">Official</span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-tighter">Community</span>
                                )}
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-4 leading-snug">
                                {event.title}
                            </h3>
                            
                            <div className="mt-auto pt-4 border-t border-gray-50 space-y-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <FiCalendar className="mr-2.5 text-gray-400 shrink-0"/>
                                    <span className="font-medium">{new Date(event.eventDate).toLocaleString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center">
                                    <FiMapPin className="mr-2.5 text-gray-400 shrink-0"/>
                                    <span className="truncate font-medium">{event.venue?.venueName || '会場未定'}</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="px-5 pb-5 pt-0 flex justify-between items-center">
                        <button onClick={(e) => handleInterest(e, event.id)} className={`flex items-center text-xs font-black px-4 py-2 rounded-full border transition-all active:scale-95 ${isInterested ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-gray-200 text-gray-400 hover:text-pink-500'}`}>
                            <FiHeart className={`mr-1.5 ${isInterested ? 'fill-pink-600' : ''}`}/> {event._count?.interests || 0}
                        </button>
                        <div className="flex gap-2">
                            {event.sourceUrl && <a href={event.sourceUrl} target="_blank" className="p-2 text-gray-400 hover:text-indigo-500"><FiLink size={16}/></a>}
                            {isOwner && (
                                <>
                                    <button onClick={(e) => { e.preventDefault(); setEditTargetEvent(event); }} className="p-2 text-gray-400 hover:text-emerald-500"><FiEdit3 size={16}/></button>
                                    <button onClick={(e) => handleDeleteEvent(e, event.id)} className="p-2 text-gray-400 hover:text-red-500"><FiTrash2 size={16}/></button>
                                </>
                            )}
                            <button onClick={() => setReportTargetId(event.id)} className="p-2 text-gray-400 hover:text-red-500"><FiAlertTriangle size={16}/></button>
                        </div>
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </div>

      {/* モーダル類 */}
      {showAiModal && <AiAddModal onClose={() => setShowAiModal(false)} onAdded={handleEventAdded} />}
      {showManualModal && <ManualAddModal onClose={() => setShowManualModal(false)} onAdded={handleEventAdded} />}
      {editTargetEvent && <ManualAddModal editData={editTargetEvent} onClose={() => setEditTargetEvent(null)} onAdded={handleEventAdded} />}
      {reportTargetId && <ReportModal eventId={reportTargetId} onClose={() => setReportTargetId(null)} />}
    </div>
  );
}

// モーダルコンポーネント (AI)
function AiAddModal({ onClose, onAdded }) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text) return toast.error('テキストを入力してください');
    setIsSubmitting(true);
    const toastId = toast.loading('AIが情報を解析中...');
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/events/ai-parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text, sourceUrl: url })
      });
      if (!res.ok) throw new Error('解析失敗');
      toast.success(`追加しました！`, { id: toastId });
      onAdded(); onClose();
    } catch (e) {
      toast.error('解析エラーが発生しました。', { id: toastId });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative border border-white/20">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24}/></button>
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full"><FiCpu size={24}/></div>
            <h3 className="text-xl font-bold">AI自動登録</h3>
        </div>
        <textarea className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 h-32 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none mb-4" placeholder="告知テキストを貼り付けてください..." value={text} onChange={(e) => setText(e.target.value)} />
        <input className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white outline-none mb-6" placeholder="情報元URL (任意)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center">
          {isSubmitting ? <FiLoader className="animate-spin mr-2"/> : '解析して登録'}
        </button>
      </div>
    </div>
  );
}

// モーダルコンポーネント (手動)
function ManualAddModal({ onClose, onAdded, editData = null }) {
  const [formData, setFormData] = useState({ title: '', eventDate: '', description: '', sourceUrl: '', genre: 'OTHER' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      const d = new Date(editData.eventDate);
      setFormData({
        title: editData.title || '',
        eventDate: d.toISOString().slice(0, 16),
        description: editData.description || '',
        sourceUrl: editData.sourceUrl || '',
        genre: editData.genre || 'OTHER'
      });
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('保存中...');
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const url = editData ? `${API_URL}/api/events/${editData.id}` : `${API_URL}/api/events/user-submit`;
      const res = await fetch(url, {
        method: editData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) { toast.success('完了！', { id: toastId }); onAdded(); onClose(); }
    } catch (e) { toast.error('エラー', { id: toastId }); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative space-y-4">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24}/></button>
        <h3 className="text-xl font-bold">{editData ? 'イベント情報を編集' : '手動登録'}</h3>
        <input required className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl outline-none" placeholder="イベント名" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        <input required type="datetime-local" className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl outline-none text-sm" value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} />
        <select className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl outline-none text-sm" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})}>
           {GENRES.filter(g => g.id !== 'ALL').map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
        <textarea className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl outline-none h-24 text-sm" placeholder="詳細説明..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">キャンセル</button>
          <button type="submit" className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg">保存する</button>
        </div>
      </form>
    </div>
  );
}

// モーダルコンポーネント (通報)
function ReportModal({ eventId, onClose }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleReport = async () => {
    if (!reason) return toast.error('理由を入力してください');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      await fetch(`${API_URL}/api/events/${eventId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      toast.success('通報しました'); onClose();
    } catch(e) { toast.error('失敗しました'); } finally { setIsSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
        <h3 className="text-xl font-bold mb-4 text-red-600">通報する</h3>
        <textarea className="w-full p-4 border border-red-100 rounded-xl bg-red-50 mb-6 outline-none h-32 text-sm" placeholder="理由を入力してください（虚偽の情報、中止など）" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button onClick={handleReport} disabled={isSubmitting} className="w-full py-4 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600">
          {isSubmitting ? '送信中...' : '送信する'}
        </button>
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><FiLoader className="animate-spin text-indigo-500 w-10 h-10" /></div>}>
      <EventListContent />
    </Suspense>
  );
}