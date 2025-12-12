'use client';

import { useState, useEffect, useCallback, Suspense } from 'react'; // useCallback を追加
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiInfo, FiAlertTriangle, FiCalendar, FiMapPin, FiX, FiImage, FiCpu, FiLoader, FiPlus, FiExternalLink, FiUser, FiAward } from 'react-icons/fi';
import AiPlanGenerator from '@/app/components/AiPlanGenerator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

// 日付フォーマット関数（datetime-localに対応するISO形式に変換）
const formatToLocalISO = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // ISO形式 (YYYY-MM-DDTHH:mm) に整形
        return date.toISOString().slice(0, 16); 
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
// ★★★ モーダル群 (変更なし。そのまま維持) ★★★
// ===========================================

function AIGenerationModal({ onClose, onGenerate }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('キーワードを入力してください');
    
    setIsGenerating(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/api/ai/generate-image`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center">
            <FiCpu className="mr-2"/> AI ラフ画生成
          </h3>
          <button onClick={onClose} disabled={isGenerating} className="text-white/80 hover:text-white text-xl">×</button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            作りたいフラスタのイメージを言葉で入力してください。<br/>
            AIが数秒でデザイン画を生成します。
          </p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 全体的にピンク色、大きなリボン、天使の羽、キラキラした装飾、かわいらしい雰囲気"
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
            disabled={isGenerating}
          ></textarea>

          <div className="mt-6 flex justify-end gap-3">
            <button 
              onClick={onClose} 
              disabled={isGenerating}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            >
              キャンセル
            </button>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center shadow-md transition-all"
            >
              {isGenerating ? (
                <>
                  <FiLoader className="animate-spin mr-2"/> 生成中...
                </>
              ) : (
                <>
                  <FiCpu className="mr-2"/> 生成する
                </>
              )}
            </button>
          </div>
          {isGenerating && (
            <p className="text-xs text-center text-purple-600 mt-3 animate-pulse">
              AIが絵を描いています... (約10〜20秒かかります)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EventSelectionModal({ onClose, onSelect }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // ★ /api/events/public を叩くことを推奨
        const res = await fetch(`${API_URL}/api/events/public`); 
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-indigo-50 rounded-t-lg">
          <h3 className="text-lg font-bold text-indigo-900">公式イベントを選択</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow bg-gray-50">
          {loading ? (
            <p className="text-center text-gray-500 py-8">イベント情報を読み込み中...</p>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>現在、登録されている公式イベントはありません。</p>
              <button onClick={onClose} className="mt-4 text-sm text-indigo-600 underline">
                手動で入力する
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <button
                  key={event.id}
                  onClick={() => {
                    onSelect(event);
                    onClose();
                  }}
                  className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">
                      {event.organizer?.name || '公式'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(event.eventDate).toLocaleDateString('ja-JP', { weekday: 'short' })}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 mb-2">
                    {event.title}
                  </h4>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2 text-indigo-400"/> 
                      {new Date(event.eventDate).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center">
                      <FiMapPin className="mr-2 text-indigo-400"/>
                      {event.venue ? event.venue.venueName : '会場未定'}
                    </div>
                  </div>

                  {!event.isStandAllowed && (
                    <div className="mt-3 text-xs bg-red-50 text-red-600 px-3 py-1 rounded border border-red-100 inline-block font-bold">
                      🚫 スタンド花禁止
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t bg-white text-center">
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
                キャンセル（手動で入力）
            </button>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">会場を選択</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          {loading ? (
            <p className="text-center text-gray-500">読み込み中...</p>
          ) : (
            <div className="grid gap-3">
              {venues.map(venue => (
                <button
                  key={venue.id}
                  onClick={() => { onSelect(venue); onClose(); }}
                  className="text-left p-3 border rounded-lg hover:bg-green-500/5 transition-colors group"
                >
                  <div className="flex justify-between">
                      <div className="font-bold text-gray-800 group-hover:text-green-700">{venue.venueName}</div>
                      {(venue.isStandAllowed === false) && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">フラスタNG</span>
                      )}
                  </div>
                  <div className="text-xs text-gray-500">{venue.address}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ===========================================
// ★★★ メインフォーム (CreateProjectForm) ★★★
// ===========================================

function CreateProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  // ★★★ URLから eventId と venueId を取得 ★★★
  const eventIdFromUrl = searchParams.get('eventId');
  const venueIdFromUrl = searchParams.get('venueId');

  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDesignUploading, setIsDesignUploading] = useState(false);
  
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false); 
  const [isAiPlanModalOpen, setIsAiPlanModalOpen] = useState(false); 

  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // ★★★ イベント情報読み込み用ステート ★★★
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
  
  // ★★★ イベントIDによる自動入力ロジック ★★★
  const fetchEventDetails = useCallback(async (id) => {
    if (!id) {
        setEventLoading(false);
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (res.ok) {
            const data = await res.json();
            setSelectedEvent(data);
            
            // フォームのフィールドを初期値で埋める (eventId, title, deliveryDateTime)
            const eventDate = data.eventDate ? formatToLocalISO(data.eventDate) : '';
            
            setFormData(prev => ({
                ...prev,
                title: data.title ? `【企画】${data.title} フラスタ企画` : prev.title, 
                eventId: data.id,
                deliveryDateTime: eventDate || prev.deliveryDateTime,
                ...(data.venue ? { // 会場情報があれば自動でvenueも設定
                    venueId: data.venue.id,
                    deliveryAddress: data.venue.address || data.venue.venueName
                } : {})
            }));
            
            if (data.venue) {
                setSelectedVenue(data.venue);
            }
            toast.success(`イベント「${data.title}」の情報がフォームに反映されました。`, { duration: 5000 });
        } else {
            toast.error('指定されたイベントの情報が見つかりませんでした。');
        }
    } catch (error) {
        console.error(error);
        toast.error('イベント情報の取得中にエラーが発生しました。');
    } finally {
        setEventLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('企画を作成するにはログインが必要です。');
      router.push('/login');
    }
    
    // 1. URLに eventId がある場合、イベント情報を取得
    if (eventIdFromUrl) {
        fetchEventDetails(eventIdFromUrl);
    } else if (venueIdFromUrl) {
        // 2. URLに venueId のみがある場合、会場情報を取得 (イベントがない場合)
        fetch(`${API_URL}/api/venues/${venueIdFromUrl}`)
            .then(res => res.json())
            .then(venue => {
                if(venue) handleVenueSelect(venue);
                setEventLoading(false);
            })
            .catch(() => setEventLoading(false));
    } else {
        setEventLoading(false);
    }
  }, [user, authLoading, router, eventIdFromUrl, venueIdFromUrl, fetchEventDetails]);


  const handleEventSelect = (event) => {
    if (!event) return;
    setSelectedEvent(event);
    
    const eventDate = event.eventDate ? formatToLocalISO(event.eventDate) : '';

    setFormData(prev => ({
        ...prev,
        title: `【企画】${event.title} フラスタ企画`, 
        eventId: event.id,
        deliveryDateTime: eventDate,
        // イベントに会場情報が紐づいていれば自動設定
        ...(event.venue ? {
            venueId: event.venue.id,
            deliveryAddress: event.venue.address || event.venue.venueName
        } : {})
    }));

    if (event.venue) {
        setSelectedVenue(event.venue);
    } else {
        setSelectedVenue(null);
    }
    toast.success('イベント情報を読み込みました！');
  };

  const handleVenueSelect = (venue) => {
      if (venue) {
          setSelectedVenue(venue);
          setFormData(prev => ({
              ...prev,
              deliveryAddress: venue.address || venue.venueName,
              venueId: venue.id 
          }));
      } else {
          setSelectedVenue(null);
          setFormData(prev => ({ ...prev, deliveryAddress: '', venueId: '' }));
      }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({ ...prev, projectType: type }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const toastId = toast.loading('メイン画像をアップロード中...');
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    const token = getAuthToken(); 
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData,
      });
      if (!res.ok) throw new Error('アップロードに失敗しました');
      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('メイン画像をアップロードしました！', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDesignImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsDesignUploading(true);
    const toastId = toast.loading(`${files.length}枚の画像をアップロード中...`);
    const token = getAuthToken();
    const uploadedUrls = [];
    try {
        for (const file of files) {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadFormData,
            });
            if (!res.ok) throw new Error('一部の画像のアップロードに失敗しました');
            const data = await res.json();
            uploadedUrls.push(data.url);
        }
        setFormData(prev => ({ ...prev, designImageUrls: [...prev.designImageUrls, ...uploadedUrls] }));
        toast.success('デザイン画像をアップロードしました！', { id: toastId });
    } catch (error) {
        toast.error(error.message, { id: toastId });
    } finally {
        setIsDesignUploading(false);
        e.target.value = '';
    }
  };

  const handleAIGenerated = (url) => {
      setFormData(prev => ({ 
          ...prev, 
          designImageUrls: [...prev.designImageUrls, url] 
      }));
  };

  const removeDesignImage = (index) => {
      setFormData(prev => ({
          ...prev,
          designImageUrls: prev.designImageUrls.filter((_, i) => i !== index)
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (parseInt(formData.targetAmount) < 1000) {
        toast.error('目標金額は1,000pt以上で設定してください');
        return;
    }

    if (formData.projectType === 'PRIVATE' && !formData.password.trim()) {
        toast.error('限定公開にする場合は、合言葉を設定してください');
        return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          targetAmount: parseInt(formData.targetAmount, 10),
          venueId: selectedVenue?.id || null, // ★ selectedVenue からIDを使用
          eventId: selectedEvent?.id || null,  // ★ selectedEvent からIDを使用
          deliveryDateTime: new Date(formData.deliveryDateTime).toISOString(), // ISO形式に変換
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '作成に失敗しました');

      toast.success('企画を作成しました！審査をお待ちください。');
      router.push('/mypage'); 
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || eventLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>読み込み中...</p></div>;
  }

  return (
    <div className="bg-sky-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">新しい企画を立てる</h1>
        <p className="text-gray-600 text-center mb-8">あなたの想いを形にする第一歩です。</p>
        
        {/* ★★★ イベント選択UI ★★★ */}
        {!selectedEvent && (
            <button 
                type="button"
                onClick={() => setIsEventModalOpen(true)}
                className="w-full mb-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center"
            >
                <FiCalendar className="w-6 h-6 mr-3" />
                <div className="text-left">
                    <p className="text-sm font-light opacity-90">まずはここから！</p>
                    <p className="font-bold text-lg">公式イベントを選択して作成する</p>
                </div>
            </button>
        )}

        {/* ★★★ 選択されたイベント情報表示 ★★★ */}
        {selectedEvent && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 relative">
                <span className="absolute top-0 right-0 bg-indigo-600 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg font-bold">公式イベント適用中</span>
                <h3 className="font-bold text-indigo-900 text-lg mb-1 flex items-center">
                    <FiCalendar className="mr-2"/> {selectedEvent.title}
                </h3>
                <p className="text-sm text-indigo-700 mb-2">{formatDisplayDate(selectedEvent.eventDate)} @ {selectedEvent.venue?.venueName || '会場未定'}</p>
                
                {(!selectedEvent.isStandAllowed || selectedEvent.regulationNote) && (
                    <div className="mt-3 bg-white p-3 rounded border border-indigo-100 text-sm">
                        <p className="font-bold text-indigo-800 mb-1 flex items-center">
                            <FiAlertTriangle className="mr-1"/> 主催者からの注意事項
                        </p>
                        {selectedEvent.isStandAllowed === false && <p className="text-red-600 font-bold mb-1 flex items-center"><FiX className="mr-1"/> スタンド花（フラスタ）の受け入れは不可です。</p>}
                        {selectedEvent.regulationNote && <p className="text-gray-700 whitespace-pre-wrap">{selectedEvent.regulationNote}</p>}
                    </div>
                )}

                <button 
                  type="button" 
                  onClick={() => {
                      setSelectedEvent(null);
                      setSelectedVenue(null); // イベント解除時は会場も解除
                      setFormData(prev => ({ ...prev, eventId: '', title: '', deliveryDateTime: '', venueId: '', deliveryAddress: '' }));
                  }}
                  className="text-xs text-gray-500 underline mt-3 hover:text-red-500"
                >
                  選択を解除する
                </button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 公開設定セクション */}
          <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h2 className="text-lg font-bold text-gray-800 mb-3">公開設定</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button type="button" onClick={() => handleTypeChange('PUBLIC')} className={`p-3 rounded-lg border-2 text-center transition-all ${formData.projectType === 'PUBLIC' ? 'border-sky-500 bg-white shadow-md' : 'border-transparent hover:bg-slate-200'}`}>
                    <div className="flex justify-center mb-1 text-2xl">🌍</div>
                    <div className="font-bold text-gray-800 text-sm">みんなで</div>
                    <div className="text-xs text-gray-500">サイト全体に公開</div>
                </button>
                <button type="button" onClick={() => handleTypeChange('PRIVATE')} className={`p-3 rounded-lg border-2 text-center transition-all ${formData.projectType === 'PRIVATE' ? 'border-purple-500 bg-white shadow-md' : 'border-transparent hover:bg-slate-200'}`}>
                    <div className="flex justify-center mb-1 text-2xl">🔒</div>
                    <div className="font-bold text-gray-800 text-sm">仲間と</div>
                    <div className="text-xs text-gray-500">合言葉で限定公開</div>
                </button>
                <button type="button" onClick={() => handleTypeChange('SOLO')} className={`p-3 rounded-lg border-2 text-center transition-all ${formData.projectType === 'SOLO' ? 'border-green-500 bg-white shadow-md' : 'border-transparent hover:bg-slate-200'}`}>
                    <div className="flex justify-center mb-1 text-2xl">👤</div>
                    <div className="font-bold text-gray-800 text-sm">ひとりで</div>
                    <div className="text-xs text-gray-500">自分専用の依頼</div>
                </button>
            </div>
            {formData.projectType === 'PRIVATE' && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">合言葉 (参加者に共有してください)</label>
                    <input type="text" name="password" value={formData.password} onChange={handleChange} placeholder="例: miku2025" className="mt-1 w-full p-2 border border-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500"/>
                </div>
            )}
            {formData.projectType === 'SOLO' && <p className="mt-3 text-xs text-green-700 bg-green-100 p-2 rounded">※「ひとりで」を選択すると、企画一覧には表示されず、あなた専用の管理ページが作成されます。</p>}
          </section>

          {/* ★★★ AI文章生成ボタン ★★★ */}
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setIsAiPlanModalOpen(true)}
              className="flex items-center gap-2 text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <FiCpu className="text-lg" /> 
              <span>AIにタイトルと説明文を書いてもらう</span>
            </button>
          </div>

          {/* 基本情報 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">企画タイトル <span className="text-red-500">*</span></label>
            <input type="text" name="title" id="title" required value={formData.title} onChange={handleChange} className="input-field" placeholder="例：○○さん出演祝いフラスタ企画"/>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">企画の詳しい説明 <span className="text-red-500">*</span></label>
            <textarea name="description" id="description" required value={formData.description} onChange={handleChange} rows="6" className="input-field" placeholder="企画の趣旨や想いを書きましょう。"></textarea>
          </div>

          {/* お届け情報 */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">お届け先 (会場) <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setIsVenueModalOpen(true)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 font-semibold transition-colors shadow-sm">
                  🏢 会場リストから選択
                </button>
             </div>
             {selectedVenue ? (
                 <div className="mb-3">
                     <div className="p-3 bg-white border border-green-300 rounded-lg flex justify-between items-center">
                         <div>
                             <p className="font-bold text-green-800">{selectedVenue.venueName}</p>
                             <p className="text-xs text-gray-500">{selectedVenue.address}</p>
                         </div>
                         <button type="button" onClick={() => handleVenueSelect(null)} className="text-xs text-gray-400 hover:text-red-500 underline">変更</button>
                     </div>
                     {(selectedVenue.isStandAllowed === false || selectedVenue.standRegulation) && (
                         <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                             <div className="font-bold text-yellow-800 mb-1 flex items-center"><FiInfo className="mr-1"/> この会場の注意事項</div>
                             {selectedVenue.isStandAllowed === false && <p className="text-red-600 font-bold mb-1 flex items-center"><FiAlertTriangle className="mr-1"/> スタンド花（フラスタ）の受け入れ不可</p>}
                             {selectedVenue.standRegulation && <p className="text-yellow-800 whitespace-pre-wrap">{selectedVenue.standRegulation}</p>}
                         </div>
                     )}
                 </div>
             ) : (
                 <input type="text" name="deliveryAddress" required value={formData.deliveryAddress} onChange={handleChange} className="input-field mb-3" placeholder="会場名と住所を入力してください" />
             )}
             <label htmlFor="deliveryDateTime" className="block text-sm font-medium text-gray-700">納品希望日時 <span className="text-red-500">*</span></label>
             <input type="datetime-local" name="deliveryDateTime" id="deliveryDateTime" required value={formData.deliveryDateTime} onChange={handleChange} className="input-field" />
          </div>

          {/* 目標金額 */}
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700">目標金額 (pt) <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
                <input type="number" name="targetAmount" id="targetAmount" required value={formData.targetAmount} onChange={handleChange} className="input-field !pl-8" placeholder="30000" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
            </div>
          </div>

          {/* メイン画像 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">メイン画像 (一覧に表示されます)</label>
            {formData.imageUrl && <img src={formData.imageUrl} alt="プレビュー" className="w-full h-48 object-cover rounded-md my-2" />}
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"/>
            {isUploading && <p className="text-sm text-blue-500 mt-1">アップロード中...</p>}
          </div>

          {/* デザイン詳細 */}
          <div className="border-t pt-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">デザイン・お花の希望 (任意)</h3>
             <div className="space-y-4">
                {/* デザイン画のアップロードエリア */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">デザイン画・参考画像 (複数可)</label>
                        
                        {/* ★ AI画像生成ボタン ★ */}
                        <button 
                            type="button" 
                            onClick={() => setIsAIModalOpen(true)}
                            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-full hover:bg-purple-700 font-bold shadow-sm flex items-center"
                        >
                            <FiCpu className="mr-1"/> AIでイメージを生成
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.designImageUrls.map((url, index) => (
                            <div key={index} className="relative w-20 h-20 group">
                                <img src={url} alt={`デザイン ${index}`} className="w-full h-full object-cover rounded border border-gray-300" />
                                <button
                                    type="button"
                                    onClick={() => removeDesignImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <FiX />
                                </button>
                            </div>
                        ))}
                    </div>
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <FiImage className="mr-2" />
                        画像を追加
                        <input type="file" multiple accept="image/*" onChange={handleDesignImagesUpload} disabled={isDesignUploading} className="hidden" />
                    </label>
                    {isDesignUploading && <span className="ml-3 text-sm text-blue-500">アップロード中...</span>}
                </div>

                <div>
                    <label htmlFor="designDetails" className="block text-sm font-medium text-gray-700">デザインの雰囲気</label>
                    <textarea name="designDetails" id="designDetails" value={formData.designDetails} onChange={handleChange} rows="2" className="input-field" placeholder="例：青色をベースに、クールな感じで"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="size" className="block text-sm font-medium text-gray-700">希望サイズ</label>
                        <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} className="input-field" placeholder="例：高さ180cm程度"/>
                    </div>
                    <div>
                        <label htmlFor="flowerTypes" className="block text-sm font-medium text-gray-700">使いたいお花</label>
                        <input type="text" name="flowerTypes" id="flowerTypes" value={formData.flowerTypes} onChange={handleChange} className="input-field" placeholder="例：青いバラ、ユリ"/>
                    </div>
                </div>
             </div>
          </div>
          
          <div className="pt-6">
            <button type="submit" disabled={isSubmitting || isUploading || isDesignUploading} className="w-full px-4 py-3 font-bold text-white bg-sky-500 rounded-lg hover:bg-sky-600 shadow-lg transition-all transform hover:scale-[1.01] disabled:bg-gray-400 disabled:transform-none">
              {isSubmitting ? '作成中...' : '企画を作成して審査へ'}
            </button>
          </div>
        </form>
      </div>

      {isVenueModalOpen && <VenueSelectionModal onClose={() => setIsVenueModalOpen(false)} onSelect={handleVenueSelect} />}
      {isEventModalOpen && <EventSelectionModal onClose={() => setIsEventModalOpen(false)} onSelect={handleEventSelect} />}
      {isAIModalOpen && <AIGenerationModal onClose={() => setIsAIModalOpen(false)} onGenerate={handleAIGenerated} />}
      
      {/* ★★★ AI文章生成モーダル ★★★ */}
      {isAiPlanModalOpen && (
        <AiPlanGenerator 
          onClose={() => setIsAiPlanModalOpen(false)}
          onGenerated={(title, description) => {
            // 生成されたテキストをフォームに反映
            setFormData(prev => ({ ...prev, title, description }));
          }}
        />
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          margin-top: 4px;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          color: #111827;
          background-color: #f9fafb;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
          border-color: #0ea5e9;
          outline: none;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
}

// ===========================================
// ★★★ デフォルトエクスポートするページコンポーネント (Suspenseでラップ) ★★★
// ===========================================
export default function CreateProjectPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">読み込み中...</div>}>
      <CreateProjectForm />
    </Suspense>
  );
}