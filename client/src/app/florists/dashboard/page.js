'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import VenueRegulationCard from '../../components/VenueRegulationCard'; 
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext'; 
import { FiCheckCircle, FiFileText, FiRefreshCw, FiCalendar, FiMapPin, FiClock, FiChevronLeft, FiChevronRight, FiCamera, FiUser } from 'react-icons/fi'; // FiCamera, FiUser 追加

// ★修正箇所 1: AppealPostForm をインポート
import FloristAppealPostForm from '@/app/components/FloristAppealPostForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// StatCard Component
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
    <div className="flex items-center gap-4">
      <div className="bg-sky-100 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

// ステータスの日本語変換マップ
const STATUS_LABELS = {
  'NOT_STARTED': '未着手',
  'FLORIST_MATCHED': '相談中',
  'DESIGN_FIXED': 'デザイン決定',
  'PANELS_RECEIVED': 'パネル受取済',
  'IN_PRODUCTION': '制作中',
  'PRE_COMPLETION': '前日写真UP済',
  'COMPLETED': '完了',
  'FUNDRAISING': '募集中'
};

// ★★★ カレンダーコンポーネント ★★★
function CalendarView({ events }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 月の最初の日と最後の日を取得
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // カレンダーのマス目を生成
  const days = [];
  // 月初の空白
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  // 日付埋め
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // 選択された日のイベント
  const selectedEvents = events.filter(e => 
    new Date(e.date).toDateString() === selectedDate.toDateString()
  );

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
      {/* カレンダー本体 */}
      <div className="lg:w-2/3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {year}年 {month + 1}月
          </h3>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><FiChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 font-medium">今日</button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><FiChevronRight size={20}/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={i} className={`text-xs font-bold uppercase tracking-wider ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} className="min-h-[80px] bg-gray-50/30"></div>;
            
            // その日のイベントがあるか確認
            const dayEvents = events.filter(e => new Date(e.date).toDateString() === date.toDateString());
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();

            return (
              <div 
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`min-h-[80px] border rounded-lg p-1 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' : 
                  isToday ? 'border-sky-300 bg-sky-50' : 'border-slate-100 hover:border-pink-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-500 text-white' : 'text-gray-700'}`}>
                    {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && <span className="w-2 h-2 bg-pink-500 rounded-full"></span>}
                </div>
                
                {/* イベントバッジ (2件まで表示) */}
                <div className="space-y-1 overflow-hidden mt-1">
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className="text-[9px] bg-white border border-indigo-100 text-indigo-700 px-1 py-0.5 rounded truncate shadow-sm">
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-gray-400 pl-1">+他 {dayEvents.length - 2} 件</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細リスト (右側) */}
      <div className="lg:w-1/3 space-y-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
            <FiCalendar className="mr-2 text-pink-500"/> {selectedDate.toLocaleDateString('ja-JP')} の予定
          </h3>
          
          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            {selectedEvents.length > 0 ? selectedEvents.map(event => (
              <Link key={event.id} href={`/projects/${event.id}`} target="_blank" className="block group">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 group-hover:border-pink-400 group-hover:bg-pink-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold flex items-center text-gray-600 bg-white px-2 py-0.5 rounded border">
                      <FiClock className="mr-1"/> {new Date(event.date).getHours()}:{String(new Date(event.date).getMinutes()).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      {STATUS_LABELS[event.status] || '進行中'}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-700">
                    {event.title}
                  </h4>
                  <div className="text-xs text-gray-500 flex items-start gap-1">
                    <FiMapPin className="shrink-0 mt-0.5 text-gray-400"/>
                    <span className="line-clamp-2">{event.location}</span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-10 text-gray-400">
                <p className="mb-2 text-2xl">☕</p>
                <p className="text-sm">この日の納品予定はありません。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FloristDashboardPage() {
  const { user, token, logout } = useAuth(); 
  const router = useRouter();
  
  const [floristData, setFloristData] = useState(null);
  const [offers, setOffers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [scheduleEvents, setScheduleEvents] = useState([]); 
  // ★修正箇所 2: 投稿データを保持する state を追加
  const [appealPosts, setAppealPosts] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  
  const [payoutAmount, setPayoutAmount] = useState('');
  const [accountInfo, setAccountInfo] = useState('');

  const MINIMUM_PAYOUT_AMOUNT = 1000;

  // データ取得関数
  const fetchData = async () => {
    if (!token || token === 'null' || token === 'undefined') {
        return;
    }
    
    setLoading(true);
    
    try {
      // ★修正箇所 3: appealPosts の API 呼び出しを追加
      const [dashboardRes, payoutsRes, scheduleRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/api/florists/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/florists/payouts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/florists/schedule`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // 💡 お花屋さん自身のIDをダミーのprojectIdとして投稿データを取得
        fetch(`${API_URL}/api/projects/${user.id}/posts`), 
      ]);

      if (dashboardRes.status === 401 || dashboardRes.status === 403) {
        throw new Error('認証エラー: 再ログインしてください');
      }

      if (!dashboardRes.ok || !payoutsRes.ok) {
        throw new Error('データの取得に失敗しました');
      }
      
      const dashboardData = await dashboardRes.json();
      const payoutsData = await payoutsRes.json();
      const scheduleData = scheduleRes.ok ? await scheduleRes.json() : [];
      const postsData = postsRes.ok ? await postsRes.json() : []; // ★ 投稿データを取得

      setFloristData(dashboardData.florist);
      setOffers(dashboardData.offers || []);
      setPayouts(payoutsData || []);
      setScheduleEvents(scheduleData); 
      // ★修正箇所 4: FLORIST_APPEAL のみフィルタしてセット
      setAppealPosts(postsData.filter(p => p.postType === 'FLORIST_APPEAL') || []); 

    } catch (error) {
      console.error(error);
      toast.error(error.message);
      if (error.message.includes('認証エラー')) {
        logout();
        router.push('/florists/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'FLORIST' && token) {
        fetchData();
    }
  }, [user, token]); 

  // オファー状態更新 (既存ロジックは省略)
  const handleUpdateOfferStatus = async (offerId, newStatus) => { /* ... */ };
  const handleUpdateProductionStatus = async (projectId, newStatus) => { /* ... */ };
  const handlePayoutSubmit = async (e) => { /* ... */ };
  
  const handleLogout = () => {
      logout();
      toast.success('ログアウトしました。');
      router.push('/florists/login');
  };
      
  if (loading || !floristData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }
  
  const pendingOffers = offers.filter(o => o.status === 'PENDING');
  const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
  const isPayoutDisabled = !payoutAmount || !accountInfo || Number(payoutAmount) < MINIMUM_PAYOUT_AMOUNT || Number(payoutAmount) > (floristData.balance || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-pink-600">お花屋さんダッシュボード</h1>
            <p className="text-sm text-gray-500">ようこそ、{floristData.platformName}さん</p> 
          </div>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
              ログアウト
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* ★★★ 修正箇所 5: 制作アピール投稿フォームをメインエリアの先頭に追加 ★★★ */}
          <div className="mb-8">
              <FloristAppealPostForm onPostSuccess={fetchData} />
          </div>

          {/* 上部スタッツカード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
                title="現在の売上残高" 
                value={`${floristData.balance?.toLocaleString() || 0} pt`} 
                icon={<svg className="w-6 h-6 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            />
            <StatCard 
                title="対応中の企画数" 
                value={`${acceptedOffers.length} 件`} 
                icon={<svg className="w-6 h-6 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
            />
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center border border-slate-100">
               <Link href="/florists/profile/edit" className="w-full"> 
                  <span className="block w-full text-center px-6 py-3 font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors shadow-md">
                    プロフィールを編集
                  </span>
                </Link>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 border border-slate-100">
            {/* タブナビゲーション */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                <button onClick={() => setActiveTab('pending')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'pending' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>新着オファー ({pendingOffers.length})</button>
                <button onClick={() => setActiveTab('accepted')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'accepted' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>対応中の企画 ({acceptedOffers.length})</button>
                <button onClick={() => setActiveTab('schedule')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'schedule' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>スケジュール</button>
                <button onClick={() => setActiveTab('payout')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'payout' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>売上・出金管理</button>
                 {/* ★★★ 制作アピールタブの追加 ★★★ */}
                <button onClick={() => setActiveTab('appeal')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'appeal' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>制作アピール ({appealPosts.length})</button>
              </nav>
            </div>

            <div className="py-6">
              {/* 1. 新着オファー (既存ロジック) */}
              {activeTab === 'pending' && (
                <div className="space-y-4">{/* ... */}</div>
              )}

              {/* 2. 対応中の企画 (既存ロジック) */}
              {activeTab === 'accepted' && (
                <div className="space-y-4">{/* ... */}</div>
              )}

              {/* 3. スケジュール (既存ロジック) */}
              {activeTab === 'schedule' && (
                <CalendarView events={scheduleEvents} />
              )}

              {/* 4. 売上・出金管理 (既存ロジック) */}
               {activeTab === 'payout' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{/* ... */}</div>
              )}
              
               {/* ★★★ 5. 制作アピール一覧 (新規追加) ★★★ */}
              {activeTab === 'appeal' && (
                <div className="space-y-6">
                  {appealPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {appealPosts.map(post => (
                        <div key={post.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                          {/* 画像URLを content から抽出 (簡易版) */}
                          {post.content.match(/\[Image:\s*(.*?)\]/) && (
                            <div className="aspect-[4/3] bg-gray-200">
                                <img 
                                    src={post.content.match(/\[Image:\s*(.*?)\]/)[1]} 
                                    alt="アピール写真" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                          )}
                          <div className="p-4">
                            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString('ja-JP')}</p>
                            {/* 画像URL部分を除去して表示 */}
                            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                                {post.content.replace(/ \[Image:\s*.*?\]/, '')}
                            </p>
                            <div className="mt-4 border-t pt-2 flex justify-end">
                                <button className="text-xs text-red-500 hover:underline">削除</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-gray-500 font-bold mb-2">まだアピール投稿がありません。</p>
                        <p className="text-sm text-gray-400">上のフォームからあなたの制作への想いを投稿してみましょう！</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  );
}