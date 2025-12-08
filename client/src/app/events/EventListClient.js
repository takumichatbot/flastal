'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { FiCalendar, FiMapPin, FiSearch, FiAlertTriangle, FiCheckCircle, FiPlus, FiCpu, FiLink, FiX, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 日付フォーマット関数
const formatDate = (dateString) => {
  if (!dateString) return '日付未定';
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  });
};

export default function EventListClient() {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // モーダル状態
  const [showAiModal, setShowAiModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);

  // データ取得
  const fetchEvents = async () => {
    try {
      // 既存の /api/events がBAN済みを除外するように修正されている前提
      // または /api/events/public を叩く
      const res = await fetch(`${API_URL}/api/events/public`); 
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 検索フィルタリング
  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.venue && e.venue.venueName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* ヘッダーエリア */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">📅 イベント情報局</h1>
          <p className="text-gray-500 mb-6 max-w-2xl mx-auto">
            公式情報はもちろん、AIが見つけた最新イベント情報も集まります。<br/>
            見つからない場合は、あなたが追加することもできます。
          </p>
          
          {/* アクションボタン */}
          <div className="flex justify-center gap-3 mb-8">
             <button 
                onClick={() => isAuthenticated ? setShowManualModal(true) : toast.error('ログインが必要です')}
                className="flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-full shadow-sm hover:bg-gray-50 transition-colors"
             >
                <FiPlus className="mr-2"/> 手動で追加
             </button>
             <button 
                onClick={() => isAuthenticated ? setShowAiModal(true) : toast.error('ログインが必要です')}
                className="flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
             >
                <FiCpu className="mr-2"/> AI自動解析で追加
             </button>
          </div>

          {/* 検索バー */}
          <div className="relative max-w-lg mx-auto">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"/>
            <input 
                type="text"
                placeholder="イベント名や会場名で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* リストエリア */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20 text-gray-500">
             <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
             イベント情報を読み込み中...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-500 font-bold mb-2">条件に合うイベントが見つかりませんでした。</p>
            <p className="text-sm text-gray-400">「手動で追加」または「AI自動解析」を試してみてください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {filteredEvents.map(event => (
              <div key={event.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full relative">
                
                {/* リンクエリア */}
                <Link href={`/events/${event.id}`} className="flex-grow flex flex-col">
                    {/* サムネイル */}
                    <div className={`h-32 flex items-center justify-center relative ${event.sourceType === 'OFFICIAL' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-slate-400 to-slate-500'}`}>
                        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                            {new Date(event.eventDate).toLocaleDateString()}
                        </div>
                        <span className="text-4xl filter drop-shadow-lg">
                            {event.sourceType === 'AI' ? '🤖' : event.sourceType === 'USER' ? '👤' : '🎤'}
                        </span>
                        
                        {/* フラスタOK/NGバッジ (情報がある場合のみ) */}
                        {event.sourceType === 'OFFICIAL' && (
                            <div className="absolute bottom-4 right-4">
                                {event.isStandAllowed ? (
                                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center"><FiCheckCircle className="mr-1"/> OK</span>
                                ) : (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center"><FiAlertTriangle className="mr-1"/> NG</span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                        <div className="mb-2 flex items-center gap-2">
                            {/* ソース表示バッジ */}
                            {event.sourceType === 'OFFICIAL' && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">公式</span>}
                            {event.sourceType === 'AI' && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 flex items-center"><FiCpu className="mr-1"/>AI抽出</span>}
                            {event.sourceType === 'USER' && <span className="text-[10px] font-bold bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-100">ユーザー投稿</span>}
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
                            {event.title}
                        </h3>
                        
                        <div className="mt-auto pt-4 border-t border-gray-50 space-y-2 text-sm text-gray-500">
                            <div className="flex items-center">
                                <FiCalendar className="mr-2 text-indigo-400 shrink-0"/>
                                <span>
                                    {new Date(event.eventDate).toLocaleString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' })}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <FiMapPin className="mr-2 text-indigo-400 shrink-0"/>
                                <span className="truncate">{event.venue ? event.venue.venueName : '会場未定'}</span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* カード内フッター（通報ボタンなど） */}
                <div className="px-5 pb-4 flex justify-between items-center text-xs text-gray-400">
                    {event.sourceUrl ? (
                        <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-500 z-10">
                            <FiLink className="mr-1"/> 情報元
                        </a>
                    ) : <span></span>}
                    
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            isAuthenticated ? setReportTargetId(event.id) : toast.error('ログインが必要です');
                        }}
                        className="flex items-center hover:text-red-500 transition-colors z-10"
                    >
                        <FiAlertTriangle className="mr-1"/> 通報
                    </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* モーダル群 */}
      {showAiModal && <AiAddModal onClose={() => setShowAiModal(false)} onAdded={fetchEvents} />}
      {showManualModal && <ManualAddModal onClose={() => setShowManualModal(false)} onAdded={fetchEvents} />}
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
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/events/ai-parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text, sourceUrl: url })
      });

      if (!res.ok) throw new Error('解析に失敗しました');
      
      const data = await res.json();
      toast.success(`「${data.event.title}」を追加しました！`, { id: toastId });
      onAdded();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('エラーが発生しました', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
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
          placeholder="https://twitter.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">キャンセル</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
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
// サブコンポーネント: 手動追加モーダル
// ----------------------------------------------
function ManualAddModal({ onClose, onAdded }) {
  const [formData, setFormData] = useState({ title: '', eventDate: '', description: '', sourceUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('登録中...');
    try {
      const token = localStorage.getItem('authToken');
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
        toast.error('登録に失敗しました', { id: toastId });
      }
    } catch (e) { console.error(e); toast.error('エラーが発生しました'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24}/></button>
        <h3 className="text-xl font-bold mb-4 text-gray-800">手動でイベントを追加</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">イベント名 <span className="text-red-500">*</span></label>
              <input required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">開催日時 <span className="text-red-500">*</span></label>
              <input required type="datetime-local" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" onChange={e => setFormData({...formData, eventDate: e.target.value})} />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">詳細・備考</label>
              <textarea className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-indigo-500 outline-none" onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">情報元URL</label>
              <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." onChange={e => setFormData({...formData, sourceUrl: e.target.value})} />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">キャンセル</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">登録</button>
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
      const token = localStorage.getItem('authToken');
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
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