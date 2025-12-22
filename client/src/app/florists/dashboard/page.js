'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import ApprovalPendingCard from '@/components/dashboard/ApprovalPendingCard'; 
import FloristAppealPostForm from '@/components/dashboard/FloristAppealPostForm';

import { 
  FiCheckCircle, FiRefreshCw, FiCalendar, FiMapPin, 
  FiClock, FiChevronLeft, FiChevronRight, FiCamera, FiUser, 
  FiEye, FiEyeOff, FiTrash2, FiDollarSign, FiLogOut, FiSettings, FiArrowRight,
  FiBriefcase, FiAlertCircle
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- コンポーネント: 統計カード ---
const StatCard = ({ title, value, unit, icon, color = "sky", subText }) => {
  const styles = {
    sky: { bg: "bg-sky-50", text: "text-sky-600", iconBg: "bg-sky-100" },
    pink: { bg: "bg-pink-50", text: "text-pink-600", iconBg: "bg-pink-100" },
    green: { bg: "bg-emerald-50", text: "text-emerald-600", iconBg: "bg-emerald-100" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", iconBg: "bg-orange-100" },
  };
  const theme = styles[color] || styles.sky;

  return (
    <div className={`p-5 rounded-2xl border border-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${theme.bg}`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2.5 rounded-xl ${theme.iconBg} ${theme.text}`}>
          {icon}
        </div>
        {subText && <span className="text-[10px] bg-white/60 px-2 py-1 rounded-full text-slate-500 font-medium">{subText}</span>}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-extrabold text-slate-800">
          {value} <span className="text-sm font-medium text-slate-500">{unit}</span>
        </p>
      </div>
    </div>
  );
};

// --- コンポーネント: カレンダー ---
function CalendarView({ events }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  
  // カレンダー生成ロジック
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // 空白埋め
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    // 日付埋め
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    
    return days;
  }, [year, month]);

  const selectedEvents = useMemo(() => {
    return events.filter(e => new Date(e.date).toDateString() === selectedDate.toDateString());
  }, [events, selectedDate]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="flex flex-col xl:flex-row gap-6 animate-fadeIn">
      {/* カレンダー本体 */}
      <div className="xl:w-2/3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FiCalendar className="text-pink-500"/> {year}年 {month + 1}月
          </h3>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all shadow-sm"><FiChevronLeft/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-md transition-all">今日</button>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all shadow-sm"><FiChevronRight/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={i} className={`text-xs font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={idx} className="aspect-square"></div>;
            
            const dateEvents = events.filter(e => new Date(e.date).toDateString() === date.toDateString());
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const hasEvent = dateEvents.length > 0;

            return (
              <div 
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square rounded-xl p-1 cursor-pointer transition-all flex flex-col items-center justify-start relative group border
                  ${isSelected ? 'border-pink-500 bg-pink-50 text-pink-600 ring-1 ring-pink-200' : 
                    isToday ? 'border-sky-200 bg-sky-50 text-sky-700' : 
                    'border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-600'}
                `}
              >
                <span className={`text-sm font-bold z-10 ${hasEvent ? '' : 'opacity-70'}`}>{date.getDate()}</span>
                {/* イベントインジケーター */}
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center content-center w-full px-1">
                  {dateEvents.slice(0, 3).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-pink-400' : 'bg-sky-400'}`}></div>
                  ))}
                  {dateEvents.length > 3 && <span className="text-[8px] text-slate-400 leading-none">+</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細リスト */}
      <div className="xl:w-1/3 flex flex-col h-[500px]">
        <div className="bg-slate-800 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <span className="font-bold">{selectedDate.toLocaleDateString('ja-JP')} の予定</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{selectedEvents.length}件</span>
        </div>
        <div className="bg-white border-x border-b border-slate-200 rounded-b-2xl p-4 flex-1 overflow-y-auto space-y-3">
          {selectedEvents.length > 0 ? selectedEvents.map(event => (
            <Link key={event.id} href={`/florists/my-projects/${event.id}`} className="block group">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm group-hover:border-pink-300 group-hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    <FiClock className="mr-1"/> {new Date(event.date).getHours()}:{String(new Date(event.date).getMinutes()).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700">制作・納品</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-pink-600 mb-1">{event.title}</h4>
                <div className="text-xs text-slate-500 flex items-start gap-1">
                  <FiMapPin className="mt-0.5 shrink-0"/>
                  <span className="line-clamp-1">{event.location || '場所未定'}</span>
                </div>
              </div>
            </Link>
          )) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
              <FiCalendar size={40} className="mb-2"/>
              <p className="text-sm">予定はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- コンポーネント: 案件リスト ---
const OfferListCard = ({ offers, type = "normal" }) => {
  if (!offers || offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <FiRefreshCw size={32} className="mb-2 opacity-50"/>
        <p>該当する案件はありません</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {offers.map((offer) => (
        <div key={offer.id} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-pink-200 transition-all">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {type === 'pending' ? (
                  <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span> 新着オファー
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">進行中</span>
                )}
                <span className="text-xs text-slate-400">{new Date(offer.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-pink-600 transition-colors">
                {offer.projectTitle}
              </h3>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500 mt-2">
                <span className="flex items-center gap-1"><FiUser/> {offer.clientName}様</span>
                <span className="flex items-center gap-1"><FiDollarSign/> 予算: {offer.budget?.toLocaleString()}円</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Link href={`/florists/projects/${offer.projectId}`} className="w-full md:w-auto">
                <button className={`w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'pending' 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 hover:-translate-y-0.5' 
                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}>
                  詳細を確認 <FiArrowRight />
                </button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- メインページ ---
export default function FloristDashboardPage() {
  const { user, token, logout, isPending, isApproved, loading: authLoading } = useAuth(); 
  const router = useRouter();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  // データ取得
  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // ダッシュボード用の統合APIを想定
      const res = await fetch(`${API_URL}/api/florists/dashboard`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) throw new Error('認証切れ');
      if (!res.ok) throw new Error('データ取得失敗');
      
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
      if (error.message === '認証切れ') {
        logout();
        router.push('/florists/login');
      } else {
        toast.error('データの更新に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, router]); 

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/florists/login');
      else if (user.role !== 'FLORIST') router.push('/'); // 権限違い
      else if (isApproved) fetchData();
    }
  }, [user, authLoading, isApproved, fetchData, router]); 

  // --- アクション ---
  const handleLogout = () => {
      logout();
      toast.success('ログアウトしました');
      router.push('/florists/login');
  };

  const handleDeletePost = async (postId) => {
    if(!confirm('本当に削除しますか？')) return;
    const toastId = toast.loading('削除中...');
    try {
        await fetch(`${API_URL}/api/florists/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('削除しました', { id: toastId });
        fetchData();
    } catch(e) { toast.error('失敗しました', { id: toastId }); }
  };

  const handleTogglePost = async (post) => {
    try {
        await fetch(`${API_URL}/api/florists/posts/${post.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ isPublic: !post.isPublic })
        });
        toast.success(post.isPublic ? '非公開にしました' : '公開しました');
        fetchData();
    } catch(e) { toast.error('更新失敗'); }
  };

  // --- レンダリング ---
  if (authLoading || (loading && !data)) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div></div>;
  }

  // 審査待ち・却下
  if (isPending || !isApproved) {
      return (
        <div className="min-h-screen bg-slate-50 p-4">
            <header className="flex justify-between items-center py-4 px-6 bg-white rounded-xl shadow-sm mb-6">
                <h1 className="font-bold text-gray-700">Florist Dashboard</h1>
                <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"><FiLogOut/> ログアウト</button>
            </header>
            <div className="max-w-2xl mx-auto mt-10">
                <ApprovalPendingCard />
            </div>
        </div>
      );
  }

  const { offers = [], appealPosts = [], schedule = [], balance = 0 } = data || {};
  const pendingOffers = offers.filter(o => o.status === 'PENDING');
  const activeOffers = offers.filter(o => o.status !== 'PENDING' && o.status !== 'REJECTED' && o.status !== 'COMPLETED');

  // スケジュールデータ整形
  const calendarEvents = schedule.map(ev => ({
      ...ev,
      date: new Date(ev.deliveryDate || ev.date),
      title: ev.projectTitle || 'タイトルなし',
      location: ev.venueName
  }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-600 pb-20">
      
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-pink-100 text-pink-600 p-1.5 rounded-lg"><FiBriefcase /></span>
            <span className="font-bold text-slate-800 hidden sm:inline">Florist Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400">Login as</p>
                <p className="text-sm font-bold text-slate-700">{user.shopName}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2" title="ログアウト">
                <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* 上部: 投稿フォーム & KPI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg shadow-pink-200 mb-6 flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-1">Welcome Back!</h2>
                        <p className="opacity-90 text-sm">今日の実績をアピールして、新しいファンを獲得しましょう。</p>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform origin-bottom-left"></div>
                </div>
                <FloristAppealPostForm user={user} onPostSuccess={fetchData} />
             </div>

             <div className="space-y-4">
                <StatCard 
                    title="進行中の案件" 
                    value={activeOffers.length} 
                    unit="件"
                    icon={<FiRefreshCw size={24} />} 
                    color="green"
                    subText="要対応"
                />
                <StatCard 
                    title="現在の売上残高" 
                    value={balance.toLocaleString()} 
                    unit="pt"
                    icon={<FiDollarSign size={24} />} 
                    color="pink"
                />
                <Link href="/florists/settings" className="block p-4 bg-slate-800 text-white rounded-2xl text-center hover:bg-slate-700 transition-colors shadow-md">
                    <span className="flex items-center justify-center gap-2 font-bold">
                        <FiSettings /> プロフィール編集
                    </span>
                </Link>
             </div>
          </div>

          {/* メインエリア: タブ切り替え */}
          <div className="space-y-6">
            {/* タブメニュー */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'pending', label: '新着オファー', icon: <FiAlertCircle/>, count: pendingOffers.length },
                    { id: 'accepted', label: '進行中の企画', icon: <FiRefreshCw/>, count: activeOffers.length },
                    { id: 'schedule', label: 'スケジュール', icon: <FiCalendar/> },
                    { id: 'appeal', label: 'アピール投稿', icon: <FiCamera/> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all
                            ${activeTab === tab.id 
                                ? 'bg-white text-pink-600 shadow-md ring-1 ring-pink-100' 
                                : 'bg-slate-100 text-slate-500 hover:bg-white hover:text-slate-700'}
                        `}
                    >
                        {tab.icon} {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-pink-100 text-pink-700' : 'bg-slate-200 text-slate-600'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* タブコンテンツ */}
            <div className="animate-fadeIn">
                {activeTab === 'pending' && <OfferListCard offers={pendingOffers} type="pending" />}
                {activeTab === 'accepted' && <OfferListCard offers={activeOffers} type="normal" />}
                {activeTab === 'schedule' && <CalendarView events={calendarEvents} />}
                
                {activeTab === 'appeal' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {appealPosts.map(post => (
                            <div key={post.id} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-sm">
                                {post.imageUrl ? (
                                    <Image src={post.imageUrl} alt="" fill className="object-cover transition-transform group-hover:scale-105" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300"><FiCamera size={32}/></div>
                                )}
                                {/* オーバーレイ */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleTogglePost(post)} className="p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white hover:text-slate-800 transition-colors">
                                            {post.isPublic ? <FiEye/> : <FiEyeOff/>}
                                        </button>
                                        <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-red-500/80 backdrop-blur rounded-full text-white hover:bg-red-600 transition-colors">
                                            <FiTrash2/>
                                        </button>
                                    </div>
                                    <p className="text-white text-xs line-clamp-2">{post.content}</p>
                                </div>
                                {/* 公開ステータスバッジ */}
                                {!post.isPublic && (
                                    <div className="absolute top-2 left-2 bg-slate-800/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur">
                                        非公開
                                    </div>
                                )}
                            </div>
                        ))}
                        {appealPosts.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                <FiCamera size={40} className="mx-auto mb-2 opacity-50"/>
                                <p>投稿履歴がありません</p>
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