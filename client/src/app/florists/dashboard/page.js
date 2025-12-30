'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import ApprovalPendingCard from '@/components/dashboard/ApprovalPendingCard'; 
import FloristAppealPostForm from '@/components/dashboard/FloristAppealPostForm';

import { 
  FiCheckCircle, FiFileText, FiRefreshCw, FiCalendar, FiMapPin, 
  FiClock, FiChevronLeft, FiChevronRight, FiCamera, FiUser, 
  FiShare, FiEye, FiEyeOff, FiTrash2, FiDollarSign, FiLogOut, FiSettings, FiArrowRight,
  FiBriefcase, FiAlertCircle
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// StatCard Component
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4">
    <div className="bg-sky-100 p-3 rounded-full text-sky-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-bold">{title}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
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

// --- カレンダーコンポーネント ---
function CalendarView({ events }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));

  const selectedEvents = events.filter(e => 
    new Date(e.date).toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
      <div className="lg:w-2/3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{year}年 {month + 1}月</h3>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><FiChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 font-medium">今日</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><FiChevronRight size={20}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={i} className={`text-xs font-bold uppercase tracking-wider ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} className="min-h-[80px] bg-gray-50/30 rounded-lg"></div>;
            const dayEvents = events.filter(e => new Date(e.date).toDateString() === date.toDateString());
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();
            return (
              <div key={idx} onClick={() => setSelectedDate(date)} className={`min-h-[80px] border rounded-lg p-1 cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' : isToday ? 'border-sky-300 bg-sky-50' : 'border-slate-100 hover:border-pink-300 hover:bg-slate-50'}`}>
                <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-500 text-white' : 'text-gray-700'}`}>{date.getDate()}</span>
                    {dayEvents.length > 0 && <span className="w-2 h-2 bg-pink-500 rounded-full"></span>}
                </div>
                <div className="space-y-1 overflow-hidden mt-1">
                  {dayEvents.slice(0, 2).map(e => (<div key={e.id} className="text-[9px] bg-white border border-indigo-100 text-indigo-700 px-1 py-0.5 rounded truncate shadow-sm">{e.title}</div>))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="lg:w-1/3 space-y-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-3 flex items-center"><FiCalendar className="mr-2 text-pink-500"/> {selectedDate.toLocaleDateString('ja-JP')} の予定</h3>
          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            {selectedEvents.length > 0 ? selectedEvents.map(event => (
              <Link key={event.id} href={`/florists/projects/${event.projectId || event.id}`} className="block group">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 group-hover:border-pink-400 group-hover:bg-pink-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold flex items-center text-gray-600 bg-white px-2 py-0.5 rounded border"><FiClock className="mr-1"/> {new Date(event.date).getHours()}:{String(new Date(event.date).getMinutes()).padStart(2, '0')}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{STATUS_LABELS[event.status] || '進行中'}</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-700">{event.title}</h4>
                  <div className="text-xs text-gray-500 flex items-start gap-1"><FiMapPin className="shrink-0 mt-0.5 text-gray-400"/><span className="line-clamp-2">{event.location || '場所未定'}</span></div>
                </div>
              </Link>
            )) : (<div className="text-center py-10 text-gray-400"><p className="mb-2 text-2xl">☕</p><p className="text-sm">納品予定はありません。</p></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- メインページ ---
export default function FloristDashboardPage() {
  const { user, logout, isLoading, authenticatedFetch } = useAuth(); 
  const router = useRouter();

  const [data, setData] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const isFetching = useRef(false);

  // データ取得
  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      // dashboardRes, payoutsRes, scheduleRes を並列取得
      const [dashboardRes, scheduleRes] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/florists/profile`),
        authenticatedFetch(`${API_URL}/api/florists/schedule`).catch(() => null)
      ]);

      if (dashboardRes && dashboardRes.ok) {
        const floristDataRes = await dashboardRes.json();
        const scheduleData = (scheduleRes && scheduleRes.ok) ? await scheduleRes.json() : [];
        
        setData({
          ...floristDataRes,
          scheduleEvents: scheduleData
        });
        setErrorInfo(null);
      } else if (dashboardRes && dashboardRes.status === 401) {
        setErrorInfo("API Error: 401");
      }
    } catch (error) {
      console.error(error);
      setErrorInfo(error.message);
    } finally {
      isFetching.current = false;
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (!isLoading && user && user.role === 'FLORIST' && user.status === 'APPROVED') {
      fetchData();
    }
  }, [isLoading, user, fetchData]);

  // ハンドラ: 削除
  const handleDeleteAppealPost = async (postId) => {
    if (!window.confirm("本当に削除しますか？")) return;
    const toastId = toast.loading('削除中...');
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');
      toast.success('削除しました', { id: toastId });
      fetchData();
    } catch (e) { toast.error(e.message, { id: toastId }); }
  };

  // ハンドラ: 公開切り替え
  const handleToggleVisibility = async (post) => {
    const toastId = toast.loading('更新中...');
    try {
      const res = await authenticatedFetch(`${API_URL}/api/florists/posts/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: !post.isPublic })
      });
      if (!res.ok) throw new Error('更新に失敗しました');
      toast.success('更新しました', { id: toastId });
      fetchData();
    } catch (e) { toast.error(e.message, { id: toastId }); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div><p className="text-xs text-slate-400 font-mono">Loading Dashboard...</p></div>;
  }

  if (!user || user.role !== 'FLORIST' || errorInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 flex flex-col items-center max-w-sm w-full shadow-xl">
          <FiAlertCircle size={48} className="text-red-500 mb-4 animate-bounce" />
          <h1 className="text-xl font-bold text-slate-800 mb-2 text-center">セッションエラー</h1>
          <p className="text-xs font-mono text-red-400 mb-6">{errorInfo || 'Auth Sync Failed'}</p>
          <button onClick={() => logout()} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold">再ログインする</button>
        </div>
      </div>
    );
  }

  if (user.status !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <header className="flex justify-between items-center py-4 px-6 bg-white rounded-xl shadow-sm mb-6">
          <h1 className="font-bold text-slate-800">Florist Dashboard</h1>
          <button onClick={() => logout()} className="text-sm text-gray-500 flex items-center gap-1"><FiLogOut/> ログアウト</button>
        </header>
        <div className="max-w-2xl mx-auto mt-10"><ApprovalPendingCard /></div>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">同期中...</div>;
  }

  const { offers = [], appealPosts = [], scheduleEvents = [], balance = 0, platformName, id: floristId } = data;
  const pendingOffers = offers.filter(o => o.status === 'PENDING');
  const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-pink-600 flex items-center gap-2"><FiBriefcase/> お花屋さんダッシュボード</h1>
            <p className="text-sm text-gray-500">ようこそ、{platformName}さん</p> 
          </div>
          <button onClick={() => logout()} className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors">ログアウト</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="animate-fadeIn">
          <FloristAppealPostForm user={user} onPostSuccess={fetchData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="売上残高" value={`${balance.toLocaleString()} pt`} icon={<FiDollarSign size={24}/>} />
          <StatCard title="対応中の企画" value={`${acceptedOffers.length} 件`} icon={<FiCheckCircle size={24}/>} />
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col justify-center">
            <Link href="/florists/profile/edit" className="w-full text-center px-6 py-3 font-bold text-white bg-pink-500 rounded-xl hover:bg-pink-600 shadow-md">プロフィール編集</Link>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-6 border border-slate-100">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'pending', label: '新着オファー', count: pendingOffers.length },
                { id: 'accepted', label: '対応中の企画', count: acceptedOffers.length },
                { id: 'schedule', label: 'スケジュール' },
                { id: 'payout', label: '売上・出金' },
                { id: 'appeal', label: '制作アピール', count: appealPosts.length }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-all ${activeTab === tab.id ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {tab.label} {tab.count !== undefined && `(${tab.count})`}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-6 min-h-[400px]">
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingOffers.length > 0 ? pendingOffers.map(o => (
                  <div key={o.id} className="p-5 bg-pink-50/50 rounded-2xl border border-pink-100 flex justify-between items-center group hover:bg-pink-50 transition-all">
                    <div>
                        <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold">NEW OFFER</span>
                        <p className="font-bold text-gray-800 mt-1">{o.project?.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Link href={`/florists/projects/${o.projectId}`} className="px-6 py-2 bg-white border border-pink-200 text-pink-600 rounded-lg font-bold hover:bg-pink-600 hover:text-white transition-all">詳細を確認</Link>
                  </div>
                )) : <div className="text-center py-20 text-gray-400 font-bold">新着オファーはありません</div>}
              </div>
            )}

            {activeTab === 'accepted' && (
              <div className="space-y-4">
                {acceptedOffers.length > 0 ? acceptedOffers.map(o => (
                  <div key={o.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center hover:border-pink-200 transition-all">
                    <div>
                        <p className="font-bold text-gray-800">{o.project?.title}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-bold">予算: {o.project?.targetAmount?.toLocaleString()} pt</span>
                        </div>
                    </div>
                    <Link href={`/florists/projects/${o.projectId}`} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm">管理画面</Link>
                  </div>
                )) : <div className="text-center py-20 text-gray-400 font-bold">進行中の企画はありません</div>}
              </div>
            )}

            {activeTab === 'schedule' && <CalendarView events={scheduleEvents} />}

            {activeTab === 'payout' && (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="bg-white p-4 rounded-full shadow-md mb-4 text-pink-500"><FiDollarSign size={40}/></div>
                <h3 className="text-xl font-bold text-gray-800">売上管理・出金申請</h3>
                <p className="text-sm text-gray-500 mb-6">振込口座の設定や、現在の利益の引き出しを行います。</p>
                <Link href="/florists/payouts" className="px-8 py-3 bg-pink-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2 hover:bg-pink-700 transition-all">管理ページを開く <FiArrowRight/></Link>
              </div>
            )}

            {activeTab === 'appeal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appealPosts.length > 0 ? appealPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                    <div className={`p-1 text-center font-bold text-[10px] ${post.isPublic ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {post.isPublic ? '公開中' : '非公開'}
                    </div>
                    {post.imageUrl && <div className="relative aspect-video"><Image src={post.imageUrl} alt="" fill className="object-cover" /></div>}
                    <div className="p-4">
                      <p className="text-xs text-gray-400 mb-2">{new Date(post.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{post.content}</p>
                      <div className="mt-4 pt-3 border-t flex justify-end gap-2">
                        <button onClick={() => handleToggleVisibility(post)} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-sky-100 hover:text-sky-600 transition-colors">{post.isPublic ? <FiEyeOff size={16}/> : <FiEye size={16}/>}</button>
                        <button onClick={() => handleDeleteAppealPost(post.id)} className="p-2 bg-slate-100 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"><FiTrash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                )) : <div className="col-span-full text-center py-20 text-gray-400 font-bold">投稿履歴がありません</div>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}