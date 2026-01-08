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
  FiArrowLeft, FiCalendar, FiMapPin, FiLoader, FiType, FiImage, FiLink, FiGlobe, FiInstagram, FiTwitter
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function CreateEventContent() {
  const { user, isAuthenticated, loading: authLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [venues, setVenues] = useState([]);

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
      imageUrl: '',
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

  const onSubmit = async (data) => {
    if (!data.venueId) {
      toast.error('会場を選択してください');
      return;
    }

    const toastId = toast.loading('イベントを登録中...');

    try {
      // 日付のISO形式変換
      const formattedDate = new Date(`${data.eventDate}T00:00:00`).toISOString();

      const res = await authenticatedFetch('/api/events/user-submit', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          eventDate: formattedDate 
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.message || '作成に失敗しました');
      }

      toast.success('イベントを作成しました（公式バッジ適用）', { id: toastId });
      router.push('/organizers/dashboard');
    } catch (error) {
      console.error('Submit Error:', error);
      toast.error(error.message, { id: toastId });
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
                
                {/* 基本情報セクション */}
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
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                            <FiCalendar className="text-indigo-500" /> 開催日 *
                        </label>
                        <input 
                            type="date" 
                            {...register('eventDate', { required: '開催日は必須です' })} 
                            className={`w-full p-3 bg-gray-50 border ${errors.eventDate ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none`}
                        />
                        {errors.eventDate && <p className="text-red-500 text-xs mt-1">{errors.eventDate.message}</p>}
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
                        className={`w-full p-3 bg-gray-50 border ${errors.venueId ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none cursor-pointer bg-white`}
                    >
                        <option value="">会場を選択してください</option>
                        {venues.map(v => <option key={v.id} value={v.id}>{v.venueName}</option>)}
                    </select>
                    {errors.venueId && <p className="text-red-500 text-xs mt-1">{errors.venueId.message}</p>}
                </div>

                <hr className="border-gray-100" />

                {/* メディア・リンク情報セクション */}
                <h2 className="text-lg font-bold border-l-4 border-indigo-500 pl-3 mb-4">メディア・リンク情報</h2>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                        <FiImage className="text-indigo-500" /> イベント画像URL
                    </label>
                    <input 
                        type="url" 
                        {...register('imageUrl')} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                        placeholder="https://... (メインビジュアル画像URL)"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">※現時点では画像URLを直接入力してください</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                          <FiGlobe className="text-indigo-500" /> 公式サイトURL
                      </label>
                      <input 
                          type="url" 
                          {...register('officialWebsite')} 
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
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
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
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
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                        placeholder="https://instagram.com/..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <FiLoader className="text-indigo-500" /> イベント詳細
                    </label>
                    <textarea 
                        {...register('description')} 
                        rows="4"
                        placeholder="出演者や企画に関する補足情報、フラスタの搬入規定などがあれば入力してください"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    ></textarea>
                </div>
          </div>

          <div className="flex gap-4">
             <button 
               type="submit" 
               disabled={isSubmitting} 
               className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:bg-gray-400 flex justify-center items-center gap-3 text-lg"
             >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin" /> 登録中...
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