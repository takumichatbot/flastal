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
  FiArrowLeft, FiCalendar, FiMapPin, FiLoader, FiType, FiImage, FiLink, FiGlobe, FiInstagram, FiTwitter, FiUpload, FiX, FiInfo
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function CreateEventContent() {
  const { user, isAuthenticated, loading: authLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [venues, setVenues] = useState([]);
  
  // 画像アップロード用状態
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { 
    register, 
    handleSubmit, 
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
        if (Array.isArray(data)) {
          setVenues(data);
        } else if (data && Array.isArray(data.venues)) {
          setVenues(data.venues);
        }
      } catch (e) {
        console.error('Failed to fetch venues:', e);
        toast.error('会場リストの読み込みに失敗しました。');
      }
    };
    fetchVenues();
  }, [isMounted, authLoading, isAuthenticated, user, router]);

  // 画像ファイル選択時の処理
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('画像サイズは5MB以下にしてください');
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // AWS S3へのアップロード関数 (署名不一致・Load failed 対策版)
  const uploadToS3 = async (file) => {
    // 1. バックエンドから署名付きURLを取得
    // tools.js で fileType を ContentType として署名に使っているため、正確に送る必要があります
    const res = await authenticatedFetch('/api/tools/s3-upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, fileType: file.type })
    });
    
    if (!res.ok) throw new Error('アップロード許可の取得に失敗しました');
    const { uploadUrl, fileUrl } = await res.json();

    // 2. S3へ直接PUTリクエストで送信
    // 重要：署名付きURLを使用する場合、署名に含まれていないヘッダー（Authorization等）があるとエラーになります。
    // そのため、ここでは authenticatedFetch ではなく、標準の window.fetch を使用し、
    // かつヘッダーをバックエンドの署名と完全に一致させます。
    const uploadRes = await window.fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type // バックエンドの PutObjectCommand の ContentType と一致させる
      }
    });

    if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('S3 Error Body:', errorText);
        throw new Error('S3アップロードに失敗しました。ファイル形式を確認してください。');
    }
    
    return fileUrl;
  };

  const onSubmit = async (data) => {
    if (!data.venueId) {
      toast.error('会場を選択してください');
      return;
    }

    const toastId = toast.loading('イベントを登録中...');
    setIsUploading(true);

    try {
      let finalImageUrl = '';
      
      // 画像ファイルがある場合はS3へアップロード
      if (imageFile) {
        finalImageUrl = await uploadToS3(imageFile);
      }

      // 日付のISO形式変換
      const formattedDate = new Date(`${data.eventDate}T00:00:00`).toISOString();

      const res = await authenticatedFetch('/api/events/user-submit', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          imageUrl: finalImageUrl,
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
      toast.error(error.message || '通信エラーが発生しました', { id: toastId });
    } finally {
      setIsUploading(false);
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
          </div>
      </div>

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
                        <FiImage className="text-indigo-500" /> イベントのメイン画像
                    </label>
                    
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 hover:bg-gray-100 transition-all relative">
                        {imagePreview ? (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm">
                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                <button 
                                    type="button"
                                    onClick={() => {setImagePreview(null); setImageFile(null);}}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer py-4 w-full">
                                <FiUpload className="text-indigo-400 mb-2" size={32} />
                                <span className="text-sm font-bold text-gray-500">写真をアップロード</span>
                                <span className="text-[10px] text-gray-400 mt-1">スマホのカメラやPCのファイルから選択</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleImageChange}
                                />
                            </label>
                        )}
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