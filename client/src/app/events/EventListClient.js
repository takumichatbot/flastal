'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  FiCalendar, FiMapPin, FiSearch, FiAlertTriangle, FiCheckCircle, 
  FiPlus, FiCpu, FiLink, FiX, FiFilter, FiHeart, FiLoader,
  FiEdit3, FiTrash2, FiUser, FiInfo, FiStar, FiImage, FiUpload, FiGlobe, FiTwitter, FiInstagram, FiArrowRight
} from 'react-icons/fi';
// インポートエラー回避のため、メガホンとシールドはLucideを使用
import { Megaphone, Shield } from 'lucide-react';
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

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

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
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'サーバーエラー');
      }
    } catch (e) {
      console.error('[EventList] Fetch error:', e);
      toast.error(e.message || 'イベント情報の取得に失敗しました');
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

        {/* イラスト公募バナー */}
        <Link href="/illustrators/recruitment" className="block mb-10 overflow-hidden rounded-[2rem] shadow-xl shadow-rose-100 group">
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative transition-all duration-500 group-hover:scale-[1.01]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <FiStar size={120} className="fill-white text-white" />
            </div>
            <div className="relative z-10 text-white text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <FiStar className="fill-white animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Special Recruiting</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-2">イラストレーターを募集中！</h2>
              <p className="font-bold text-white/90">フラスタのパネルや装飾のイラストを描いてくれる神絵師を主催者が探しています</p>
            </div>
            <div className="relative z-10 flex items-center gap-3 px-6 py-3 bg-white text-rose-600 font-black rounded-2xl shadow-xl shadow-rose-900/20 group-hover:bg-rose-50 transition-colors whitespace-nowrap">
              募集中のイベントを探す <FiArrowRight />
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest ml-1">キーワード検索</label>
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
              <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest ml-1">ジャンル選択</label>
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
            <p className="text-gray-400 font-black text-lg uppercase tracking-widest">見つかりませんでした</p>
            <p className="text-gray-400 text-sm mt-2">条件を変更するか、新しいイベントを教えてください</p>
            <button onClick={() => {setSearchTerm(''); setSelectedGenre('ALL');}} className="mt-6 text-indigo-600 font-black text-sm underline decoration-dotted">すべて表示する</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {events.map(event => {
                const isInterested = user && event.interests?.some(i => i.userId === user.id);
                const isOwner = user && (event.creatorId === user.id || user.role === 'ADMIN');
                const genreData = GENRES.find(g => g.id === event.genre) || GENRES[GENRES.length - 1];
                
                const isOfficial = event.sourceType === 'OFFICIAL' || 
                                 (event.creator && (['ADMIN', 'VENUE', 'ORGANIZER'].includes(event.creator.role)));
                
                // ★ 追加: 現在時刻と比較して過去のイベントか判定
                const isPastEvent = new Date(event.eventDate) < new Date();

                return (
                  // ★ 修正: 過去のイベントの場合は opacity-80 で少し薄くする
                  <div key={event.id} className={cn("group bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden transition-all duration-500 flex flex-col h-full relative", isPastEvent ? "opacity-75" : "hover:shadow-2xl hover:-translate-y-2")}>
                    
                    <div className="absolute top-3 right-3 z-20 flex -space-x-2">
                         {event.creator && (
                            <div className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md overflow-hidden" title={`投稿: ${event.creator.handleName}`}>
                               {event.creator.iconUrl ? <img src={event.creator.iconUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400"><FiUser size={14}/></div>}
                            </div>
                         )}
                         {event.lastEditor && event.lastEditorId !== event.creatorId && (
                           <div className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md overflow-hidden" title={`最終更新: ${event.lastEditor.handleName}`}>
                              {event.lastEditor.iconUrl ? <img src={event.lastEditor.iconUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-500"><FiEdit3 size={14}/></div>}
                           </div>
                         )}
                    </div>

                    <Link href={`/events/${event.id}`} className="flex-grow flex flex-col">
                        {/* ★ 修正: 過去イベントの画像は少し彩度を下げる (grayscale) */}
                        <div className={cn("h-44 flex items-center justify-center relative bg-slate-100 transition-all duration-700 overflow-hidden", isPastEvent && "grayscale-[0.6]")}>
                            {event.imageUrls && event.imageUrls.length > 0 ? (
                              <img 
                                src={event.imageUrls[0]} 
                                alt={event.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                              />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${genreData.color} flex items-center justify-center`}>
                                <span className="text-6xl filter drop-shadow-2xl opacity-90 transform group-hover:scale-125 group-hover:rotate-6 transition-all duration-700 ease-out">
                                    {event.sourceType === 'AI' ? '🤖' : isOfficial ? '🎤' : '👤'}
                                </span>
                              </div>
                            )}
                            
                            {/* ★ 修正: 終了バッジの追加 */}
                            <div className="absolute top-4 left-4 flex flex-col items-start gap-1">
                                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/30 uppercase tracking-widest shadow-sm">
                                    {genreData.label}
                                </span>
                                {isPastEvent && (
                                  <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-slate-700 uppercase tracking-widest shadow-sm">
                                      終了
                                  </span>
                                )}
                            </div>
                            
                            {event.isIllustratorRecruiting && !isPastEvent && (
                                <div className="absolute bottom-4 right-4 bg-rose-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 animate-pulse">
                                    <FiStar size={8} className="fill-white"/> 絵師募集中
                                </div>
                            )}
                        </div>
                        
                        <div className="p-7 flex flex-col flex-grow relative bg-white">
                            <div className="mb-4">
                                {isOfficial ? (
                                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest flex items-center w-fit shadow-sm">
                                    <Shield size={10} className="mr-1.5 fill-indigo-600"/> 公式・主催者
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black bg-slate-50 text-slate-500 px-3 py-1.5 rounded-full border border-slate-100 uppercase tracking-widest flex items-center w-fit">
                                    <FiUser className="mr-1.5"/> ユーザー投稿
                                  </span>
                                )}
                            </div>

                            <h3 className={cn("font-bold text-xl transition-colors line-clamp-2 mb-5 leading-snug", isPastEvent ? "text-slate-500" : "text-gray-900 group-hover:text-indigo-600")}>
                                {event.title}
                            </h3>
                            
                            <div className="mt-auto pt-6 border-t border-slate-50 space-y-3">
                                <div className={cn("flex items-center text-sm font-bold", isPastEvent ? "text-slate-400" : "text-slate-600")}>
                                    <FiCalendar className={cn("mr-3 shrink-0", isPastEvent ? "text-slate-400" : "text-indigo-500")} size={18}/>
                                    {new Date(event.eventDate).toLocaleString('ja-JP', { 
                                      month: 'long', 
                                      day: 'numeric', 
                                      weekday: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                </div>
                                <div className={cn("flex items-center text-sm font-medium", isPastEvent ? "text-slate-400" : "text-slate-500")}>
                                    <FiMapPin className={cn("mr-3 shrink-0", isPastEvent ? "text-slate-400" : "text-indigo-500")} size={18}/>
                                    <span className="truncate">{event.venue?.venueName || '会場未定'}</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="px-7 pb-7 pt-2 flex justify-between items-center bg-white">
                        <button 
                            onClick={(e) => handleInterest(e, event.id)} 
                            disabled={isPastEvent}
                            className={`flex items-center text-xs font-black px-6 py-3 rounded-full border transition-all duration-300 ${
                                isInterested && !isPastEvent
                                ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-md shadow-pink-100 active:scale-90' 
                                : isPastEvent
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-white border-slate-200 text-slate-400 hover:text-pink-500 hover:border-pink-200 hover:shadow-lg active:scale-90'
                            }`}
                        >
                            <FiHeart className={`mr-2 size-4 ${isInterested && !isPastEvent ? 'fill-pink-600' : ''}`}/> {event._count?.interests || 0}
                        </button>

                        <div className="flex gap-2">
                            {event.sourceUrl && (
                                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-2xl border border-transparent hover:border-indigo-100" title="公式サイト">
                                    <FiLink size={20}/>
                                </a>
                            )}
                            {isOwner && (
                                <>
                                    <button onClick={(e) => { e.preventDefault(); setEditTargetEvent(event); }} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-2xl border border-transparent hover:border-emerald-100" title="編集"><FiEdit3 size={20}/></button>
                                    <button onClick={(e) => handleDeleteEvent(e, event.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-2xl border border-transparent hover:border-red-100" title="削除"><FiTrash2 size={20}/></button>
                                </>
                            )}
                            <button className="p-3 text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all rounded-2xl border border-transparent hover:border-orange-100" title="報告"><FiAlertTriangle size={20}/></button>
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
        />
      )}
      
      {showManualModal && (
        <ManualAddModal 
          onClose={() => setShowManualModal(false)} 
          onAdded={handleEventAdded} 
        />
      )}
      
      {editTargetEvent && (
        <ManualAddModal 
          editData={editTargetEvent} 
          onClose={() => setEditTargetEvent(null)} 
          onAdded={handleEventAdded} 
        />
      )}
    </div>
  );
}

function ImageUploadArea({ images, setImages, isUploading, setIsUploading }) {
  const { authenticatedFetch } = useAuth();

  const uploadToS3 = async (file) => {
    const res = await authenticatedFetch('/api/tools/s3-upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, fileType: file.type })
    });
    if (!res.ok) throw new Error('署名取得失敗');
    const { uploadUrl, fileUrl } = await res.json();

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    return new Promise((resolve, reject) => {
      xhr.onload = () => xhr.status === 200 ? resolve(fileUrl) : reject();
      xhr.onerror = () => reject();
      xhr.send(file);
    });
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const url = await uploadToS3(file);
        urls.push(url);
      }
      setImages([...images, ...urls]);
    } catch (err) {
      toast.error('画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImg = (idx) => setImages(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">イベント画像 (複数選択可)</label>
      <div className="grid grid-cols-4 gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-100 group">
            <img src={url} className="w-full h-full object-cover" alt="" />
            <button type="button" onClick={() => removeImg(i)} className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"><FiX size={12}/></button>
          </div>
        ))}
        <label className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
          {isUploading ? <FiLoader className="animate-spin text-indigo-500"/> : <FiUpload className="text-slate-400"/>}
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} disabled={isUploading} />
        </label>
      </div>
    </div>
  );
}

function AiAddModal({ onClose, onAdded }) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { authenticatedFetch } = useAuth();

  const handleSubmit = async () => {
    if (!text) return toast.error('解析するテキストを入力してください');
    setIsSubmitting(true);
    const toastId = toast.loading('AIが情報を解析して登録中...');
    try {
      const res = await authenticatedFetch('/api/events/ai-parse', {
        method: 'POST',
        body: JSON.stringify({ text, sourceUrl: url, imageUrls: images })
      });
      if (!res.ok) throw new Error('解析失敗');
      toast.success(`追加しました！`, { id: toastId });
      onAdded(); onClose();
    } catch (e) {
      toast.error('エラーが発生しました', { id: toastId });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-white/20 max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10 p-2">
          <FiX size={28}/>
        </button>
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><FiCpu size={28}/></div>
            <div>
                <h3 className="text-xl font-black text-gray-900">AI解析登録</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Automatic Event Entry</p>
            </div>
        </div>
        <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <p className="text-[11px] text-amber-700 leading-relaxed font-bold">
                公式の告知ツイートやサイトの文章をそのまま貼り付けてください。AIが名前・日付・場所を自動で判別します。
              </p>
            </div>
            <textarea 
                className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 h-40 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner" 
                placeholder="ここに告知テキストをペーストしてください..." 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
            />
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">情報元のURL (任意)</label>
              <input 
                  className="w-full p-4 border border-slate-100 rounded-xl bg-slate-50 text-sm focus:bg-white outline-none shadow-inner" 
                  placeholder="https://..." 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
              />
            </div>
            
            <ImageUploadArea images={images} setImages={setImages} isUploading={isUploading} setIsUploading={setIsUploading} />

            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || isUploading || !text} 
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center text-lg active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <FiLoader className="animate-spin mr-3"/> : <FiCheckCircle className="mr-3"/>}
              {isSubmitting ? 'AI解析中...' : '解析してイベントを登録'}
            </button>
            <p className="text-[10px] text-center text-gray-400">
              ※AIによる抽出のため、登録後に詳細画面から情報の修正をお願いする場合があります。
            </p>
        </div>
      </div>
    </div>
  );
}

function ManualAddModal({ onClose, onAdded, editData = null }) {
  const [formData, setFormData] = useState({ title: '', eventDate: '', description: '', genre: 'OTHER', sourceUrl: '', venueId: '' });
  const [images, setImages] = useState([]);
  const [venues, setVenues] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues`);
        if (res.ok) {
          const data = await res.json();
          setVenues(Array.isArray(data) ? data : (data.venues || []));
        }
      } catch (e) {
        console.error("会場の取得に失敗:", e);
      }
    };
    fetchVenues();
  }, []);

  useEffect(() => {
    if (editData) {
      const date = new Date(editData.eventDate);
      const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      
      setFormData({
        title: editData.title || '',
        eventDate: localISO,
        description: editData.description || '',
        genre: editData.genre || 'OTHER',
        sourceUrl: editData.sourceUrl || '',
        venueId: editData.venueId || ''
      });
      setImages(editData.imageUrls || []);
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.venueId) return toast.error('会場を選択してください');
    
    setIsSubmitting(true);
    try {
      const url = editData ? `/api/events/${editData.id}` : `/api/events/user-submit`;
      const res = await authenticatedFetch(url, {
        method: editData ? 'PATCH' : 'POST',
        body: JSON.stringify({ 
          ...formData,
          imageUrls: images 
        })
      });
      if (res.ok) { 
        toast.success('保存しました'); 
        onAdded(); onClose(); 
      } else {
        const errData = await res.json();
        throw new Error(errData.message || '登録エラー');
      }
    } catch (e) { 
      toast.error(e.message || 'エラーが発生しました'); 
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10 p-2">
          <FiX size={28}/>
        </button>
        
        <h3 className="text-2xl font-black mb-6 text-gray-900">{editData ? 'イベント編集' : 'イベント手動登録'}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">イベント名</label>
            <input required className="w-full p-4 border border-slate-100 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm" placeholder="イベント名を入力" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">開催会場</label>
            <select required className="w-full p-4 border border-slate-100 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm appearance-none cursor-pointer" value={formData.venueId} onChange={e => setFormData({...formData, venueId: e.target.value})}>
              <option value="">会場を選択してください</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.venueName}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">開催日時</label>
                <input required type="datetime-local" className="w-full p-3 border border-slate-100 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-xs" value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">ジャンル</label>
                <select className="w-full p-3 border border-slate-100 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-xs" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})}>
                  {GENRES.filter(g => g.id !== 'ALL').map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>
          </div>
          
          <ImageUploadArea images={images} setImages={setImages} isUploading={isUploading} setIsUploading={setIsUploading} />

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">公式サイトURL (任意)</label>
            <input className="w-full p-4 border border-slate-100 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm" placeholder="https://..." value={formData.sourceUrl} onChange={e => setFormData({...formData, sourceUrl: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">イベント詳細・説明</label>
            <textarea className="w-full p-4 border border-slate-100 bg-slate-50 rounded-xl outline-none h-24 resize-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm" placeholder="詳細を入力してください" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <button type="submit" disabled={isSubmitting || isUploading} className="w-full mt-6 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all">
            {isSubmitting ? <FiLoader className="animate-spin inline mr-2"/> : null}
            {editData ? '更新を保存する' : 'イベントを登録する'}
          </button>
        </form>
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