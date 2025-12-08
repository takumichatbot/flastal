'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function CreateEventPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      isStandAllowed: true
    }
  });

  const [venues, setVenues] = useState([]);
  
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== 'ORGANIZER') {
      router.push('/organizers/login');
      return;
    }

    // 会場リストの取得
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues`);
        if (res.ok) setVenues(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchVenues();
  }, [loading, isAuthenticated, user, router]);

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

      if (!res.ok) throw new Error('イベントの作成に失敗しました');

      toast.success('イベントを作成しました！');
      router.push('/organizers/dashboard');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const isStandAllowed = watch('isStandAllowed');

  if (loading || !user) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-200">
        <div className="mb-8">
          <Link href="/organizers/dashboard" className="text-sm text-gray-500 hover:text-indigo-600 mb-2 inline-block">
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">新規イベント作成</h1>
          <p className="text-gray-500 mt-1">開催するイベントの情報を入力してください。</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">イベント名 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              {...register('title', { required: '必須です' })} 
              className="mt-1 w-full p-3 border rounded-lg focus:ring-indigo-500 outline-none"
              placeholder="例: FLASTAL LIVE 2025 -Winter-"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">開催日 <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              {...register('eventDate', { required: '必須です' })} 
              className="mt-1 w-full p-3 border rounded-lg focus:ring-indigo-500 outline-none"
            />
            {errors.eventDate && <p className="text-red-500 text-xs mt-1">{errors.eventDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">会場</label>
            <select 
              {...register('venueId')} 
              className="mt-1 w-full p-3 border rounded-lg focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">会場を選択してください（任意）</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue.venueName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">※登録されていない会場の場合は空欄でも構いません。</p>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-3">フラスタ・レギュレーション</h3>
            
            <div className="flex items-center mb-4">
              <input 
                type="checkbox" 
                id="isStandAllowed"
                {...register('isStandAllowed')}
                className="h-5 w-5 text-indigo-600 rounded"
              />
              <label htmlFor="isStandAllowed" className="ml-2 block text-sm text-gray-900 font-medium">
                スタンド花（フラスタ）の受け入れを許可する
              </label>
            </div>

            {isStandAllowed && (
              <div>
                <label className="block text-sm font-medium text-gray-700">特記事項・制限事項</label>
                <textarea 
                  {...register('regulationNote')}
                  rows="3"
                  className="mt-1 w-full p-2 border rounded-lg text-sm"
                  placeholder="例: 関係者受付宛にお送りください。高さ180cm以内厳守。"
                ></textarea>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">イベント詳細・説明</label>
            <textarea 
              {...register('description')} 
              rows="5"
              className="mt-1 w-full p-3 border rounded-lg focus:ring-indigo-500 outline-none"
              placeholder="イベントの概要や、ファンへのメッセージなどを記入してください。"
            ></textarea>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:bg-gray-400"
            >
              {isSubmitting ? '作成中...' : 'イベントを公開する'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}