// /organizers/dashboard/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ApprovalPendingCard from '@/app/components/ApprovalPendingCard';
import { FiPlus, FiCalendar, FiMapPin, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function OrganizerDashboard() {
  const { user, isAuthenticated, loading, logout, isPending, isApproved } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (isPending || !isApproved) {
        setIsLoadingEvents(false);
        return; 
    }
    
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/organizers/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('イベント一覧の取得に失敗しました');
      setEvents(await res.json());
    } catch (error) {
      console.error(error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isPending, isApproved]); 

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== 'ORGANIZER') {
      router.push('/organizers/login');
      return;
    }

    fetchEvents();
  }, [loading, isAuthenticated, user, router, fetchEvents]);

  const handleLogout = () => {
    logout();
    router.push('/organizers/login');
  };

  if (loading || !user) return <div className="p-8 text-center">読み込み中...</div>;

  if (isPending || !isApproved) {
      return <ApprovalPendingCard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">主催者ダッシュボード</h1>
            <p className="text-sm text-gray-500">{user.handleName} 様</p>
          </div>
          <button onClick={handleLogout} className="flex items-center text-gray-600 hover:text-red-600 transition-colors text-sm">
            <FiLogOut className="mr-2" /> ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* アクションエリア */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">管理中のイベント</h2>
          <Link 
            href="/organizers/events/new" 
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <FiPlus className="mr-2" /> 新しいイベントを作成
          </Link>
        </div>

        {/* イベントリスト */}
        {isLoadingEvents ? (
          <p className="text-center py-10 text-gray-500">イベントを読み込んでいます...</p>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500 mb-4">まだイベントが登録されていません。</p>
            <Link href="/organizers/events/new" className="text-indigo-600 font-semibold hover:underline">
              最初のイベントを作成する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${new Date(event.eventDate) > new Date() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {new Date(event.eventDate) > new Date() ? '公開中' : '終了'}
                  </span>
                  <p className="text-xs text-gray-400">作成日: {new Date(event.createdAt).toLocaleDateString('ja-JP')}</p>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{event.title}</h3>
                
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <FiCalendar className="mr-2 text-indigo-500" />
                    {new Date(event.eventDate).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="flex items-center">
                    <FiMapPin className="mr-2 text-indigo-500" />
                    {event.venue ? event.venue.venueName : '会場未定'}
                  </div>
                </div>

                <div className="border-t pt-3 flex justify-between items-center text-sm">
                  <span className="text-gray-500">関連企画: <strong>{event._count?.projects || 0}</strong> 件</span>
                  {/* ★★★ 修正箇所: Linkコンポーネントに変更 ★★★ */}
                  <Link 
                    href={`/organizers/events/${event.id}`} 
                    className="text-indigo-600 font-semibold hover:underline flex items-center"
                  >
                    詳細・編集 &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}