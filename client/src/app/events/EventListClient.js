'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  FiCalendar, FiMapPin, FiSearch, FiAlertTriangle, FiCheckCircle, 
  FiPlus, FiCpu, FiLink, FiX, FiInfo, FiFilter, FiHeart, FiLoader,
  FiEdit3, FiTrash2, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ジャンル定義 (色設定追加)
const GENRES = [
  { id: 'ALL', label: 'すべて', color: 'from-gray-500 to-slate-500' },
  { id: 'IDOL', label: 'アイドル', color: 'from-pink-400 to-rose-500' },
  { id: 'VTUBER', label: 'VTuber', color: 'from-sky-400 to-blue-500' },
  { id: 'MUSIC', label: '音楽・バンド', color: 'from-purple-400 to-indigo-500' },
  { id: 'ANIME', label: 'アニメ・声優', color: 'from-orange-400 to-red-500' },
  { id: 'STAGE', label: '舞台・演劇', color: 'from-emerald-400 to-teal-500' },
  { id: 'OTHER', label: 'その他', color: 'from-gray-400 to-slate-500' },
];

export default function EventListClient() {
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
  const [editTargetEvent, setEditTargetEvent] = useState(null); // 編集用
  const [reportTargetId, setReportTargetId] = useState(null);

  // データ取得関数
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGenre !== 'ALL') params.append('genre', selectedGenre);
      if (sortBy) params.append('sort', sortBy);
      if (searchTerm) params.append('keyword', searchTerm);

      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            
            {/* タイトル */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <FiCalendar size={24}/>
                </div>
                <div>
                    <h1 className="text-xl font-extrabold text-gray-900 leading-tight">イベント情報局</h1>
                    <p className="text-[10px] text-gray-500 font-bold hidden sm:block">推しのイベントを探してフラスタを贈ろう</p>
                </div>
            </div>

            {/* フィルター＆検索 */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center justify-end">
                <div className="relative flex-grow lg:flex-grow-0 w-full sm:w-auto min-w-[200px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text"
                        placeholder="イベント名・会場名..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
                    />
                </div>
                
                <div className="relative">
                    <select 
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none hover:bg-gray-50 transition-colors"
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

            {/* 追加ボタン群 */}
            <div className="flex gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 border-gray-100 pt-3 lg:pt-0">
                 <button 
                    onClick={() => isAuthenticated ? setShowManualModal(true) : toast.error('ログインが必要です')}
                    className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-indigo-600 transition-colors text-xs whitespace-nowrap shadow-sm"
                 >
                    <FiPlus className="mr-1.5 size-4"/> 手動追加
                 </button>
                 <button 
                    onClick={() => isAuthenticated ? setShowAiModal(true) : toast.error('ログインが必要です')}
                    className="flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all text-xs whitespace-nowrap"
                 >
                    <FiCpu className="mr-1.5 size-4"/> AI解析で追加
                 </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. リストエリア */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[...Array(6)].map((_, i) => (
                 <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse">
                     <div className="h-32 bg-gray-200 rounded-t-2xl"></div>
                     <div className="p-4 space-y-3">
                         <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                         <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                     </div>
                 </div>
             ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <FiSearch size={32}/>
            </div>
            <p className="text-gray-600 font-bold text-lg mb-2">イベントが見つかりませんでした</p>
            <p className="text-sm text-gray-400 mb-6">条件を変更するか、新しいイベントを追加してください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {events.map(event => {
                const isInterested = user && event.interests?.some(i => i.userId === user.id);
                const isCreator = user && event.creatorId === user.id;
                const isAdmin = user && user.role === 'ADMIN';
                const genreColor = GENRES.find(g => g.id === event.genre)?.color || 'from-gray-400 to-slate-500';

                return (
                  <div key={event.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full relative">
                    
                    {/* 作成者・編集者アイコン (承認欲求セクション) */}
                    {(event.creator || event.lastEditor) && (
                      <div className="absolute top-2 right-2 z-20 flex -space-x-2">
                         {event.creator && (
                           <div className="relative group/user" title={`投稿者: ${event.creator.handleName}`}>
                              {event.creator.iconUrl ? (
                                <img src={event.creator.iconUrl} alt="creator" className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 text-indigo-500 flex items-center justify-center shadow-sm">
                                  <FiUser size={14} />
                                </div>
                              )}
                              <span className="absolute -bottom-8 right-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/user:opacity-100 whitespace-nowrap transition-opacity">
                                投稿者: {event.creator.handleName}
                              </span>
                           </div>
                         )}
                         {event.lastEditor && event.lastEditorId !== event.creatorId && (
                           <div className="relative group/user" title={`更新者: ${event.lastEditor.handleName}`}>
                              {event.lastEditor.iconUrl ? (
                                <img src={event.lastEditor.iconUrl} alt="editor" className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 text-emerald-500 flex items-center justify-center shadow-sm">
                                  <FiEdit3 size={14} />
                                </div>
                              )}
                              <span className="absolute -bottom-8 right-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/user:opacity-100 whitespace-nowrap transition-opacity">
                                更新者: {event.lastEditor.handleName}
                              </span>
                           </div>
                         )}
                      </div>
                    )}

                    <Link href={`/events/${event.id}`} className="flex-grow flex flex-col">
                        <div className={`h-40 flex items-center justify-center relative bg-gradient-to-r ${genreColor} transition-all`}>
                            <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                                {GENRES.find(g => g.id === event.genre)?.label || event.genre}
                            </div>
                            <span className="text-6xl filter drop-shadow-lg opacity-90 transform group-hover:scale-110 transition-transform duration-500">
                                {event.sourceType === 'AI' ? '🤖' : event.sourceType === 'USER' ? '👤' : '🎤'}
                            </span>
                            {(event._count?.interests > 0) && (
                                <div className="absolute bottom-3 right-3 flex items-center bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-pink-600 shadow-sm">
                                    <FiHeart className="mr-1 fill-pink-600"/> {event._count.interests}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-5 flex flex-col flex-grow">
                            <div className="mb-2 flex items-center gap-2">
                                {event.sourceType === 'OFFICIAL' && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">OFFICIAL</span>}
                                {event.sourceType === 'AI' && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 flex items-center"><FiCpu className="mr-1"/> AI解析</span>}
                                {event.sourceType === 'USER' && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">ユーザー投稿</span>}
                            </div>

                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3 leading-snug">
                                {event.title}
                            </h3>
                            
                            <div className="mt-auto pt-4 border-t border-gray-50 space-y-2.5 text-sm text-gray-600">
                                <div className="flex items-start">
                                    <FiCalendar className="mr-2.5 text-gray-400 mt-0.5 shrink-0"/>
                                    <span className="font-medium">
                                        {new Date(event.eventDate).toLocaleString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex items-start">
                                    <FiMapPin className="mr-2.5 text-gray-400 mt-0.5 shrink-0"/>
                                    <span className="truncate font-medium">{event.venue ? event.venue.venueName : '会場未定'}</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* アクションフッター */}
                    <div className="px-5 pb-5 pt-0 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <button 
                                onClick={(e) => handleInterest(e, event.id)}
                                className={`flex items-center text-xs font-bold px-4 py-2 rounded-full transition-all border shadow-sm active:scale-95 ${
                                    isInterested 
                                    ? 'bg-pink-50 border-pink-200 text-pink-600' 
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-pink-50 hover:text-pink-500 hover:border-pink-200'
                                }`}
                            >
                                <FiHeart className={`mr-1.5 ${isInterested ? 'fill-pink-600' : ''}`}/>
                                {isInterested ? '気になる!' : '気になる'}
                            </button>

                            <div className="flex gap-3 text-xs text-gray-400 font-medium">
                                {event.sourceUrl && (
                                    <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-blue-500 flex items-center hover:underline">
                                        <FiLink className="mr-1"/>元記事
                                    </a>
                                )}
                                <button 
                                    onClick={() => isAuthenticated ? setReportTargetId(event.id) : toast.error('ログインが必要です')}
                                    className="hover:text-red-500 flex items-center hover:underline"
                                >
                                    <FiAlertTriangle className="mr-1"/>通報
                                </button>
                            </div>
                        </div>

                        {/* 編集・削除ボタン (投稿者または管理者のみ) */}
                        {(isCreator || isAdmin) && (
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                             <button 
                               onClick={(e) => { e.preventDefault(); setEditTargetEvent(event); }}
                               className="flex-grow flex items-center justify-center py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                             >
                                <FiEdit3 className="mr-1"/> 編集
                             </button>
                             <button 
                               onClick={(e) => handleDeleteEvent(e, event.id)}
                               className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                             >
                                <FiTrash2 />
                             </button>
                          </div>
                        )}
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </div>

      {/* モーダルコンポーネント */}
      {showAiModal && <AiAddModal onClose={() => setShowAiModal(false)} onAdded={handleEventAdded} />}
      {showManualModal && <ManualAddModal onClose={() => setShowManualModal(false)} onAdded={handleEventAdded} />}
      {editTargetEvent && (
        <ManualAddModal 
          editData={editTargetEvent} 
          onClose={() => setEditTargetEvent(null)} 
          onAdded={handleEventAdded} 
        />
      )}
      {reportTargetId && <ReportModal eventId={reportTargetId} onClose={() => setReportTargetId(null)} />}

    </div>
  );
}

// ----------------------------------------------
// サブコンポーネント: AI追加モーダル
// ----------------------------------------------
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

      if (!res.ok) throw new Error('解析に失敗しました');
      
      const data = await res.json();
      const newEvent = data.event || data; 
      
      toast.success(`「${newEvent.title || 'イベント'}」を追加しました！`, { id: toastId });
      onAdded();
      onClose();

    } catch (e) {
      console.error(e);
      toast.error('解析エラーが発生しました。時間を置いてお試しください。', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative border border-white/20">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><FiX size={24}/></button>
        
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                <FiCpu size={24}/>
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-800">AI自動登録</h3>
                <p className="text-xs text-gray-500 font-bold">テキストからイベント情報を抽出します</p>
            </div>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-xl mb-6 text-sm text-indigo-800 border border-indigo-100 leading-relaxed">
            <p className="font-bold mb-1 flex items-center gap-1"><FiInfo className="inline"/> 使い方</p>
            X(Twitter)の告知ポストや、ニュースサイトの本文をそのまま貼り付けてください。AIが自動で日時・場所を読み取ります。
        </div>
        
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">イベント情報のテキスト</label>
                <textarea 
                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 h-32 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="例: 【重大発表】2025年12月25日(土) 日本武道館にて「クリスマススペシャルライブ」開催決定！開場17:00 開演18:00..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">情報元のURL (任意)</label>
                <input 
                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                />
            </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors">キャンセル</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !text}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:transform-none transition-all text-sm flex items-center"
          >
            {isSubmitting ? <><FiLoader className="animate-spin mr-2"/> 解析中...</> : '解析して登録'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------
// サブコンポーネント: 手動追加・編集モーダル
// ----------------------------------------------
function ManualAddModal({ onClose, onAdded, editData = null }) {
  const [formData, setFormData] = useState({ 
    title: '', 
    eventDate: '', 
    description: '', 
    sourceUrl: '', 
    genre: 'OTHER' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集モードの場合の初期化
  useEffect(() => {
    if (editData) {
      // 日時をdatetime-local形式に変換
      const d = new Date(editData.eventDate);
      const formattedDate = d.toISOString().slice(0, 16);
      
      setFormData({
        title: editData.title || '',
        eventDate: formattedDate,
        description: editData.description || '',
        sourceUrl: editData.sourceUrl || '',
        genre: editData.genre || 'OTHER'
      });
    }
  }, [editData]);

  const isFormValid = formData.title.trim() !== '' && formData.eventDate !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    const toastId = toast.loading(editData ? '更新中...' : '登録中...');
    
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const url = editData ? `${API_URL}/api/events/${editData.id}` : `${API_URL}/api/events/user-submit`;
      const method = editData ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editData ? '更新しました！' : 'イベントを登録しました！', { id: toastId });
        onAdded();
        onClose();
      } else {
        throw new Error('処理に失敗しました');
      }
    } catch (e) { 
        toast.error('エラーが発生しました', { id: toastId }); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><FiX size={24}/></button>
        
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${editData ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                {editData ? <FiEdit3 size={24}/> : <FiPlus size={24}/>}
            </div>
            <h3 className="text-xl font-bold text-gray-800">{editData ? 'イベント情報を編集' : '手動でイベントを追加'}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">イベント名 <span className="text-red-500">*</span></label>
              <input required className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                onChange={e => setFormData({...formData, title: e.target.value})} value={formData.title} placeholder="イベント名を入力" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">開催日時 <span className="text-red-500">*</span></label>
                <input required type="datetime-local" className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" 
                    onChange={e => setFormData({...formData, eventDate: e.target.value})} value={formData.eventDate} />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">ジャンル</label>
                <select className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm appearance-none"
                    onChange={e => setFormData({...formData, genre: e.target.value})} value={formData.genre}>
                    {GENRES.filter(g => g.id !== 'ALL').map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
            </div>
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">詳細・備考</label>
              <textarea className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl h-24 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm resize-none" 
                onChange={e => setFormData({...formData, description: e.target.value})} value={formData.description} placeholder="補足情報があれば入力してください" />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">情報元URL</label>
              <input className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="https://..."
                onChange={e => setFormData({...formData, sourceUrl: e.target.value})} value={formData.sourceUrl} />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors">キャンセル</button>
            <button type="submit" disabled={isSubmitting || !isFormValid} 
                className={`px-8 py-3 font-bold rounded-xl transition-all shadow-md text-sm ${isSubmitting || !isFormValid ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg'}`}>
                {isSubmitting ? '処理中...' : (editData ? '更新する' : '登録する')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------
// サブコンポーネント: 通報モーダル
// ----------------------------------------------
function ReportModal({ eventId, onClose }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    if (!reason) return toast.error('理由を入力してください');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/events/${eventId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        toast.success('運営に通報しました');
        onClose();
      } else {
        toast.error('送信エラー');
      }
    } catch(e) { toast.error('送信エラー'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border border-red-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><FiX size={24}/></button>
        
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-50 text-red-500 rounded-full">
                <FiAlertTriangle size={24}/>
            </div>
            <h3 className="text-xl font-bold text-gray-800">問題を報告</h3>
        </div>

        <p className="text-sm text-gray-500 mb-4 font-medium">虚偽の情報や、既に中止・延期になったイベントなどを報告してください。</p>
        
        <textarea 
          className="w-full p-4 border border-red-100 rounded-xl bg-red-50 text-sm h-32 focus:bg-white focus:border-red-300 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none placeholder-red-300"
          placeholder="例：公式から中止の発表がありました / 日付が間違っています"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-500 text-sm font-bold hover:bg-gray-100 rounded-xl transition-colors">キャンセル</button>
          <button onClick={handleReport} disabled={isSubmitting} className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 hover:shadow-lg transition-all shadow-md">報告する</button>
        </div>
      </div>
    </div>
  );
}