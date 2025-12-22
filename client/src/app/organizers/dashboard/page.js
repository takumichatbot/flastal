'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // パス調整
import ApprovalPendingCard from '@/components/dashboard/ApprovalPendingCard';
import toast from 'react-hot-toast';

// アイコンセット
import { 
  FiPlus, 
  FiCalendar, 
  FiMapPin, 
  FiLogOut, 
  FiSettings, 
  FiLayers, 
  FiTrendingUp, 
  FiArrowRight,
  FiUsers
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 統計カードコンポーネント
const StatCard = ({ title, value, icon, subText }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-[1.01]">
    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subText && <span className="text-xs text-gray-400">{subText}</span>}
      </div>
    </div>
  </div>
);

export default function OrganizerDashboard() {
  const { user, isAuthenticated, loading, logout, isPending, isApproved } = useAuth();
  const router = useRouter();
  
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, upcomingEvents: 0, totalProjects: 0 });
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // データ取得
  const fetchEvents = useCallback(async () => {
    if (isPending || !isApproved) {
        setIsLoadingEvents(false);
        return; 
    }
    
    // トークン取得 (AuthContextからtokenが取れればそれがベストですが、localStorage参照のままにします)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken')?.replace(/^"|"$/g, '') : null;
    
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/organizers/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('イベント一覧の取得に失敗しました');
      
      const data = await res.json();
      setEvents(data);

      // 簡易統計の計算
      const upcoming = data.filter(e => new Date(e.eventDate) >= new Date()).length;
      const projects = data.reduce((acc, curr) => acc + (curr._count?.projects || 0), 0);
      
      setStats({
        totalEvents: data.length,
        upcomingEvents: upcoming,
        totalProjects: projects
      });

    } catch (error) {
      console.error(error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isPending, isApproved]); 

  useEffect(() => {
    if (loading) return;
    
    // ロールチェック
    if (!isAuthenticated || user?.role !== 'ORGANIZER') {
      router.push('/organizers/login');
      return;
    }

    fetchEvents();
  }, [loading, isAuthenticated, user, router, fetchEvents]);

  const handleLogout = () => {
    logout();
    toast.success('ログアウトしました');
    router.push('/organizers/login');
  };

  // --- レンダリング ---

  if (loading || (isLoadingEvents && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 審査ステータス判定
  if (isPending || !isApproved) {
      return <ApprovalPendingCard />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">主催者ダッシュボード</h1>
            <p className="text-sm text-gray-500">
               ログイン中: <span className="font-semibold text-indigo-600">{user.handleName || user.name}</span> 様
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/organizers/profile" className="text-gray-500 hover:text-indigo-600 transition-colors" title="設定">
               <FiSettings size={20} />
            </Link>
            <button onClick={handleLogout} className="flex items-center text-sm font-medium text-gray-600 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-lg">
              <FiLogOut className="mr-2" /> ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* スタッツエリア */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard 
              title="今後の開催イベント" 
              value={`${stats.upcomingEvents} 件`} 
              subText={`全 ${stats.totalEvents} イベント中`}
              icon={<FiCalendar size={24} />} 
            />
            <StatCard 
              title="受け入れ中の企画総数" 
              value={`${stats.totalProjects} 件`} 
              icon={<FiLayers size={24} />} 
            />
            {/* 新規作成アクションカード */}
            <Link href="/organizers/events/new" className="group h-full">
              <div className="h-full bg-indigo-600 text-white p-6 rounded-2xl shadow-md border border-indigo-600 flex flex-col justify-center items-center gap-2 hover:bg-indigo-700 transition-colors cursor-pointer">
                  <div className="p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                    <FiPlus size={24} />
                  </div>
                  <span className="font-bold text-lg">新しいイベントを作成</span>
              </div>
            </Link>
        </div>

        {/* イベントリストセクション */}
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiLayers className="text-indigo-600"/> 管理中のイベント一覧
          </h2>
        </div>

        {events.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
            <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
               <FiCalendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">イベントがまだありません</h3>
            <p className="text-gray-500 mb-6">
              まずはイベントを作成して、<br/>ファンからのフラワースタンドを受け入れましょう。
            </p>
            <Link 
              href="/organizers/events/new" 
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all"
            >
              <FiPlus className="mr-2" /> 最初のイベントを作成
            </Link>
          </div>
        ) : (
          // Event Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => {
              const isUpcoming = new Date(event.eventDate) > new Date();
              
              return (
                <div key={event.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all hover:border-indigo-300 flex flex-col h-full">
                  {/* カードヘッダー */}
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wide ${isUpcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {isUpcoming ? '公開中' : '終了'}
                      </span>
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded">
                        作成: {new Date(event.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start gap-2">
                        <FiCalendar className="mt-0.5 text-indigo-400 shrink-0" />
                        <span>{new Date(event.eventDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <FiMapPin className="mt-0.5 text-indigo-400 shrink-0" />
                        <span className="line-clamp-1">{event.venue ? event.venue.venueName : '会場未定'}</span>
                      </div>
                    </div>
                  </div>

                  {/* カードフッター */}
                  <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600" title="関連企画数">
                      <FiLayers className="text-gray-400"/>
                      <span className="font-bold">{event._count?.projects || 0}</span>
                      <span className="text-xs text-gray-400">企画</span>
                    </div>

                    <Link 
                      href={`/organizers/events/${event.id}`} 
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                    >
                      詳細・編集 <FiArrowRight />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}