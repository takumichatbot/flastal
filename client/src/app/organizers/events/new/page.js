'use client';

// Next.js 15 のビルドエラーを確実に回避するための設定
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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

/**
 * メインロジック
 */
function CreateEventContent() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenueInfo, setSelectedVenueInfo] = useState(null);

  // 1. マウント確認
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. React Hook Form (マウント後にのみ初期化されるように配慮されています)
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

  // 3. 権限・データ取得
  useEffect(() => {
    if (!isMounted || authLoading) return;

    if (!isAuthenticated || user?.role !== 'ORGANIZER') {
      router.push('/organizers/login');
      return;
    }

    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues`);
        if (res.ok) setVenues(await res.json());
      } catch (e) {
        toast.error('会場リストの読み込みに失敗しました');
      }
    };
    fetchVenues();
  }, [isMounted, authLoading, isAuthenticated, user, router]);

  const watchedVenueId = watch('venueId');
  useEffect(() => {
    if (watchedVenueId) {
      const venue = venues.find(v => v.id === watchedVenueId);
      setSelectedVenueInfo(venue || null);
    }
  }, [watchedVenueId, venues]);

  const onSubmit = async (data) => {
    try {
      const rawToken = localStorage.getItem('authToken');
      const token = rawToken ? rawToken.replace(/^"|"$/g, '') : null;
      
      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('作成に失敗しました');

      toast.success('イベントを作成しました！');
      router.push('/organizers/dashboard');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const isStandAllowed = watch('isStandAllowed');

  // ビルド時（サーバーサイド）やマウント前は、重いフォームを表示せずローディングのみ返す
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 md:p-8 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">イベント名 *</label>
                    <input 
                        type="text" 
                        {...register('title', { required: 'イベント名は必須です' })} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="例: FLASTAL LIVE 2025"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">開催日 *</label>
                        <input 
                            type="date" 
                            {...register('eventDate', { required: '開催日は必須です' })} 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">会場</label>
                    <select 
                        {...register('venueId')} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer"
                    >
                        <option value="">会場を選択（未定は空欄）</option>
                        {venues.map(v => <option key={v.id} value={v.id}>{v.venueName}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">説明</label>
                    <textarea 
                        {...register('description')} 
                        rows="4"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    ></textarea>
                </div>
          </div>

          <div className="flex gap-4">
             <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg disabled:bg-gray-400">
                {isSubmitting ? '作成中...' : 'イベントを公開する'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * エクスポート
 */
export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><FiLoader className="animate-spin text-indigo-500 w-10 h-10" /></div>}>
      <CreateEventContent />
    </Suspense>
  );
}