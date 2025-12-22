'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext'; // パスはプロジェクト構成に合わせて調整してください
import ApprovalPendingCard from '@/components/dashboard/ApprovalPendingCard'; 
import FloristAppealPostForm from '@/components/dashboard/FloristAppealPostForm';

import { 
  FiCheckCircle, FiFileText, FiRefreshCw, FiCalendar, FiMapPin, 
  FiClock, FiChevronLeft, FiChevronRight, FiCamera, FiUser, 
  FiShare, FiEye, FiEyeOff, FiTrash2, FiDollarSign, FiLogOut, FiSettings, FiArrowRight
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- コンポーネント定義 ---

// 統計カード
const StatCard = ({ title, value, icon, color = "sky" }) => {
  const colorClasses = {
    sky: "bg-sky-100 text-sky-600",
    pink: "bg-pink-100 text-pink-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
      <div className={`p-3 rounded-full ${colorClasses[color] || colorClasses.sky}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

// ステータスの日本語変換マップ
const STATUS_LABELS = {
  'PENDING': '承認待ち',
  'ACCEPTED': '受注済み',
  'NOT_STARTED': '未着手',
  'FLORIST_MATCHED': '相談中',
  'DESIGN_FIXED': 'デザイン決定',
  'PANELS_RECEIVED': 'パネル受取済',
  'IN_PRODUCTION': '制作中',
  'PRE_COMPLETION': '前日写真UP済',
  'COMPLETED': '完了',
  'FUNDRAISING': '募集中'
};

// カレンダーコンポーネント
function CalendarView({ events }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days = [];
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

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
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiCalendar className="text-pink-500"/> {year}年 {month + 1}月
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
            if (!date) return <div key={idx} className="min-h-[80px] bg-gray-50/30 rounded-lg"></div>;
            
            const dayEvents = events.filter(e => new Date(e.date).toDateString() === date.toDateString());
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();

            return (
              <div 
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`min-h-[80px] border rounded-lg p-1 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' : 
                  isToday ? 'border-sky-300 bg-sky-50' : 'border-slate-100 hover:border-pink-300 hover:bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-500 text-white' : 'text-gray-700'}`}>
                    {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && <span className="w-2 h-2 bg-pink-500 rounded-full"></span>}
                </div>
                
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
      <div className="lg:w-1/3">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
            {selectedDate.toLocaleDateString('ja-JP')} の予定
          </h3>
          
          <div className="space-y-3 overflow-y-auto flex-1 max-h-[500px] scrollbar-thin scrollbar-thumb-gray-200">
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
              <div className="text-center py-10 text-gray-400 flex flex-col items-center justify-center h-full">
                <p className="mb-2 text-4xl">☕</p>
                <p className="text-sm">この日の納品予定はありません。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 案件リストカード
const OfferListCard = ({ offers, emptyMessage, type = "normal" }) => {
  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {offers.map((offer) => (
        <div key={offer.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${type === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {STATUS_LABELS[offer.status] || offer.status}
              </span>
              <span className="text-xs text-gray-500">{new Date(offer.createdAt || Date.now()).toLocaleDateString('ja-JP')} 受信</span>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">{offer.projectTitle || 'タイトル未定の案件'}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <FiUser className="inline" /> {offer.clientName || 'クライアント'} 様 
              <span className="text-gray-300">|</span> 
              <FiDollarSign className="inline" /> 予算: {offer.budget?.toLocaleString()}円
            </p>
          </div>
          <Link href={`/projects/${offer.projectId || offer.id}`} className="w-full md:w-auto">
            <button className={`w-full md:w-auto px-6 py-2 rounded-full font-bold transition-colors flex items-center justify-center gap-2 ${type === 'pending' ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              詳細を見る <FiArrowRight />
            </button>
          </Link>
        </div>
      ))}
    </div>
  );
};

// --- メインページコンポーネント ---

