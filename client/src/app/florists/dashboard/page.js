'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import ApprovalPendingCard from '@/components/dashboard/ApprovalPendingCard'; 
import FloristAppealPostForm from '@/components/dashboard/FloristAppealPostForm';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { 
  CheckCircle2, FileText, Calendar, MapPin, 
  Clock, ChevronLeft, ChevronRight, Camera, User, 
  Eye, EyeOff, Trash2, DollarSign, LogOut, ArrowRight,
  Briefcase, AlertCircle, Loader2, Star, Image as ImageIcon, Send
} from 'lucide-react'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// 🎨 Glassmorphism UI Components
const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-8", className)}>
    {children}
  </div>
);

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: "easeOut" }}>
    {children}
  </motion.div>
);

const JpText = ({ children, className }) => <span className={cn("inline-block", className)}>{children}</span>;

const StatCard = ({ title, value, icon: Icon, color = "sky" }) => {
  const colors = {
    sky: "bg-sky-50 text-sky-500 border-sky-100",
    pink: "bg-pink-50 text-pink-500 border-pink-100",
    emerald: "bg-emerald-50 text-emerald-500 border-emerald-100",
  };
  return (
    <div className="bg-white/60 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
      <div className={cn("p-4 rounded-[1.5rem] border shadow-inner", colors[color])}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
      </div>
    </div>
  );
};

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

  const selectedEvents = events.filter(e => new Date(e.date).toDateString() === selectedDate.toDateString());

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-6 md:gap-8">
      {/* カレンダー本体 */}
      <div className="lg:w-2/3 bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">{year}年 {month + 1}月</h3>
          <div className="flex gap-2 bg-white rounded-full p-1 border border-slate-200 shadow-sm">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><ChevronLeft size={18}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1 text-xs font-black text-slate-600 rounded-full hover:bg-slate-100 transition-colors">今日</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><ChevronRight size={18}/></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 text-center mb-3">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={i} className={cn("text-[10px] font-black uppercase tracking-widest", i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-slate-400')}>{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} className="min-h-[80px] md:min-h-[100px] bg-transparent"></div>;
            const dayEvents = events.filter(e => new Date(e.date).toDateString() === date.toDateString());
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();
            
            return (
              <div key={idx} onClick={() => setSelectedDate(date)} 
                className={cn(
                  "min-h-[80px] md:min-h-[100px] rounded-2xl p-2 cursor-pointer transition-all flex flex-col justify-start border-2",
                  isSelected ? 'border-pink-400 bg-pink-50 shadow-md ring-4 ring-pink-100/50' : 
                  isToday ? 'border-sky-200 bg-white shadow-sm' : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
                )}
              >
                <div className="flex justify-between items-start mb-1">
                    <span className={cn("text-xs font-black w-6 h-6 flex items-center justify-center rounded-full", isToday ? 'bg-sky-500 text-white' : isSelected ? 'text-pink-600' : 'text-slate-600')}>{date.getDate()}</span>
                    {dayEvents.length > 0 && <span className="w-2 h-2 bg-pink-500 rounded-full mt-1.5 mr-1 shadow-sm shadow-pink-200"></span>}
                </div>
                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className="text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md truncate shadow-sm">
                      {e.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* スケジュール詳細 */}
      <div className="lg:w-1/3 space-y-4">
        <div className="bg-white/60 p-6 md:p-8 rounded-[2rem] border border-white shadow-sm h-full backdrop-blur-md">
          <h3 className="text-sm font-black text-slate-700 mb-6 flex items-center gap-2 uppercase tracking-widest"><Calendar className="text-pink-500" size={18}/> {selectedDate.toLocaleDateString('ja-JP')} の予定</h3>
          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 no-scrollbar">
            {selectedEvents.length > 0 ? selectedEvents.map(event => (
              <Link key={event.id} href={`/florists/projects/${event.projectId || event.id}`} className="block group">
                <div className="p-4 md:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:border-pink-300 group-hover:shadow-md transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black flex items-center text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Clock className="mr-1.5" size={12}/> {new Date(event.date).getHours()}:{String(new Date(event.date).getMinutes()).padStart(2, '0')}</span>
                    <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-black uppercase tracking-widest">{STATUS_LABELS[event.status] || '進行中'}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2 group-hover:text-pink-600 transition-colors leading-snug">{event.title}</h4>
                  <div className="text-xs font-bold text-slate-400 flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg"><MapPin className="shrink-0 text-slate-300" size={14}/><span className="line-clamp-2">{event.location || '場所未定'}</span></div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="mb-3 text-3xl opacity-50">🌿</p>
                <p className="text-xs font-bold text-slate-400">納品予定はありません。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- メインページコンテンツ ---
function DashboardContent() {
  const { user, logout, isLoading, authenticatedFetch } = useAuth(); 
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const isFetching = useRef(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const [dashboardRes, scheduleRes] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/florists/profile`),
        authenticatedFetch(`${API_URL}/api/florists/schedule`).catch(() => null)
      ]);

      if (dashboardRes && dashboardRes.ok) {
        const floristDataRes = await dashboardRes.json();
        const scheduleData = (scheduleRes && scheduleRes.ok) ? await scheduleRes.json() : [];
        setData({ ...floristDataRes, scheduleEvents: scheduleData });
        setErrorInfo(null);
      } else if (dashboardRes && dashboardRes.status === 401) {
        setErrorInfo("API Error: 401");
      }
    } catch (error) {
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
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-pink-500 mb-4" size={40}/><p className="text-xs font-black tracking-widest text-slate-400 uppercase">Loading Dashboard...</p></div>;
  }

  if (!user || user.role !== 'FLORIST' || errorInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-[3rem] border border-red-100 flex flex-col items-center max-w-md w-full shadow-2xl">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner"><AlertCircle size={40} /></div>
          <h1 className="text-2xl font-black text-slate-800 mb-2 text-center tracking-tighter">セッションエラー</h1>
          <p className="text-xs font-bold text-slate-400 mb-8 text-center leading-relaxed">認証情報が確認できませんでした。<br/>再度ログインをお試しください。</p>
          <button onClick={() => logout()} className="w-full py-4 bg-slate-900 text-white rounded-full font-black hover:bg-slate-800 transition-colors shadow-lg">再ログインする</button>
        </div>
      </div>
    );
  }

  if (user.status !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
        <header className="flex justify-between items-center py-4 px-6 md:px-8 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white max-w-5xl mx-auto mt-6 relative z-10">
          <h1 className="font-black text-slate-800 flex items-center gap-2"><Briefcase className="text-pink-500" size={18}/> Florist Dashboard</h1>
          <button onClick={() => logout()} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"><LogOut size={14}/> ログアウト</button>
        </header>
        <div className="max-w-2xl mx-auto mt-12 relative z-10"><ApprovalPendingCard /></div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-pink-500" size={40}/></div>;

  const { offers = [], appealPosts = [], scheduleEvents = [], balance = 0, platformName } = data;
  const pendingOffers = offers.filter(o => o.status === 'PENDING');
  const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-24 relative overflow-hidden">
      {/* 背景の装飾 */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-pink-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-sky-100/30 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto py-5 px-6 lg:px-8 flex justify-between items-center">
          <div>
            <p className="text-[9px] md:text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-0.5">Professional Menu</p>
            <h1 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tighter"><Briefcase className="text-slate-400 hidden sm:block" size={20}/> お花屋さんダッシュボード</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">{platformName} さん</span>
            <button onClick={() => logout()} className="w-10 h-10 md:w-auto md:h-auto md:px-5 md:py-2.5 bg-white border border-slate-200 rounded-full text-slate-500 md:text-xs font-black hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5 shadow-sm transition-all">
              <LogOut size={16}/> <span className="hidden md:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-12 relative z-10">
        
        {/* Appeal Post Form */}
        <Reveal>
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-sm p-6 md:p-8">
            <FloristAppealPostForm user={user} onPostSuccess={fetchData} />
          </div>
        </Reveal>

        {/* Stats */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard title="現在の売上残高" value={`${balance.toLocaleString()} pt`} icon={DollarSign} color="emerald" />
            <StatCard title="対応中の企画" value={`${acceptedOffers.length} 件`} icon={CheckCircle2} color="sky" />
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-700 shadow-xl flex flex-col justify-center items-center text-center group transition-transform hover:-translate-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Shop Profile</p>
              <Link href="/florists/profile/edit" className="w-full px-6 py-3.5 font-black text-slate-900 bg-white rounded-full hover:bg-pink-50 transition-colors shadow-md flex items-center justify-center gap-2">
                プロフィールを編集 <ArrowRight size={16} className="text-pink-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Main Tab Area */}
        <Reveal delay={0.2}>
          <GlassCard className="!p-0 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-4 md:px-8 overflow-x-auto no-scrollbar">
              <nav className="flex gap-2 md:gap-4 py-4 min-w-max">
                {[
                  { id: 'pending', label: '新着オファー', count: pendingOffers.length, icon: Star },
                  { id: 'accepted', label: '対応中の企画', count: acceptedOffers.length, icon: CheckCircle2 },
                  { id: 'schedule', label: 'スケジュール', icon: Calendar },
                  { id: 'payout', label: '売上・出金', icon: DollarSign },
                  { id: 'appeal', label: '制作アピール', count: appealPosts.length, icon: Camera }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                    className={cn(
                      "px-5 py-3 rounded-full font-black text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm border",
                      activeTab === tab.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-pink-300 hover:text-pink-500'
                    )}>
                    <tab.icon size={16} className={activeTab === tab.id ? "text-pink-400" : ""}/>
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px]", activeTab === tab.id ? "bg-white/20" : "bg-slate-100 text-slate-400")}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6 md:p-10 min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  
                  {/* --- PENDING OFFERS --- */}
                  {activeTab === 'pending' && (
                    <div className="space-y-4">
                      {pendingOffers.length > 0 ? pendingOffers.map(o => (
                        <div key={o.id} className="p-6 bg-pink-50/50 rounded-[2rem] border-2 border-pink-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:bg-pink-50 transition-all shadow-sm">
                          <div>
                              <span className="text-[10px] bg-pink-500 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">New Offer</span>
                              <h3 className="font-black text-slate-800 text-lg mt-3 mb-1 line-clamp-1 group-hover:text-pink-600 transition-colors">{o.project?.title}</h3>
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> 依頼日: {new Date(o.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Link href={`/florists/projects/${o.projectId}`} className="w-full md:w-auto text-center px-8 py-3.5 bg-white border-2 border-pink-200 text-pink-600 rounded-full font-black hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all shadow-sm">詳細を確認する</Link>
                        </div>
                      )) : (
                        <div className="text-center py-32 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                          <Star className="mx-auto text-slate-300 mb-4" size={48}/>
                          <p className="text-slate-500 font-bold">新着の制作オファーはありません。</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- ACCEPTED OFFERS --- */}
                  {activeTab === 'accepted' && (
                    <div className="space-y-4">
                      {acceptedOffers.length > 0 ? acceptedOffers.map(o => (
                        <div key={o.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-sky-300 hover:shadow-md transition-all group">
                          <div>
                              <h3 className="font-black text-slate-800 text-lg mb-3 line-clamp-1 group-hover:text-sky-600 transition-colors">{o.project?.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                  <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1 rounded-md font-black flex items-center gap-1 uppercase tracking-widest"><DollarSign size={12}/> 予算: {o.project?.targetAmount?.toLocaleString()} pt</span>
                                  <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-3 py-1 rounded-md font-black flex items-center gap-1 uppercase tracking-widest"><Calendar size={12}/> 納品: {new Date(o.project?.deliveryDateTime).toLocaleDateString()}</span>
                              </div>
                          </div>
                          <Link href={`/florists/projects/${o.projectId}`} className="w-full md:w-auto text-center px-8 py-3.5 bg-slate-900 text-white rounded-full font-black text-sm hover:bg-slate-800 shadow-md transition-colors flex items-center justify-center gap-2">
                            管理画面へ <ArrowRight size={16}/>
                          </Link>
                        </div>
                      )) : (
                        <div className="text-center py-32 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                          <CheckCircle2 className="mx-auto text-slate-300 mb-4" size={48}/>
                          <p className="text-slate-500 font-bold">進行中の企画はありません。</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- SCHEDULE --- */}
                  {activeTab === 'schedule' && <CalendarView events={scheduleEvents} />}

                  {/* --- PAYOUT --- */}
                  {activeTab === 'payout' && (
                    <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-br from-emerald-50/50 to-sky-50/50 rounded-[3rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                      <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl mb-6 text-emerald-500 flex items-center justify-center rotate-3 border-4 border-emerald-50 relative z-10"><DollarSign size={48} strokeWidth={3}/></div>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 tracking-tighter relative z-10">売上管理・出金申請</h3>
                      <p className="text-sm font-bold text-slate-500 mb-8 relative z-10 leading-relaxed">銀行口座の設定や、<br className="md:hidden"/>確定した売上の引き出し手続きを行います。</p>
                      <Link href="/florists/payouts" className="px-10 py-4 bg-emerald-500 text-white font-black rounded-full shadow-lg flex items-center gap-2 hover:bg-emerald-600 hover:scale-105 transition-all relative z-10 text-lg">
                        出金管理ページへ <ArrowRight size={20}/>
                      </Link>
                    </div>
                  )}

                  {/* --- APPEAL POSTS --- */}
                  {activeTab === 'appeal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {appealPosts.length > 0 ? appealPosts.map(post => (
                        <div key={post.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
                          <div className={cn("p-2 text-center font-black text-[10px] tracking-widest uppercase", post.isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
                            {post.isPublic ? '公開中' : '非公開 (下書き)'}
                          </div>
                          {post.imageUrl && (
                            <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
                              <Image src={post.imageUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                            </div>
                          )}
                          <div className="p-5 flex flex-col flex-grow">
                            <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> {new Date(post.createdAt).toLocaleDateString()}</p>
                            <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed mb-4 line-clamp-4 flex-grow"><JpText>{post.content}</JpText></p>
                            
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 mt-auto">
                              <button onClick={() => handleToggleVisibility(post)} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full text-slate-500 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors shadow-sm" title={post.isPublic ? "非公開にする" : "公開する"}>
                                {post.isPublic ? <EyeOff size={16}/> : <Eye size={16}/>}
                              </button>
                              <button onClick={() => handleDeleteAppealPost(post.id)} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm" title="削除">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      )) : <div className="col-span-full text-center py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold"><Camera className="mx-auto mb-4 opacity-50" size={48}/> アピール投稿の履歴がありません。</div>}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </GlassCard>
        </Reveal>
      </main>
    </div>
  );
}

export default function FloristDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-pink-500 w-12 h-12" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}