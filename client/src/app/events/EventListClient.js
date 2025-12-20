'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  FiCalendar, FiMapPin, FiSearch, FiAlertTriangle, FiCheckCircle, 
  FiPlus, FiCpu, FiLink, FiX, FiInfo, FiFilter, FiHeart 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ジャンル定義
const GENRES = [
  { id: 'ALL', label: 'すべて' },
  { id: 'IDOL', label: 'アイドル' },
  { id: 'VTUBER', label: 'VTuber' },
  { id: 'MUSIC', label: '音楽・バンド' },
  { id: 'ANIME', label: 'アニメ・声優' },
  { id: 'STAGE', label: '舞台・演劇' },
  { id: 'OTHER', label: 'その他' },
];

export default function EventListClient() {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'popular' | 'newest'

  // モーダル状態
  const [showAiModal, setShowAiModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);

  // データ取得関数
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // クエリパラメータの構築
      const params = new URLSearchParams();
      if (selectedGenre !== 'ALL') params.append('genre', selectedGenre);
      if (sortBy) params.append('sort', sortBy);
      if (searchTerm) params.append('keyword', searchTerm);

      const res = await fetch(`${API_URL}/api/events/public?${params.toString()}`, {
        // トークンがあればヘッダーに付与（自分の「興味あり」状態を取得するため）
        headers: isAuthenticated ? { 
            'Authorization': `Bearer ${localStorage.getItem('authToken')?.replace(/^"|"$/g, '')}` 
        } : {}
      }); 

      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (e) {
      console.error(e);
      toast.error('イベント情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [selectedGenre, sortBy, searchTerm, isAuthenticated]);

  // 初回ロード＆フィルタ変更時にデータ取得（検索はデバウンス）
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 500); // 0.5秒待ってから検索実行
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  // 即時反映用ハンドラー
  const handleEventAdded = () => {
    fetchEvents();
  };

  // 興味ありボタンのハンドラー
  const handleInterest = async (e, eventId) => {
    e.preventDefault(); // リンク遷移を防ぐ
    if (!isAuthenticated) return toast.error('ログインが必要です');

    // 楽観的UI更新（サーバー応答を待たずに見た目だけ変える）
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        // 現在の状態を反転
        // 注: API側で interests: [{ userId: ... }] という形で返ってくる想定
        const isInterested = ev.interests && ev.interests.length > 0;
        
        // カウントの増減
        const newCount = isInterested 
            ? (ev._count.interests - 1) 
            : (ev._count.interests + 1);
        
        // 配列の更新（自分のIDがあるかないかを切り替え）
        const newInterests = isInterested 
            ? [] // 解除時は空にする（またはフィルタリング）
            : [{ userId: user.id }]; // 登録時は自分のIDを入れる
        
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
      fetchEvents(); // 失敗したら元に戻すために再取得
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* ヘッダーエリア */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* タイトル */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 flex items-center">
                    <span className="text-3xl mr-2">📅</span> イベント情報局
                </h1>
                <p className="text-xs text-gray-500 mt-1 hidden md:block">推しのイベントを探してフラスタを贈ろう</p>
            </div>

            {/* フィルター＆検索 */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                {/* 検索 */}
                <div className="relative flex-grow md:flex-grow-0 w-full md:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text"
                        placeholder="イベント名・会場名..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                </div>
                
                {/* ジャンル */}
                <select 
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                    {GENRES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>

                {/* 並び替え */}
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                    <option value="date">開催日順</option>
                    <option value="newest">新着順</option>
                    <option value="popular">人気順</option>
                </select>
            </div>

            {/* 追加ボタン */}
            <div className="flex gap-2 w-full md:w-auto justify-end">
                 <button 
                    onClick={() => isAuthenticated ? setShowManualModal(true) : toast.error('ログインが必要です')}
                    className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-xs whitespace-nowrap"
                 >
                    <FiPlus className="mr-1"/> 手動追加
                 </button>
                 <button 
                    onClick={() => isAuthenticated ? setShowAiModal(true) : toast.error('ログインが必要です')}
                    className="flex items-center px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow hover:shadow-md transition-all text-xs whitespace-nowrap"
                 >
                    <FiCpu className="mr-1"/> AI解析
                 </button>
            </div>
          </div>
        </div>
      </div>

      {/* リストエリア */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20 text-gray-500">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
             読み込み中...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-500 font-bold mb-2">イベントが見つかりませんでした。</p>
            <p className="text-sm text-gray-400">条件を変えるか、新しく追加してみてください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {events.map(event => {
                // 自分が「興味あり」しているか判定 (interests配列に自分のIDがあるか)
                // 注: API実装によっては `event.isInterested` のようなフラグで返す場合もありますが、
                // ここでは `include: { interests: { select: { userId: true } } }` の形を想定
                const isInterested = user && event.interests?.some(i => i.userId === user.id);

                return (
                  <div key={event.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full relative">
                    
                    <Link href={`/events/${event.id}`} className="flex-grow flex flex-col">
                        {/* サムネイル */}
                        <div className={`h-36 flex items-center justify-center relative ${event.sourceType === 'OFFICIAL' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-slate-400 to-slate-500'}`}>
                            
                            {/* ジャンルバッジ */}
                            {event.genre && (
                                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                                    {GENRES.find(g => g.id === event.genre)?.label || event.genre}
                                </div>
                            )}

                            {/* アイコン */}
                            <span className="text-5xl filter drop-shadow-lg">
                                {event.sourceType === 'AI' ? '🤖' : event.sourceType === 'USER' ? '👤' : '🎤'}
                            </span>
                            
                            {/* 興味あり数バッジ */}
                            {(event._count?.interests > 0) && (
                                <div className="absolute bottom-3 right-3 flex items-center bg-white/90 px-2 py-1 rounded-full text-xs font-bold text-pink-500 shadow-sm">
                                    <FiHeart className="mr-1 fill-pink-500"/> {event._count.interests}
                                </div>
                            )}

                            {/* フラスタOK/NGバッジ (公式のみ) */}
                            {event.sourceType === 'OFFICIAL' && (
                                <div className="absolute bottom-3 left-3">
                                    {event.isStandAllowed ? (
                                        <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center"><FiCheckCircle className="mr-1"/> フラスタOK</span>
                                    ) : (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center"><FiAlertTriangle className="mr-1"/> フラスタNG</span>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-5 flex flex-col flex-grow">
                            <div className="mb-2 flex items-center gap-2">
                                {/* ソース表示バッジ */}
                                {event.sourceType === 'OFFICIAL' && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">公式情報</span>}
                                {event.sourceType === 'AI' && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 flex items-center"><FiCpu className="mr-1"/>AI解析</span>}
                                {event.sourceType === 'USER' && <span className="text-[10px] font-bold bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-100">ユーザー投稿</span>}
                            </div>

                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
                                {event.title}
                            </h3>
                            
                            <div className="mt-auto pt-4 border-t border-gray-50 space-y-2 text-sm text-gray-500">
                                <div className="flex items-center">
                                    <FiCalendar className="mr-2 text-indigo-400 shrink-0"/>
                                    <span>
                                        {new Date(event.eventDate).toLocaleString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <FiMapPin className="mr-2 text-indigo-400 shrink-0"/>
                                    <span className="truncate">{event.venue ? event.venue.venueName : '会場未定'}</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* アクションフッター */}
                    <div className="px-5 pb-4 pt-0 flex justify-between items-center">
                        <button 
                            onClick={(e) => handleInterest(e, event.id)}
                            className={`flex items-center text-sm font-bold px-3 py-1.5 rounded-full transition-all border ${
                                isInterested 
                                ? 'bg-pink-50 border-pink-200 text-pink-600' 
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-pink-50 hover:text-pink-500 hover:border-pink-200'
                            }`}
                        >
                            <FiHeart className={`mr-1.5 ${isInterested ? 'fill-pink-600' : ''}`}/>
                            {isInterested ? '興味あり！' : '興味あり'}
                        </button>

                        <div className="flex gap-3 text-xs text-gray-400">
                            {event.sourceUrl && (
                                <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-blue-500 flex items-center z-10">
                                    <FiLink className="mr-1"/>元記事
                                </a>
                            )}
                            <button 
                                onClick={() => isAuthenticated ? setReportTargetId(event.id) : toast.error('ログインが必要です')}
                                className="hover:text-red-500 flex items-center z-10"
                            >
                                <FiAlertTriangle className="mr-1"/>通報
                            </button>
                        </div>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24}/></button>
        <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800"><FiCpu className="mr-2 text-indigo-600"/> AI自動登録</h3>
        
        <div className="bg-indigo-50 p-3 rounded-lg mb-4 text-sm text-indigo-800 border border-indigo-100">
            <FiInfo className="inline mr-1"/>
            X(Twitter)の告知ポストや、ニュースサイトの本文をそのまま貼り付けてください。AIが自動で日時・場所を読み取ります。
        </div>
        
        <label className="block text-sm font-bold text-gray-700 mb-1">イベント情報のテキスト</label>
        <textarea 
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="例: 【重大発表】2025年12月25日(土) 日本武道館にて「クリスマススペシャルライブ」開催決定！開場17:00 開演18:00..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <label className="block text-sm font-bold text-gray-700 mb-1">情報元のURL (任意)</label>
        <input 
          className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">キャンセル</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !text}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {isSubmitting ? '解析中...' : '解析して登録'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------
// サブコンポーネント: 手動追加モーダル (ジャンル選択付き)
// ----------------------------------------------
function ManualAddModal({ onClose, onAdded }) {
  const [formData, setFormData] = useState({ title: '', eventDate: '', description: '', sourceUrl: '', genre: 'OTHER' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormValid = formData.title.trim() !== '' && formData.eventDate !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    const toastId = toast.loading('登録中...');
    
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/events/user-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success('イベントを登録しました！', { id: toastId });
        onAdded();
        onClose();
      } else {
        throw new Error('登録失敗');
      }
    } catch (e) { 
        toast.error('エラーが発生しました', { id: toastId }); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24}/></button>
        <h3 className="text-xl font-bold mb-4 text-gray-800">手動でイベントを追加</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">イベント名 *</label>
              <input required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                onChange={e => setFormData({...formData, title: e.target.value})} value={formData.title} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">開催日時 *</label>
                <input required type="datetime-local" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                    onChange={e => setFormData({...formData, eventDate: e.target.value})} value={formData.eventDate} />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">ジャンル</label>
                <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    onChange={e => setFormData({...formData, genre: e.target.value})} value={formData.genre}>
                    {GENRES.filter(g => g.id !== 'ALL').map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
            </div>
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">詳細・備考</label>
              <textarea className="w-full p-3 border rounded-lg h-20 focus:ring-2 focus:ring-indigo-500 outline-none" 
                onChange={e => setFormData({...formData, description: e.target.value})} value={formData.description} />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">情報元URL</label>
              <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..."
                onChange={e => setFormData({...formData, sourceUrl: e.target.value})} value={formData.sourceUrl} />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">キャンセル</button>
            <button type="submit" disabled={isSubmitting || !isFormValid} 
                className={`px-6 py-2.5 font-bold rounded-lg transition-colors ${isSubmitting || !isFormValid ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                {isSubmitting ? '処理中...' : '登録する'}
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24}/></button>
        <h3 className="text-xl font-bold mb-2 text-red-600 flex items-center"><FiAlertTriangle className="mr-2"/> 問題を報告</h3>
        <p className="text-xs text-gray-500 mb-4">虚偽の情報や、既に中止・延期になったイベントなどを報告してください。</p>
        
        <textarea 
          className="w-full p-3 border rounded-lg bg-gray-50 text-sm h-24 focus:border-red-300 outline-none"
          placeholder="例：公式から中止の発表がありました / 日付が間違っています"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 text-sm font-bold hover:bg-gray-100 rounded">キャンセル</button>
          <button onClick={handleReport} disabled={isSubmitting} className="px-4 py-2 bg-red-500 text-white rounded text-sm font-bold hover:bg-red-600">報告する</button>
        </div>
      </div>
    </div>
  );
}