export default function FloristDashboardPage() {
  const { user, token, logout, isPending, isApproved } = useAuth(); 
  const router = useRouter();
  
  const [floristData, setFloristData] = useState(null);
  const [offers, setOffers] = useState([]);
  const [scheduleEvents, setScheduleEvents] = useState([]); 
  const [appealPosts, setAppealPosts] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  // データ取得関数
  const fetchData = useCallback(async () => {
    // 承認待ちの場合はダッシュボードデータ不要
    if (user && user.role === 'FLORIST' && (isPending || !isApproved)) {
        setLoading(false);
        return; 
    }
    
    if (!token) return;
    
    setLoading(true);
    
    try {
      // NOTE: 実際の実装ではAPIエンドポイントを適切に設定してください
      const [dashboardRes, scheduleRes] = await Promise.all([
        fetch(`${API_URL}/api/florists/dashboard`, { 
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/florists/schedule`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (dashboardRes.status === 401 || dashboardRes.status === 403) {
        throw new Error('認証エラー: 再ログインしてください');
      }

      if (!dashboardRes.ok) {
        throw new Error('データの取得に失敗しました');
      }
      
      const floristDataRes = await dashboardRes.json();
      const scheduleData = scheduleRes.ok ? await scheduleRes.json() : [];

      setFloristData(floristDataRes);
      setOffers(floristDataRes.offers || []);
      setAppealPosts(floristDataRes.appealPosts || []);
      
      // スケジュールイベントの整形 (APIレスポンスに合わせて調整)
      setScheduleEvents(scheduleData.map(ev => ({
        ...ev,
        date: new Date(ev.deliveryDate || ev.date), // 日付型に変換
      }))); 

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
  }, [user, token, logout, router, isPending, isApproved]); 

  // 初期ロード
  useEffect(() => {
    if (user && user.role === 'FLORIST' && token) {
        fetchData();
    } else if (user && user.role !== 'FLORIST') {
        router.push('/');
    } else if (!user && !loading) {
        router.push('/florists/login');
    }
  }, [user, token, fetchData, loading, router]); 
  
  // --- イベントハンドラ ---

  const handleDeleteAppealPost = async (post) => {
      if (!window.confirm("この投稿を本当に削除しますか？")) return;
      
      const toastId = toast.loading('投稿を削除中...');
      try {
          const res = await fetch(`${API_URL}/api/florists/posts/${post.id}`, { 
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
          });

          if (!res.ok) throw new Error('削除処理に失敗しました。');
          
          toast.success('投稿を削除しました。', { id: toastId });
          fetchData(); // リスト更新
      } catch (error) {
          toast.error(error.message, { id: toastId });
      }
  };
  
  const handleToggleVisibility = async (post) => {
      const newStatus = !post.isPublic;
      const toastId = toast.loading(newStatus ? '公開設定中...' : '非公開設定中...');

      try {
          const res = await fetch(`${API_URL}/api/florists/posts/${post.id}`, { 
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ isPublic: newStatus }),
          });

          if (!res.ok) throw new Error('更新に失敗しました。');
          
          toast.success(newStatus ? '公開しました' : '非公開にしました', { id: toastId });
          fetchData(); 
      } catch (error) {
          toast.error(error.message, { id: toastId });
      }
  };
  
  const handleLogout = () => {
      logout();
      toast.success('ログアウトしました。');
      router.push('/florists/login');
  };

  // --- レンダリング制御 ---

  if (loading || (!user && loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // 審査ステータス判定
  if (isPending || !isApproved) {
      return <ApprovalPendingCard />;
  }

  if (!floristData) return null;

  const pendingOffers = offers.filter(o => o.status === 'PENDING');
  const acceptedOffers = offers.filter(o => o.status !== 'PENDING' && o.status !== 'REJECTED');

  

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
            <p className="text-sm text-gray-500">
              <span className="text-pink-500 font-bold">{floristData.platformName}</span> 様の管理画面
            </p> 
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-500 transition-colors px-4 py-2 hover:bg-red-50 rounded-lg">
              <FiLogOut /> ログアウト
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          {/* 上部エリア: 投稿フォームとスタッツ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
             {/* 左カラム: アピール投稿 */}
             <div className="lg:col-span-2">
                <FloristAppealPostForm onPostSuccess={fetchData} />
             </div>

             {/* 右カラム: スタッツ & アクション */}
             <div className="space-y-6">
                <StatCard 
                    title="現在の売上残高" 
                    value={`${floristData.balance?.toLocaleString() || 0} pt`} 
                    icon={<FiDollarSign className="w-6 h-6" />}
                    color="sky"
                />
                <StatCard 
                    title="進行中の企画" 
                    value={`${acceptedOffers.length} 件`} 
                    icon={<FiRefreshCw className="w-6 h-6" />}
                    color="green"
                />
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-4">店舗情報の更新はこちら</p>
                    <Link href="/florists/profile/edit" className="w-full"> 
                      <span className="flex items-center justify-center w-full px-6 py-3 font-bold text-white bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors shadow-md">
                        <FiSettings className="mr-2"/> プロフィール編集
                      </span>
                    </Link>
                </div>
             </div>
          </div>

          {/* メインコンテンツタブエリア */}
          <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden min-h-[600px]">
            {/* タブナビゲーション */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex min-w-max px-6">
                {[
                  { id: 'pending', label: '新着オファー', count: pendingOffers.length },
                  { id: 'accepted', label: '対応中の企画', count: acceptedOffers.length },
                  { id: 'schedule', label: 'スケジュール' },
                  { id: 'payout', label: '売上・出金管理' },
                  { id: 'appeal', label: '制作アピール履歴', count: appealPosts.length },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)} 
                    className={`whitespace-nowrap py-4 px-6 border-b-2 font-bold text-sm transition-colors flex items-center gap-2
                      ${activeTab === tab.id 
                        ? 'border-pink-500 text-pink-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6 lg:p-8">
              {/* 1. 新着オファー */}
              {activeTab === 'pending' && (
                <OfferListCard 
                  offers={pendingOffers} 
                  type="pending"
                  emptyMessage="現在、新しいオファーはありません。" 
                />
              )}

              {/* 2. 対応中の企画 */}
              {activeTab === 'accepted' && (
                <OfferListCard 
                  offers={acceptedOffers} 
                  type="normal"
                  emptyMessage="現在対応中の企画はありません。" 
                />
              )}

              {/* 3. スケジュール */}
              {activeTab === 'schedule' && (
                <CalendarView events={scheduleEvents} />
              )}

              {/* 4. 売上・出金管理 */}
               {activeTab === 'payout' && (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
                  <div className="bg-pink-50 p-6 rounded-full mb-6">
                    <FiDollarSign className="w-12 h-12 text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">売上管理・出金申請</h3>
                  <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
                    現在の売上ポイントの確認、銀行口座の登録、<br/>および出金申請はこちらの専用ページから行えます。
                  </p>
                  
                  <Link 
                    href="/florists/payouts" 
                    className="group px-8 py-4 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 transition-all shadow-lg hover:shadow-pink-200 flex items-center gap-3"
                  >
                    売上管理ページへ移動 <FiChevronRight className="group-hover:translate-x-1 transition-transform"/>
                  </Link>
                </div>
              )}
              
               {/* 5. 制作アピール一覧 */}
              {activeTab === 'appeal' && (
                <div className="space-y-6 animate-fadeIn">
                  {appealPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {appealPosts.map(post => {
                          const isPublic = post.isPublic !== false;
                          return (
                              <div key={post.id} className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
                                 {/* 公開ステータスバッジ */}
                                 <div className={`py-1 text-center font-bold text-xs tracking-wide ${isPublic ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                                    {isPublic ? '公開中' : '非公開 (下書き)'}
                                </div>
                                <div className="relative group">
                                    {post.imageUrl ? (
                                        <div className="relative aspect-[4/3] bg-gray-100">
                                            <Image 
                                                src={post.imageUrl} 
                                                alt="Post image" 
                                                fill
                                                className="object-cover" 
                                            />
                                        </div>
                                    ) : (
                                      <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center text-gray-300">
                                        <FiCamera size={32}/>
                                      </div>
                                    )}
                                    {/* ホバー時のアクションオーバーレイ */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button 
                                            onClick={() => handleToggleVisibility(post)} 
                                            className="p-3 bg-white rounded-full text-gray-800 hover:text-pink-600 shadow-lg"
                                            title={isPublic ? "非公開にする" : "公開する"}
                                        >
                                            {isPublic ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteAppealPost(post)} 
                                            className="p-3 bg-white rounded-full text-red-500 hover:bg-red-50 shadow-lg"
                                            title="削除"
                                        >
                                            <FiTrash2 size={20}/>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <p className="text-xs text-gray-400 mb-2">{new Date(post.createdAt).toLocaleDateString('ja-JP')}</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                                        {post.content}
                                    </p>
                                </div>
                              </div>
                          );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                          <FiCamera className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-bold mb-2">まだアピール投稿がありません</p>
                        <p className="text-sm text-gray-400">ページ上部のフォームから、過去の制作事例や<br/>あなたのこだわりを投稿してみましょう！</p>
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