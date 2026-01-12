'use client';

// Next.js 15 ビルドエラー回避用
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiInfo, FiAlertTriangle, FiCalendar, FiMapPin, FiX, FiImage, FiCpu, FiLoader, FiPlus, FiExternalLink, FiUser, FiAward, FiSearch, FiCheckCircle, FiShield } from 'react-icons/fi';
import Image from 'next/image';
import AiPlanGenerator from '@/app/components/AiPlanGenerator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 日付フォーマット関数（datetime-localに対応するISO形式に変換）
const formatToLocalISO = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
        return '';
    }
};

// 日付フォーマット関数（表示用）
const formatDisplayDate = (dateString) => {
    if (!dateString) return '日付未定';
    return new Date(dateString).toLocaleString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
    });
};

// ===========================================
// モーダルコンポーネント群
// ===========================================

function AIGenerationModal({ onClose, onGenerate }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { authenticatedFetch } = useAuth();

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('キーワードを入力してください');
    
    setIsGenerating(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/ai/generate-ai-image`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error('生成に失敗しました');
      
      const data = await res.json();
      onGenerate(data.url);
      onClose();
      toast.success('イメージ画像を生成しました！');
    } catch (error) {
      console.error(error);
      toast.error('画像の生成に失敗しました。しばらく待ってからお試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-purple-100">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center">
            <FiCpu className="mr-2"/> AI ラフ画生成
          </h3>
          <button onClick={onClose} disabled={isGenerating} className="text-white/80 hover:text-white text-2xl transition-colors">×</button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4 font-medium">
            作りたいフラスタのイメージを言葉で入力してください。<br/>
            AIが数秒でデザイン画を生成します。
          </p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 全体的にピンク色、大きなリボン、天使の羽、キラキラした装飾、かわいらしい雰囲気"
            rows="4"
            className="w-full p-4 border border-purple-200 bg-purple-50/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none text-gray-900 transition-all resize-none"
            disabled={isGenerating}
          ></textarea>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} disabled={isGenerating} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">キャンセル</button>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center shadow-md transition-all transform hover:scale-105"
            >
              {isGenerating ? <><FiLoader className="animate-spin mr-2"/> 生成中...</> : <><FiCpu className="mr-2"/> 生成する</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventSelectionModal({ onClose, onSelect }) {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/public`); 
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
          setFilteredEvents(data);
        }
      } catch (e) {
        console.error(e);
        toast.error('イベント情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredEvents(
      events.filter(e => 
        e.title.toLowerCase().includes(query) || 
        (e.venue?.venueName || '').toLowerCase().includes(query)
      )
    );
  }, [searchQuery, events]);

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-indigo-50">
          <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <FiCalendar className="text-indigo-600"/> 公式イベントを選択
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
        </div>

        <div className="p-4 bg-white border-b">
            <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input 
                    type="text" 
                    placeholder="イベント名や会場名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
            </div>
        </div>

        <div className="p-4 overflow-y-auto flex-grow bg-slate-50 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">
                <FiLoader className="animate-spin text-3xl mx-auto mb-2 text-indigo-400"/>
                読み込み中...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="font-bold mb-2">該当するイベントが見つかりません。</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <button
                key={event.id}
                onClick={() => { onSelect(event); onClose(); }}
                className="w-full text-left p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-1 rounded-full font-bold border border-indigo-200 uppercase">
                    {event.organizer?.name || 'Official'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono font-bold">
                    {new Date(event.eventDate).toLocaleDateString('ja-JP', { weekday: 'short' })}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 mb-3 relative z-10 line-clamp-2">{event.title}</h4>
                <div className="text-sm text-gray-500 space-y-1 relative z-10">
                  <div className="flex items-center"><FiCalendar className="mr-2 text-indigo-400 shrink-0"/> {formatDisplayDate(event.eventDate)}</div>
                  <div className="flex items-center"><FiMapPin className="mr-2 text-indigo-400 shrink-0"/> {event.venue ? event.venue.venueName : '会場未定'}</div>
                </div>
                <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function VenueSelectionModal({ onClose, onSelect }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues`);
        if (res.ok) {
          const data = await res.json();
          setVenues(data);
        }
      } catch (e) {
        console.error(e);
        toast.error('会場リストの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FiMapPin className="text-green-600"/> 会場を選択</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow bg-slate-50 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">読み込み中...</div>
          ) : (
            venues.map(venue => (
                <button
                  key={venue.id}
                  onClick={() => { onSelect(venue); onClose(); }}
                  className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all group"
                >
                  <div className="font-bold text-gray-800 group-hover:text-green-700 text-lg">{venue.venueName}</div>
                  <div className="text-xs text-gray-500 flex items-center"><FiMapPin className="mr-1"/> {venue.address}</div>
                </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// メインフォーム
// ===========================================

function CreateProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const eventIdFromUrl = searchParams.get('eventId');
  const venueIdFromUrl = searchParams.get('venueId');

  const { user, authenticatedFetch, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDesignUploading, setIsDesignUploading] = useState(false);
  
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false); 
  const [isAiPlanModalOpen, setIsAiPlanModalOpen] = useState(false); 

  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    deliveryAddress: '', 
    venueId: '',
    eventId: '',
    deliveryDateTime: '',
    imageUrl: '',
    designImageUrls: [], 
    designDetails: '',
    size: '',
    flowerTypes: '',
    projectType: 'PUBLIC',
    password: '',
  });

  const uploadImageToS3 = async (file) => {
    try {
        const res = await authenticatedFetch('/api/tools/s3-upload-url', {
            method: 'POST',
            body: JSON.stringify({ fileName: file.name, fileType: file.type })
        });
        if (!res.ok) throw new Error('署名付きURLの取得に失敗しました');
        const { uploadUrl, fileUrl } = await res.json();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.onload = () => {
                if (xhr.status === 200) resolve(fileUrl);
                else reject(new Error('S3へのアップロードに失敗しました'));
            };
            xhr.onerror = () => reject(new Error('ネットワークエラーが発生しました'));
            xhr.send(file);
        });
    } catch (error) {
        throw error;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const toastId = toast.loading('メイン画像をアップロード中...');
    try {
      const url = await uploadImageToS3(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('メイン画像をアップロードしました！', { id: toastId });
    } catch (error) {
      toast.error('アップロードに失敗しました。', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDesignImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsDesignUploading(true);
    const toastId = toast.loading(`${files.length}枚の画像をアップロード中...`);
    const uploadedUrls = [];
    try {
        for (const file of files) {
            const url = await uploadImageToS3(file);
            uploadedUrls.push(url);
        }
        setFormData(prev => ({ ...prev, designImageUrls: [...prev.designImageUrls, ...uploadedUrls] }));
        toast.success('デザイン画像をアップロードしました！', { id: toastId });
    } catch (error) {
        toast.error('一部の画像のアップロードに失敗しました', { id: toastId });
    } finally {
        setIsDesignUploading(false);
        e.target.value = '';
    }
  };

  // AI画像生成が完了した時の処理（ここが不足していたためエラーが発生していました）
  const handleAIGenerated = (url) => {
    setFormData(prev => ({
      ...prev,
      designImageUrls: [...prev.designImageUrls, url]
    }));
  };

  const fetchEventDetails = useCallback(async (id) => {
    if (!id) { setEventLoading(false); return; }
    try {
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (res.ok) {
            const data = await res.json();
            setSelectedEvent(data);
            const isoDate = data.eventDate ? formatToLocalISO(data.eventDate) : '';
            setFormData(prev => ({
                ...prev,
                title: data.title ? `【企画】${data.title} フラスタ企画` : prev.title, 
                eventId: data.id,
                deliveryDateTime: isoDate || prev.deliveryDateTime,
                ...(data.venue ? { venueId: data.venue.id, deliveryAddress: data.venue.address || data.venue.venueName } : {})
            }));
            if (data.venue) setSelectedVenue(data.venue);
        }
    } catch (error) { console.error(error); } finally { setEventLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); }
    if (eventIdFromUrl) { fetchEventDetails(eventIdFromUrl); } 
    else if (venueIdFromUrl) {
        fetch(`${API_URL}/api/venues/${venueIdFromUrl}`).then(res => res.json()).then(v => {
            if(v) handleVenueSelect(v);
            setEventLoading(false);
        }).catch(() => setEventLoading(false));
    } else { setEventLoading(false); }
  }, [user, authLoading, router, eventIdFromUrl, venueIdFromUrl, fetchEventDetails]);

  const handleEventSelect = (event) => {
    if (!event) return;
    setSelectedEvent(event);
    setFormData(prev => ({
        ...prev,
        title: `【企画】${event.title} フラスタ企画`, 
        eventId: event.id,
        deliveryDateTime: formatToLocalISO(event.eventDate),
        ...(event.venue ? { venueId: event.venue.id, deliveryAddress: event.venue.address || event.venue.venueName } : {})
    }));
    if (event.venue) setSelectedVenue(event.venue);
    toast.success('イベント情報を読み込みました！');
  };

  const handleVenueSelect = (venue) => {
      if (venue) {
          setSelectedVenue(venue);
          setFormData(prev => ({ ...prev, deliveryAddress: venue.address || venue.venueName, venueId: venue.id }));
      } else {
          setSelectedVenue(null);
          setFormData(prev => ({ ...prev, deliveryAddress: '', venueId: '' }));
      }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    let deliveryDateTimeISO;
    try {
        if (!formData.deliveryDateTime) throw new Error("納品希望日時を選択してください");
        const dateObj = new Date(formData.deliveryDateTime);
        if (isNaN(dateObj.getTime())) throw new Error("日時の形式が正しくありません");
        deliveryDateTimeISO = dateObj.toISOString();
    } catch (err) {
        return toast.error(err.message);
    }

    const amount = parseInt(formData.targetAmount, 10);
    if (isNaN(amount) || amount < 1000) {
        return toast.error('目標金額は1,000pt以上で設定してください');
    }

    setIsSubmitting(true);
    const toastId = toast.loading('企画を保存中...');

    try {
      const payload = {
        title: formData.title || "",
        description: formData.description || "",
        targetAmount: amount,
        deliveryAddress: formData.deliveryAddress || (selectedVenue?.address || ""),
        deliveryDateTime: deliveryDateTimeISO,
        imageUrl: formData.imageUrl || "",
        designImageUrls: formData.designImageUrls || [],
        designDetails: formData.designDetails || "",
        size: formData.size || "",
        flowerTypes: formData.flowerTypes || "",
        projectType: formData.projectType || "PUBLIC",
        password: formData.password || null,
        venueId: selectedVenue?.id || null,
        eventId: selectedEvent?.id || null,
        visibility: "PUBLIC"
      };

      const res = await authenticatedFetch(`${API_URL}/api/projects`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || '作成に失敗しました。サーバー側のバリデーションエラーです。');
      }

      toast.success('企画を作成しました！審査をお待ちください。', { id: toastId });
      
      setTimeout(() => {
          window.location.href = '/mypage';
      }, 1000);

    } catch (error) { 
        setIsSubmitting(false);
        toast.error(error.message, { id: toastId }); 
    }
  };

  if (authLoading || !user || eventLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><FiLoader className="animate-spin text-indigo-500 w-10 h-10" /></div>;
  }

  return (
    <div className="bg-sky-50 min-h-screen py-12 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-3xl shadow-xl border border-white/50">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center tracking-tight">新しい企画を立てる</h1>
        <p className="text-gray-500 text-center mb-10 font-medium">あなたの想いを形にする第一歩です。</p>
        
        {!selectedEvent && (
            <button type="button" onClick={() => setIsEventModalOpen(true)} className="w-full mb-8 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center group">
                <div className="p-3 bg-white/20 rounded-full mr-4"><FiCalendar className="w-6 h-6" /></div>
                <div className="text-left">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Recommended</p>
                    <p className="font-bold text-xl">公式イベントを選択して作成する</p>
                </div>
            </button>
        )}

        {selectedEvent && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 mb-8 relative shadow-sm animate-fadeIn">
                <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-bl-xl rounded-tr-xl font-bold tracking-widest uppercase">Official Event</span>
                <h3 className="font-bold text-indigo-900 text-lg mb-2 flex items-center"><FiCalendar className="mr-2"/> {selectedEvent.title}</h3>
                <p className="text-sm text-indigo-700 font-medium mb-3 flex items-center gap-3">
                    <span className="bg-white/50 px-2 py-1 rounded">{formatDisplayDate(selectedEvent.eventDate)}</span>
                    <span className="bg-white/50 px-2 py-1 rounded">@ {selectedEvent.venue?.venueName || '会場未定'}</span>
                </p>
                <button type="button" onClick={() => { setSelectedEvent(null); setSelectedVenue(null); setFormData(p => ({ ...p, eventId: '', title: '', deliveryDateTime: '', venueId: '', deliveryAddress: '' })); }} className="text-xs font-bold text-indigo-400 hover:text-red-500 underline mt-3">選択を解除して手動入力へ</button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FiUser className="text-sky-500"/> 公開設定</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { id: 'PUBLIC', icon: '🌍', title: 'みんなで', desc: '全体に公開', color: 'sky' },
                    { id: 'PRIVATE', icon: '🔒', title: '仲間と', desc: '合言葉で限定', color: 'purple' },
                    { id: 'SOLO', icon: '👤', title: 'ひとりで', desc: '自分専用依頼', color: 'green' },
                ].map((type) => (
                    <button key={type.id} type="button" onClick={() => setFormData(p => ({...p, projectType: type.id}))} 
                        className={`p-4 rounded-xl border-2 text-center transition-all ${formData.projectType === type.id ? `border-${type.color}-500 bg-white shadow-md scale-105 ring-2 ring-${type.color}-100` : 'border-transparent bg-white/50 hover:bg-white hover:border-gray-200'}`}>
                        <div className="flex justify-center mb-2 text-3xl">{type.icon}</div>
                        <div className={`font-bold text-${type.color}-700 text-sm mb-1`}>{type.title}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{type.desc}</div>
                    </button>
                ))}
            </div>
            {formData.projectType === 'PRIVATE' && (
                <div className="mt-5 bg-white p-4 rounded-xl border border-purple-100 animate-fadeIn">
                    <label className="block text-sm font-bold text-purple-800 mb-1">合言葉</label>
                    <input type="text" name="password" value={formData.password} onChange={handleChange} placeholder="例: oshi2026" className="w-full p-3 border border-purple-200 rounded-lg outline-none bg-purple-50 font-bold tracking-widest"/>
                </div>
            )}
          </section>

          <div className="flex justify-end">
            <button type="button" onClick={() => setIsAiPlanModalOpen(true)} className="flex items-center gap-2 text-xs bg-white text-pink-600 border border-pink-200 px-4 py-2 rounded-full font-bold shadow-sm hover:bg-pink-50">
              <FiCpu className="text-lg" /> <span>AIにタイトルと説明文を考えてもらう</span>
            </button>
          </div>

          <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">企画タイトル <span className="text-red-500">*</span></label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="input-field font-bold" placeholder="例：○○さん出演祝いフラスタ企画"/>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">企画の詳しい説明 <span className="text-red-500">*</span></label>
                <textarea name="description" required value={formData.description} onChange={handleChange} rows="6" className="input-field" placeholder="趣旨や想いを書きましょう。"></textarea>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <label className="text-lg font-bold text-gray-800 flex items-center gap-2"><FiMapPin className="text-green-600"/> お届け先</label>
                <button type="button" onClick={() => setIsVenueModalOpen(true)} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-bold border border-green-200">リストから選択</button>
             </div>
             {selectedVenue ? (
                 <div className="mb-6">
                     <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center">
                         <div>
                             <p className="font-bold text-green-900 text-lg">{selectedVenue.venueName}</p>
                             <p className="text-xs text-green-700">{selectedVenue.address}</p>
                         </div>
                         <button type="button" onClick={() => handleVenueSelect(null)} className="text-xs text-green-400 font-bold hover:text-red-500 underline">解除</button>
                     </div>
                 </div>
             ) : (
                 <input type="text" name="deliveryAddress" required value={formData.deliveryAddress} onChange={handleChange} className="input-field mb-4" placeholder="会場名と住所を入力してください" />
             )}
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">納品希望日時 <span className="text-red-500">*</span></label>
                <input type="datetime-local" name="deliveryDateTime" required value={formData.deliveryDateTime} onChange={handleChange} className="input-field" />
             </div>
          </div>

          <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100">
            <label className="block text-lg font-bold text-pink-900 mb-2">目標金額 (pt) <span className="text-red-500">*</span></label>
            <div className="relative">
                <input type="number" name="targetAmount" required value={formData.targetAmount} onChange={handleChange} className="input-field !pl-8 !border-pink-200 !bg-white text-2xl font-bold text-pink-600" placeholder="30000" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 text-xl font-bold">¥</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">メイン画像 (一覧に表示)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-gray-50 cursor-pointer relative overflow-hidden group">
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="プレビュー" className="max-h-64 mx-auto rounded-lg shadow-md" />
                ) : (
                    <div className="py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-sky-500 transition-colors">
                            {isUploading ? <FiLoader className="animate-spin text-2xl"/> : <FiImage className="text-3xl"/>}
                        </div>
                        <p className="text-sm font-bold text-gray-500 group-hover:text-gray-700">クリックして画像をアップロード</p>
                    </div>
                )}
            </div>
          </div>

          <div className="border-t pt-8">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><FiAward className="text-yellow-500"/> デザイン・お花の希望 (任意)</h3>
             <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-bold text-gray-700">参考画像・ラフ画</label>
                        <button type="button" onClick={() => setIsAIModalOpen(true)} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 font-bold transition-colors flex items-center border border-purple-200"><FiCpu className="mr-1"/> AIでイメージ生成</button>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-4">
                        {formData.designImageUrls.map((url, index) => (
                            <div key={index} className="relative w-24 h-24 group">
                                <img src={url} alt={`デザイン ${index}`} className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm" />
                                <button type="button" onClick={() => setFormData(p => ({...p, designImageUrls: p.designImageUrls.filter((_, i) => i !== index)}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md transform scale-0 group-hover:scale-100 transition-transform"><FiX /></button>
                            </div>
                        ))}
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 transition-all text-gray-400 group">
                            {isDesignUploading ? <FiLoader className="animate-spin text-xl"/> : <FiPlus className="text-2xl group-hover:text-sky-500"/>}
                            <span className="text-[10px] font-bold mt-1">追加</span>
                            <input type="file" multiple accept="image/*" onChange={handleDesignImagesUpload} disabled={isDesignUploading} className="hidden" />
                        </label>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">デザインの雰囲気</label>
                    <textarea name="designDetails" value={formData.designDetails} onChange={handleChange} rows="2" className="input-field" placeholder="例：青色をベースに、クールな感じで"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">希望サイズ</label>
                        <input type="text" name="size" value={formData.size} onChange={handleChange} className="input-field" placeholder="例：高さ180cm程度"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">使いたいお花</label>
                        <input type="text" name="flowerTypes" value={formData.flowerTypes} onChange={handleChange} className="input-field" placeholder="例：青いバラ、ユリ"/>
                    </div>
                </div>
             </div>
          </div>
          
          <div className="pt-8 pb-4">
            <button type="submit" disabled={isSubmitting || isUploading || isDesignUploading} className="w-full px-4 py-4 font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 shadow-md text-lg">
              {isSubmitting ? <span className="flex items-center justify-center"><FiLoader className="animate-spin mr-2"/> 作成中...</span> : '企画を作成して審査へ'}
            </button>
          </div>
        </form>
      </div>

      {isVenueModalOpen && <VenueSelectionModal onClose={() => setIsVenueModalOpen(false)} onSelect={handleVenueSelect} />}
      {isEventModalOpen && <EventSelectionModal onClose={() => setIsEventModalOpen(false)} onSelect={handleEventSelect} />}
      {isAIModalOpen && <AIGenerationModal onClose={() => setIsAIModalOpen(false)} onGenerate={handleAIGenerated} />}
      
      {isAiPlanModalOpen && (
        <AiPlanGenerator 
          onClose={() => setIsAiPlanModalOpen(false)}
          onGenerated={(title, description) => {
            setFormData(prev => ({ ...prev, title, description }));
            toast.success('AIが文章を作成しました！');
          }}
        />
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          color: #111827;
          background-color: #f9fafb;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        .input-field:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-50"><FiLoader className="animate-spin text-indigo-500 w-10 h-10" /></div>}>
      <CreateProjectForm />
    </Suspense>
  );
}