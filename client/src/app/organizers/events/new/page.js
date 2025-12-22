'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiCalendar, FiMapPin, FiInfo, FiCheck, FiLoader, FiAlertCircle 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

/**
 * [動的部分の隔離]
 * useAuth や useRouter などのフックに依存するメインコンテンツ
 */
function CreateEventContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isSubmitting } 
  } = useForm({
    defaultValues: {
      isStandAllowed: true,
      venueId: ''
    }
  });

  const [venues, setVenues] = useState([]);
  const [selectedVenueInfo, setSelectedVenueInfo] = useState(null);
  
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== 'ORGANIZER') {
      router.push('/organizers/login');
      return;
    }

    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues`);
        if (res.ok) setVenues(await res.json());
      } catch (e) {
        console.error(e);
        toast.error('会場リストの読み込みに失敗しました');
      }
    };
    fetchVenues();
  }, [loading, isAuthenticated, user, router]);

  const watchedVenueId = watch('venueId');
  useEffect(() => {
    if (watchedVenueId) {
      const venue = venues.find(v => v.id === watchedVenueId);
      setSelectedVenueInfo(venue || null);
    } else {
      setSelectedVenueInfo(null);
    }
  }, [watchedVenueId, venues]);

  const onSubmit = async (data) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || '作成に失敗しました');
      }

      toast.success('イベントを作成しました！');
      router.push('/organizers/dashboard');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const isStandAllowed = watch('isStandAllowed');

  if (loading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/organizers/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <FiArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">新規イベント作成</h1>
              </div>
          </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100">
                <h2 className="font-bold text-indigo-900 flex items-center gap-2">
                    <FiInfo className="text-indigo-600"/> 基本情報
                </h2>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        イベント名 <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        {...register('title', { required: 'イベント名は必須です' })} 
                        className={`w-full p-3 bg-gray-50 border rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all ${errors.title ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="例: FLASTAL LIVE 2025 -Winter-"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center"><FiAlertCircle className="mr-1"/> {errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            開催日 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <FiCalendar className="absolute top-3.5 left-3 text-gray-400 pointer-events-none"/>
                            <input 
                                type="date" 
                                {...register('eventDate', { required: '開催日は必須です' })} 
                                className={`w-full pl-10 pr-3 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all ${errors.eventDate ? 'border-red-500' : 'border-gray-200'}`}
                            />
                        </div>
                        {errors.eventDate && <p className="text-red-500 text-xs mt-1">{errors.eventDate.message}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">会場</label>
                    <div className="relative">
                        <FiMapPin className="absolute top-3.5 left-3 text-gray-400 pointer-events-none"/>
                        <select 
                            {...register('venueId')} 
                            className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">会場を選択してください（未定の場合は空欄）</option>
                            {venues.map(venue => (
                                <option key={venue.id} value={venue.id}>
                                    {venue.venueName}
                                </option>
                            ))}
                        </select>
                        {selectedVenueInfo && (
                            <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800 animate-fadeIn">
                                <p className="font-bold flex items-center gap-1"><FiCheck /> {selectedVenueInfo.venueName}</p>
                                <p className="text-xs text-indigo-600 ml-5">{selectedVenueInfo.address}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">イベント詳細・説明</label>
                    <textarea 
                        {...register('description')} 
                        rows="5"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="イベントの概要、出演者、タイムテーブルなど、ファンに伝えたい情報を記入してください。"
                    ></textarea>
                </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-yellow-50 px-6 py-3 border-b border-yellow-100">
                <h2 className="font-bold text-yellow-800 flex items-center gap-2">
                    <span className="text-xl">💐</span> フラワースタンド受付設定
                </h2>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-4">
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox" 
                            id="isStandAllowed"
                            {...register('isStandAllowed')}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-6 checked:border-indigo-600 border-gray-300 transition-all duration-300" 
                        />
                        <label 
                            htmlFor="isStandAllowed" 
                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${isStandAllowed ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        ></label>
                    </div>
                    <div>
                        <label htmlFor="isStandAllowed" className="block text-base font-bold text-gray-800 cursor-pointer">
                            フラワースタンドを受け入れる
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            OFFにすると、このイベントに対してファンは企画を作成できなくなります。
                        </p>
                    </div>
                </div>

                <div className={`transition-all duration-300 overflow-hidden ${isStandAllowed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 mt-2">
                        <label className="block text-sm font-bold text-yellow-900 mb-2">
                            レギュレーション・注意事項
                        </label>
                        <textarea 
                            {...register('regulationNote')}
                            rows="4"
                            className="w-full p-3 bg-white border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                            placeholder="【サイズ規定】高さ180cm以下、底辺40cm×40cm以下&#13;&#10;【搬入時間】当日午前中指定&#13;&#10;【回収】必須 (公演終了後〜翌日午前中)"
                        ></textarea>
                        <p className="text-xs text-yellow-700 mt-2">
                            ※ 会場の規定と異なる独自のルールがある場合は詳細に記述してください。
                        </p>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
             <Link href="/organizers/dashboard" className="w-full sm:w-1/3 py-4 text-center font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors order-2 sm:order-1">
                キャンセル
             </Link>
             <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-2/3 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center order-1 sm:order-2 disabled:bg-gray-400 disabled:shadow-none"
            >
                {isSubmitting ? (
                    <><FiLoader className="animate-spin mr-2"/> 作成中...</>
                ) : (
                    'イベントを公開する'
                )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// --- [静的部分] メインエクスポート ---
/**
 * CreateEventPage
 * Next.js 15 のビルドエラーを回避するために Suspense でラップします。
 */
export default function NewEventPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <FiLoader className="animate-spin text-indigo-500 w-10 h-10" />
      </div>
    }>
      <CreateEventContent />
    </Suspense>
  );
}