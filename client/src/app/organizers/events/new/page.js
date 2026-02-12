'use client';

// Next.js 15 ビルドエラー回避
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiCalendar, FiMapPin, FiLoader, FiType, FiImage, FiLink, FiGlobe, FiInstagram, FiTwitter, FiUpload, FiX, FiInfo, FiPlus, FiCpu // ★ FiCpuを追加
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function CreateEventContent() {
  const { user, isAuthenticated, loading: authLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [venues, setVenues] = useState([]);
  
  // 画像アップロード用状態
  const [imageUrls, setImageUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // ★ AI解析用の状態
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { 
    register, 
    handleSubmit, 
    setValue, // ★ setValueを追加 (AI解析結果を反映するため)
    formState: { isSubmitting, errors } 
  } = useForm({
    defaultValues: {
      title: '', 
      eventDate: '',
      venueId: '',
      description: '',
      genre: 'OTHER',
      twitterUrl: '',
      instagramUrl: '',
      officialWebsite: ''
    }
  });

  // 会場一覧の取得
  useEffect(() => {
    if (!isMounted || authLoading) return;

    if (!isAuthenticated || (user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN')) {
      router.push('/organizers/login');
      return;
    }

    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues`);
        if (!res.ok) throw new Error('会場リストを取得できませんでした');
        const data = await res.json();
        setVenues(Array.isArray(data) ? data : (data.venues || []));
      } catch (e) {
        console.error('Failed to fetch venues:', e);
        toast.error('会場リストの読み込みに失敗しました。');
      }
    };
    fetchVenues();
  }, [isMounted, authLoading, isAuthenticated, user, router]);

  // ★ AI解析実行関数
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

      // フォームに値をセット
      if (data.title) setValue('title', data.title);
      if (data.eventDate) setValue('eventDate', data.eventDate);
      if (data.venueId) setValue('venueId', data.venueId);
      if (data.description) setValue('description', data.description);
      if (data.genre) setValue('genre', data.genre);
      if (data.officialWebsite) setValue('officialWebsite', data.officialWebsite);
      if (data.twitterUrl) setValue('twitterUrl', data.twitterUrl);

      toast.success('解析完了！情報を入力しました', { id: toastId });
      setShowAiModal(false);
      setAiInputText('');

    } catch (error) {
      console.error(error);
      toast.error('解析できませんでした', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // S3アップロード関数
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

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    const toastId = toast.loading('画像をアップロード中...');

    try {
      const newUrls = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} は5MBを超えているためスキップしました`);
          continue;
        }
        const url = await uploadToS3(file);
        newUrls.push(url);
      }
      setImageUrls(prev => [...prev, ...newUrls]);
      toast.success('画像をアップロードしました', { id: toastId });
    } catch (err) {
      toast.error('アップロードに失敗しました', { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = ''; 
    }
  };

  const removeImage = (idx) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data) => {
    if (!data.venueId) {
      toast.error('会場を選択してください');
      return;
    }

    const toastId = toast.loading('イベントを登録中...');

    try {
      const formattedDate = new Date(`${data.eventDate}T00:00:00`).toISOString();

      const res = await authenticatedFetch('/api/events/user-submit', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          imageUrls: imageUrls, 
          eventDate: formattedDate 
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.message || '作成に失敗しました');
      }

      toast.success('イベントを作成しました！', { id: toastId });
      router.push('/organizers/dashboard');
    } catch (error) {
      console.error('Submit Error:', error);
      toast.error(error.message || '予期せぬエラーが発生しました', { id: toastId });
    }
  };

  const onError = (errors) => {
    console.log("Validation Errors:", errors);
    toast.error("入力内容に不備があります。");
  };

  if (!isMounted || authLoading || !user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <FiLoader className="animate-spin text-indigo-500 w-10 h-10 mb-4" />
            <p className="text-slate-400 font-medium">読み込み中...</p>
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
                <h1 className="text-xl font-bold text-gray-900">新規イベント作成</h1>
              </div>
              
              {/* ★ AI解析ボタンの追加 */}
              <button 
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <FiCpu /> AIで情報入力
              </button>
          </div>
      </div>

      {/* ★ AI解析モーダル */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><FiCpu /> イベント情報の自動解析</h3>
              <button onClick={() => setShowAiModal(false)}><FiX size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-3">公式サイトの「開催概要」などのテキストを貼り付けてください。AIが自動で項目を埋めます。</p>
              <textarea 
                className="w-full h-40 p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                placeholder="例：『FLASTAL LIVE 2026』開催決定！日時：2026年12月25日 会場：東京ドーム..."
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
              ></textarea>
              <button 
                onClick={handleAiAnalyze}
                disabled={isAnalyzing}
                className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isAnalyzing ? <><FiLoader className="animate-spin" /> 解析中...</> : '解析して反映する'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
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
                        placeholder="例: FLASTAL LIVE 2026"
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
                        <FiImage className="text-indigo-500" /> イベント画像 (複数追加可)
                    </label>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        {imageUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden shadow-sm group border border-gray-200">
                                <img src={url} className="w-full h-full object-cover" alt="Preview" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                >
                                    <FiX size={14} />
                                </button>
                                {idx === 0 && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 text-white text-[10px] text-center py-0.5 font-bold">カバー</div>
                                )}
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
                    <p className="text-[10px] text-gray-400">※1枚目の画像が一覧のカバー写真として使用されます。</p>
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
                        placeholder="出演者やフラスタの搬入規定など"
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
                    <FiLoader className="animate-spin" /> {isUploading ? '画像をアップロード中...' : '登録中...'}
                  </>
                ) : 'イベントを公開する'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><FiLoader className="animate-spin text-indigo-500 w-10 h-10" /></div>}>
      <CreateEventContent />
    </Suspense>
  );
}