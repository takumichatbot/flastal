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
  const { user, isAuthenticated, authenticatedFetch } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [sortBy, setSortBy] = useState('date'); 

  const [showAiModal, setShowAiModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editTargetEvent, setEditTargetEvent] = useState(null); 
  const [reportTargetId, setReportTargetId] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGenre !== 'ALL') params.append('genre', selectedGenre);
      if (sortBy) params.append('sort', sortBy);
      if (searchTerm) params.append('keyword', searchTerm);
      params.append('_t', Date.now());

      const res = await fetch(`${API_URL}/api/events/public?${params.toString()}`); 

      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Server responded with error');
      }
    } catch (e) {
      console.error('[EventList] Fetch error:', e);
      toast.error('イベント情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [selectedGenre, sortBy, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 500); 
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const handleEventAdded = () => {
    fetchEvents();
  };

  const handleDeleteEvent = async (e, eventId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('このイベント情報を削除しますか？')) return;

    try {
      const res = await authenticatedFetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('イベントを削除しました');
        fetchEvents();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || '削除に失敗しました');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

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
      const res = await authenticatedFetch(`/api/events/${eventId}/interest`, { method: 'POST' });
      if (!res.ok) throw new Error('通信エラー');
    } catch (error) {
      console.error(error);
      toast.error('操作に失敗しました');
      fetchEvents(); 
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                  <FiCalendar size={28}/>
              </div>
              <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">イベント情報局</h1>
                  <p className="text-gray-500 text-sm font-medium">推しのイベントを探してフラスタを贈ろう</p>
              </div>
          </div>

          <div className="flex gap-3">
               <button 
                  onClick={() => isAuthenticated ? setShowManualModal(true) : toast.error('ログインが必要です')}
                  className="flex items-center px-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
               >
                  <FiPlus className="mr-2"/> 手動追加
               </button>
               <button 
                  onClick={() => isAuthenticated ? setShowAiModal(true) : toast.error('ログインが必要です')}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:scale-105 transition-all active:scale-95"
               >
                  <FiCpu className="mr-2"/> AI解析で追加
               </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest ml-1">Keyword Search</label>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 size-5"/>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="イベント名、アーティスト名、会場名..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>
            
            <div className="md:col-span-4">
              <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest ml-1">Genre / Category</label>
              <div className="relative">
                <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full pl-11 pr-8 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer transition-all font-bold text-gray-700"
                >
                  {GENRES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full py-3.5 px-4 bg-slate-800 text-white font-bold rounded-2xl outline-none cursor-pointer hover:bg-gray-900 transition-all shadow-md text-sm"
              >
                <option value="date">開催日順</option>
                <option value="newest">新着順</option>
                <option value="popular">人気順</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-white rounded-[2rem] h-80 shadow-sm border border-gray-100 animate-pulse flex flex-col">
                    <div className="h-44 bg-slate-100 rounded-t-[2rem]" />
                    <div className="p-6 space-y-3">
                        <div className="h-4 bg-slate-100 rounded w-1/4" />
                        <div className="h-6 bg-slate-100 rounded w-3/4" />
                    </div>
                 </div>
             ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
            <FiSearch size={48} className="text-slate-200 mb-4"/>
            <p className="text-gray-400 font-black text-lg uppercase tracking-widest">No Events Found</p>
            <p className="text-gray-400 text-sm mt-2">条件を変更するか、新しいイベントを教えてください</p>
            <button onClick={() => {setSearchTerm(''); setSelectedGenre('ALL');}} className="mt-6 text-indigo-600 font-black text-sm underline decoration-dotted">すべて表示する</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {events.map(event => {
                const isInterested = user && event.interests?.some(i => i.userId === user.id);
                const isOwner = user && (event.creatorId === user.id || user.role === 'ADMIN');
                const genreData = GENRES.find(g => g.id === event.genre) || GENRES[GENRES.length - 1];

                return (
                  <div key={event.id} className="group bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full relative">
                    
                    <div className="absolute top-3 right-3 z-20 flex -space-x-2">
                         {event.creator && (
                            <div className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md overflow-hidden" title={`投稿: ${event.creator.handleName}`}>
                               {event.creator.iconUrl ? <img src={event.creator.iconUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400"><FiUser size={14}/></div>}
                            </div>
                         )}
                         {event.lastEditor && event.lastEditorId !== event.creatorId && (
                           <div className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md overflow-hidden" title={`更新: ${event.lastEditor.handleName}`}>
                              {event.lastEditor.iconUrl ? <img src={event.lastEditor.iconUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-500"><FiEdit3 size={14}/></div>}
                           </div>
                         )}
                    </div>

                    <Link href={`/events/${event.id}`} className="flex-grow flex flex-col">
                        <div className={`h-44 flex items-center justify-center relative bg-gradient-to-br ${genreData.color} transition-all duration-500`}>
                            <div className="absolute top-3 left-3 bg-black/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/20 uppercase tracking-tighter">
                                {genreData.label}
                            </div>
                            <span className="text-7xl filter drop-shadow-xl opacity-90 transform group-hover:scale-110 transition-transform duration-700">
                                {event.sourceType === 'AI' ? '🤖' : event.sourceType === 'OFFICIAL' ? '🎤' : '👤'}
                            </span>
                        </div>
                        
                        <div className="p-6 flex flex-col flex-grow relative">
                            <div className="mb-2">
                                {event.sourceType === 'OFFICIAL' ? (
                                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-tighter">Official Post</span>
                                ) : (
                                  <span className="text-[10px] font-black bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg border border-gray-100 uppercase tracking-tighter">Community Contribution</span>
                                )}
                            </div>

                            <h3 className="font-bold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-4 leading-tight">
                                {event.title}
                            </h3>
                            
                            <div className="mt-auto pt-5 border-t border-gray-50 space-y-2.5">
                                <div className="flex items-center text-sm text-gray-600 font-bold">
                                    <FiCalendar className="mr-2 text-indigo-400 shrink-0" size={16}/>
                                    {new Date(event.eventDate).toLocaleString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center text-sm text-gray-500 font-medium">
                                    <FiMapPin className="mr-2 text-indigo-400 shrink-0" size={16}/>
                                    <span className="truncate">{event.venue?.venueName || '会場未定'}</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="px-6 pb-6 pt-0 flex justify-between items-center">
                        <button 
                            onClick={(e) => handleInterest(e, event.id)} 
                            className={`flex items-center text-xs font-black px-5 py-2.5 rounded-full border transition-all active:scale-95 ${
                                isInterested 
                                ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-inner' 
                                : 'bg-white border-gray-200 text-gray-400 hover:text-pink-500 hover:border-pink-200 shadow-sm'
                            }`}
                        >
                            <FiHeart className={`mr-1.5 ${isInterested ? 'fill-pink-600' : ''}`}/> {event._count?.interests || 0}
                        </button>

                        <div className="flex gap-1.5">
                            {event.sourceUrl && (
                                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 text-gray-300 hover:text-indigo-500 transition-colors bg-slate-50 rounded-xl" title="Source">
                                    <FiLink size={18}/>
                                </a>
                            )}
                            {isOwner && (
                                <>
                                    <button onClick={(e) => { e.preventDefault(); setEditTargetEvent(event); }} className="p-2.5 text-gray-300 hover:text-emerald-500 bg-slate-50 rounded-xl" title="Edit"><FiEdit3 size={18}/></button>
                                    <button onClick={(e) => handleDeleteEvent(e, event.id)} className="p-2.5 text-gray-300 hover:text-red-500 bg-slate-50 rounded-xl" title="Delete"><FiTrash2 size={18}/></button>
                                </>
                            )}
                            <button onClick={() => setReportTargetId(event.id)} className="p-2.5 text-gray-300 hover:text-red-500 bg-slate-50 rounded-xl" title="Report"><FiAlertTriangle size={18}/></button>
                        </div>
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </div>

      {showAiModal && (
        <AiAddModal 
          onClose={() => setShowAiModal(false)} 
          onAdded={handleEventAdded} 
          API_URL={API_URL}
        />
      )}
      
      {showManualModal && (
        <ManualAddModal 
          onClose={() => setShowManualModal(false)} 
          onAdded={handleEventAdded} 
          API_URL={API_URL}
        />
      )}
      
      {editTargetEvent && (
        <ManualAddModal 
          editData={editTargetEvent} 
          onClose={() => setEditTargetEvent(null)} 
          onAdded={handleEventAdded} 
          API_URL={API_URL}
        />
      )}
      
      {reportTargetId && (
        <ReportModal 
          eventId={reportTargetId} 
          onClose={() => setReportTargetId(null)} 
          API_URL={API_URL}
        />
      )}
    </div>
  );
}

function AiAddModal({ onClose, onAdded, API_URL }) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authenticatedFetch } = useAuth();

  const handleSubmit = async () => {
    if (!text) return toast.error('テキストを入力してください');
    setIsSubmitting(true);
    const toastId = toast.loading('AIが情報を解析中...');
    try {
      const res = await authenticatedFetch('/api/events/ai-parse', {
        method: 'POST',
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative border border-white/20">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"><FiX size={28}/></button>
        <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><FiCpu size={32}/></div>
            <div>
                <h3 className="text-2xl font-black text-gray-900">AI解析登録</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Automatic Event Entry</p>
            </div>
        </div>
        <div className="space-y-6">
            <textarea 
                className="w-full p-5 border border-slate-100 rounded-[1.5rem] bg-slate-50 h-40 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner" 
                placeholder="告知テキストをそのまま貼り付けてください..." 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
            />
            <input 
                className="w-full p-4 border border-slate-100 rounded-xl bg-slate-50 text-sm focus:bg-white outline-none shadow-inner" 
                placeholder="参考URL (任意)" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
            />
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center text-lg active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <FiLoader className="animate-spin mr-3"/> : <FiCheckCircle className="mr-3"/>}
              {isSubmitting ? '解析中...' : '解析して登録'}
            </button>
        </div>
      </div>
    </div>
  );
}

function ManualAddModal({ onClose, onAdded, API_URL, editData = null }) {
  const [formData, setFormData] = useState({ title: '', eventDate: '', description: '', sourceUrl: '', genre: 'OTHER' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    if (editData) {
      const d = new Date(editData.eventDate);
      const offset = d.getTimezoneOffset() * 60000;
      const localDate = new Date(d.getTime() - offset).toISOString().slice(0, 16);
      
      setFormData({
        title: editData.title || '',
        eventDate: localDate,
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
      const url = editData ? `/api/events/${editData.id}` : `/api/events/user-submit`;
      const res = await authenticatedFetch(url, {
        method: editData ? 'PATCH' : 'POST',
        body: JSON.stringify(formData)
      });
      if (res.ok) { 
        toast.success('保存完了しました！', { id: toastId }); 
        onAdded(); onClose(); 
      } else {
        throw new Error();
      }
    } catch (e) { 
      toast.error('エラーが発生しました', { id: toastId }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-fadeIn">
      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative space-y-5">
        <button type="button" onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"><FiX size={28}/></button>
        <h3 className="text-2xl font-black text-gray-900 mb-6">{editData ? 'イベント情報を編集' : 'イベントを手動登録'}</h3>
        
        <div className="space-y-4">
            <input required className="w-full p-4 border border-slate-100 bg-slate-50 rounded-xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" placeholder="イベント名" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input required type="datetime-local" className="w-full p-4 border border-slate-100 bg-slate-50 rounded-xl outline-none text-sm focus:bg-white shadow-inner" value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} />
            <select className="w-full p-4 border border-slate-100 bg-slate-50 rounded-xl outline-none text-sm font-bold shadow-inner" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})}>
               {GENRES.filter(g => g.id !== 'ALL').map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            <input className="w-full p-4 border border-slate-100 bg-slate-50 rounded-xl outline-none text-sm focus:bg-white shadow-inner" placeholder="参考URL" value={formData.sourceUrl} onChange={e => setFormData({...formData, sourceUrl: e.target.value})} />
            <textarea className="w-full p-4 border border-slate-100 bg-slate-50 rounded-xl outline-none h-28 text-sm focus:bg-white shadow-inner resize-none" placeholder="イベントの詳細や備考..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-gray-500 hover:bg-slate-200 transition-all">キャンセル</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
            {isSubmitting ? '保存中...' : '保存する'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ReportModal({ eventId, onClose, API_URL }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authenticatedFetch } = useAuth();

  const handleReport = async () => {
    if (!reason) return toast.error('理由を入力してください');
    setIsSubmitting(true);
    try {
      await authenticatedFetch(`/api/events/${eventId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      toast.success('運営へ通報しました'); onClose();
    } catch(e) { 
      toast.error('送信に失敗しました'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative border border-red-50">
        <h3 className="text-2xl font-black mb-2 text-red-600">問題を報告</h3>
        <p className="text-gray-400 text-xs font-bold mb-6">虚偽の情報や不適切な内容を報告します</p>
        <textarea className="w-full p-5 border border-red-50 rounded-[1.5rem] bg-red-50/30 mb-8 outline-none h-32 text-sm focus:bg-white focus:ring-2 focus:ring-red-200 transition-all shadow-inner" placeholder="具体的な理由を入力してください..." value={reason} onChange={(e) => setReason(e.target.value)} />
        <button onClick={handleReport} disabled={isSubmitting} className="w-full py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50">
          {isSubmitting ? '送信中...' : '報告を送信する'}
        </button>
        <button onClick={onClose} className="w-full mt-4 py-2 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors">閉じる</button>
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