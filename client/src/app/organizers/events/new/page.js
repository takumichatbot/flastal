'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiCalendar, FiMapPin, FiLoader, FiType
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function CreateEventContent() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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
      eventName: '', 
      eventDate: '',
      venueId: '',
      description: '',
      twitterHashtag: ''
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
        console.log("Fetching venues from:", `${API_URL}/api/venues`);
        const res = await fetch(`${API_URL}/api/venues`);
        
        if (!res.ok) {
          // もし404なら /api 直下も試す（保険）
          console.warn("Retrying with /api...");
          const resRetry = await fetch(`${API_URL}/api`);
          if (resRetry.ok) {
            const data = await resRetry.json();
            if (Array.isArray(data)) {
               setVenues(data);
               return;
            }
          }
          throw new Error('会場リストを取得できませんでした');
        }

        const data = await res.json();
        console.log("Venues received:", data);
        
        // データの形式をチェックしてセット
        if (Array.isArray(data)) {
          setVenues(data);
        } else if (data && Array.isArray(data.venues)) {
          setVenues(data.venues);
        }
      } catch (e) {
        console.error('Failed to fetch venues:', e);
        toast.error('会場リストの読み込みに失敗しました。ページを再読み込みしてください。');
      }
    };
    fetchVenues();
  }, [isMounted, authLoading, isAuthenticated, user, router]);

  const onSubmit = async (data) => {
    console.log("Submit start with data:", data);

    if (!data.venueId) {
      toast.error('会場を選択してください');
      return;
    }

    const toastId = toast.loading('イベントを登録中...');

    try {
      // 保存されているトークンの取得（複数のキーを試行して確実に取得）
      const token = localStorage.getItem('flastal-token') || localStorage.getItem('authToken');
      const cleanToken = token ? token.replace(/^"|"$/g, '') : null;

      if (!cleanToken) {
        toast.error('ログインセッションが切れています。再ログインしてください。', { id: toastId });
        return;
      }
      
      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || '作成に失敗しました');
      }

      toast.success('イベントを作成しました！', { id: toastId });
      router.push('/organizers/dashboard');
    } catch (error) {
      console.error('Submit Error:', error);
      toast.error(error.message, { id: toastId });
    }
  };

  // バリデーションエラー時の処理（ボタンが反応しない原因を特定するため）
  const onError = (errors) => {
    console.log("Validation Errors:", errors);
    toast.error("入力内容に不備があります。赤枠の箇所を確認してください。");
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
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                        <FiType className="text-indigo-500" /> イベント名 *
                    </label>
                    <input 
                        type="text" 
                        {...register('eventName', { required: 'イベント名は必須です' })} 
                        className={`w-full p-3 bg-gray-50 border ${errors.eventName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all`}
                        placeholder="例: FLASTAL LIVE 2026"
                    />
                    {errors.eventName && <p className="text-red-500 text-xs mt-1">{errors.eventName.message}</p>}
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

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">説明</label>
                    <textarea 
                        {...register('description')} 
                        rows="4"
                        placeholder="出演者や企画に関する補足情報があれば入力してください"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    ></textarea>
                </div>
          </div>

          <div className="flex gap-4">
             <button 
               type="submit" 
               disabled={isSubmitting} 
               className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg disabled:bg-gray-400 flex justify-center items-center gap-2"
             >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin" /> 登録中...
                  </>
                ) : 'イベントを登録する'}
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