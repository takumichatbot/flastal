'use client';

// Next.js 15 エラー回避設定
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiCalendar, FiMapPin, FiLoader, FiType, FiImage, FiGlobe, FiInstagram, FiTwitter, FiUpload, FiX, FiInfo, FiPlus, FiCpu, FiSave, FiTrash2
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function EditEventContent() {
  const { user, isAuthenticated, loading: authLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const params = useParams(); // URLパラメータ取得
  const eventId = params.id;

  const [isMounted, setIsMounted] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [venues, setVenues] = useState([]);
  
  // 画像状態
  const [imageUrls, setImageUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // AI解析用状態
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { 
    register, 
    handleSubmit, 
    setValue, 
    reset, // フォームリセット用
    formState: { isSubmitting, errors } 
  } = useForm();

  // データ読み込み（会場リスト & 既存イベント情報）
  useEffect(() => {
    if (!isMounted || authLoading) return;

    if (!isAuthenticated || (user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN')) {
      router.push('/organizers/login');
      return;
    }

    const loadData = async () => {
      try {
        // 1. 会場リスト取得
        const venueRes = await fetch(`${API_URL}/api/venues`);
        if (venueRes.ok) {
            const vData = await venueRes.json();
            setVenues(Array.isArray(vData) ? vData : (vData.venues || []));
        }

        // 2. イベント詳細取得
        const eventRes = await authenticatedFetch(`/api/events/${eventId}`);
        if (!eventRes.ok) throw new Error('イベント情報の取得に失敗しました');
        
        const eventData = await eventRes.json();

        // フォームに初期値をセット
        reset({
            title: eventData.title,
            eventDate: eventData.eventDate ? new Date(eventData.eventDate).toISOString().split('T')[0] : '', // YYYY-MM-DDに変換
            venueId: eventData.venueId,
            description: eventData.description,
            genre: eventData.genre,
            officialWebsite: eventData.officialWebsite,
            twitterUrl: eventData.twitterUrl,
            instagramUrl: eventData.instagramUrl
        });

        // 画像URLをセット
        setImageUrls(eventData.imageUrls || []);

      } catch (e) {
        console.error('Data Load Error:', e);
        toast.error('データの読み込みに失敗しました');
        router.push('/organizers/dashboard');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [isMounted, authLoading, isAuthenticated, user, router, eventId, authenticatedFetch, reset]);

  // ★ AI解析実行関数 (APIルートを使用)
  // ★ 修正: バックエンドAPIを呼び出すように変更
  const handleAiAnalyze = async () => {
    if (!aiInputText.trim()) return toast.error('テキストを入力してください');
    
    setIsAnalyzing(true);
    const toastId = toast.loading('AIが解析中...');

    try {
      // 変更点: API_URL を使用し、authenticatedFetch で認証トークンを送る
      const res = await authenticatedFetch(`${API_URL}/api/events/analyze`, {
        method: 'POST',
        body: JSON.stringify({ text: aiInputText })
      });

      if (!res.ok) throw new Error('解析に失敗しました');
      const data = await res.json();

      // フォームに値を反映
      if (data.title) setValue('title', data.title);
      if (data.eventDate) setValue('eventDate', data.eventDate);
      if (data.venueId) setValue('venueId', data.venueId);
      if (data.description) setValue('description', data.description);
      if (data.genre) setValue('genre', data.genre);
      if (data.officialWebsite) setValue('officialWebsite', data.officialWebsite);
      if (data.twitterUrl) setValue('twitterUrl', data.twitterUrl);

      toast.success('AI解析結果を反映しました', { id: toastId });
      setShowAiModal(false);
      setAiInputText('');

    } catch (error) {
      console.error(error);
      toast.error('解析できませんでした', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 画像アップロード
  const uploadToS3 = async (file) => {
    const res = await authenticatedFetch('/api/tools/s3-upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, fileType: file.type })
    });
    if (!res.ok) throw new Error('署名取得失敗');
    const { uploadUrl, fileUrl } = await res.json();

    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    return fileUrl;
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    const toastId = toast.loading('画像をアップロード中...');
    try {
      const newUrls = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) continue;
        const url = await uploadToS3(file);
        newUrls.push(url);
      }
      setImageUrls(prev => [...prev, ...newUrls]);
      toast.success('完了', { id: toastId });
    } catch (err) {
      toast.error('アップロード失敗', { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  // 更新送信
  const onSubmit = async (data) => {
    const toastId = toast.loading('更新中...');
    try {
      const formattedDate = new Date(`${data.eventDate}T00:00:00`).toISOString();

      const res = await authenticatedFetch(`/api/events/${eventId}`, {
        method: 'PATCH', // 更新なのでPATCH
        body: JSON.stringify({
          ...data,
          imageUrls: imageUrls, 
          eventDate: formattedDate 
        }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');

      toast.success('イベント情報を更新しました！', { id: toastId });
      router.push('/organizers/dashboard');
    } catch (error) {
      console.error('Update Error:', error);
      toast.error(error.message, { id: toastId });
    }
  };

  // 削除機能
  const handleDelete = async () => {
    if(!confirm('本当にこのイベントを削除しますか？\nこの操作は取り消せません。')) return;
    
    const toastId = toast.loading('削除中...');
    try {
        const res = await authenticatedFetch(`/api/events/${eventId}`, { method: 'DELETE' });
        if(!res.ok) throw new Error('削除失敗');
        toast.success('削除しました', { id: toastId });
        router.push('/organizers/dashboard');
    } catch(err) {
        toast.error('削除できませんでした', { id: toastId });
    }
  };

  if (!isMounted || authLoading || loadingData) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <FiLoader className="animate-spin text-indigo-500 w-10 h-10 mb-4" />
            <p className="text-slate-400 font-medium">データを読み込み中...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/organizers/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <FiArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">イベント編集</h1>
              </div>
              <div className="flex gap-2">
                {/* AIボタン */}
                <button 
                    onClick={() => setShowAiModal(true)}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-indigo-100 transition-all"
                >
                    <FiCpu /> AI解析
                </button>
                <button 
                    onClick={handleDelete}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="イベントを削除"
                >
                    <FiTrash2 size={20} />
                </button>
              </div>
          </div>
      </div>

      {/* AI解析モーダル */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><FiCpu /> 情報の上書き解析</h3>
              <button onClick={() => setShowAiModal(false)}><FiX size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-3">新しい情報を貼り付けると、AIが解析してフォームの内容を上書きします。</p>
              <textarea 
                className="w-full h-40 p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                placeholder="新しいイベント情報を入力..."
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
              ></textarea>
              <button 
                onClick={handleAiAnalyze}
                disabled={isAnalyzing}
                className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isAnalyzing ? <><FiLoader className="animate-spin" /> 解析中...</> : '解析して上書き'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 md:p-8 space-y-6">
                
                <h2 className="text-lg font-bold border-l-4 border-indigo-500 pl-3 mb-4">基本情報</h2>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                        <FiType className="text-indigo-500" /> イベント名 *
                    </label>
                    <input 
                        type="text" 
                        {...register('title', { required: 'イベント名は必須です' })} 
                        className={`w-full p-3 bg-gray-50 border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all`}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                            <FiCalendar className="text-indigo-500" /> 開催日 *
                        </label>
                        <input 
                            type="date" 
                            {...register('eventDate', { required: '開催日は必須です' })} 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">ジャンル</label>
                        <select 
                            {...register('genre')} 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer bg-white"
                        >
                            <option value="IDOL">アイドル</option>
                            <option value="VTUBER">VTuber</option>
                            <option value="MUSIC">音楽・バンド</option>
                            <option value="ANIME">アニメ・声優</option>
                            <option value="STAGE">舞台・演劇</option>
                            <option value="OTHER">その他</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                        <FiMapPin className="text-indigo-500" /> 会場 *
                    </label>
                    <select 
                        {...register('venueId', { required: '会場の選択は必須です' })} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer bg-white"
                    >
                        <option value="">会場を選択してください</option>
                        {venues.map(v => <option key={v.id} value={v.id}>{v.venueName}</option>)}
                    </select>
                </div>

                <hr className="border-gray-100" />

                <h2 className="text-lg font-bold border-l-4 border-indigo-500 pl-3 mb-4">メディア・画像</h2>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiImage className="text-indigo-500" /> イベント画像
                    </label>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        {imageUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden shadow-sm group border border-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} className="w-full h-full object-cover" alt="Preview" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                >
                                    <FiX size={14} />
                                </button>
                            </div>
                        ))}
                        
                        <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer">
                            {isUploading ? (
                              <FiLoader className="animate-spin text-indigo-500" size={24} />
                            ) : (
                              <>
                                <FiPlus className="text-indigo-400 mb-1" size={24} />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">画像を追加</span>
                              </>
                            )}
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageChange}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                          <FiGlobe className="text-indigo-500" /> 公式サイトURL
                      </label>
                      <input 
                          type="url" 
                          {...register('officialWebsite')} 
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all"
                          placeholder="https://..."
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                          <FiTwitter className="text-sky-400" /> X (Twitter) URL
                      </label>
                      <input 
                          type="url" 
                          {...register('twitterUrl')} 
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all"
                          placeholder="https://x.com/..."
                      />
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                        <FiInstagram className="text-pink-500" /> Instagram URL
                    </label>
                    <input 
                        type="url" 
                        {...register('instagramUrl')} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all"
                        placeholder="https://instagram.com/..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <FiInfo className="text-indigo-500" /> イベント詳細
                    </label>
                    <textarea 
                        {...register('description')} 
                        rows="4"
                        placeholder="詳細を入力"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    ></textarea>
                </div>
          </div>

          <div className="flex gap-4">
             <button 
               type="submit" 
               disabled={isSubmitting || isUploading} 
               className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:bg-gray-400 flex justify-center items-center gap-3 text-lg active:scale-95 transition-transform"
             >
                {(isSubmitting || isUploading) ? (
                  <>
                    <FiLoader className="animate-spin" /> {isUploading ? '画像をアップロード中...' : '更新中...'}
                  </>
                ) : '変更を保存する'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><FiLoader className="animate-spin text-indigo-500 w-10 h-10" /></div>}>
      <EditEventContent />
    </Suspense>
  );
}