'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import ApprovalPendingCard from '@/components/dashboard/ApprovalPendingCard';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { 
  Plus, Calendar, MapPin, LogOut, Settings, Layers, ArrowRight, Image as ImageIcon, Loader2, CheckCircle2, User
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-8", className)}>
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, subText, color="indigo" }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-500 border-indigo-100",
    purple: "bg-purple-50 text-purple-500 border-purple-100",
  };
  return (
    <div className="bg-white/60 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
      <div className={cn("p-4 rounded-[1.5rem] border shadow-inner shrink-0", colors[color])}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
          {subText && <span className="text-[10px] font-bold text-slate-400">{subText}</span>}
        </div>
      </div>
    </div>
  );
};

function OrganizerDashboardContent() {
  const { user, isAuthenticated, loading, logout, isPending, isApproved } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, upcomingEvents: 0, totalProjects: 0 });
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => { setIsMounted(true); }, []);

  const fetchEvents = useCallback(async () => {
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('flastal-token') || localStorage.getItem('authToken'))?.replace(/^"|"$/g, '') 
      : null;

    if (!token) { setIsLoadingEvents(false); return; }

    try {
      const res = await fetch(`${API_URL}/api/organizers/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('イベント一覧の取得に失敗しました');
      
      const data = await res.json();
      setEvents(data);

      const now = new Date();
      const upcoming = data.filter(e => new Date(e.eventDate) >= now).length;
      const projects = data.reduce((acc, curr) => acc + (curr._count?.projects || 0), 0);
      
      setStats({ totalEvents: data.length, upcomingEvents: upcoming, totalProjects: projects });
    } catch (error) {
      toast.error('データの取得に失敗しました。再ログインをお試しください。');
    } finally {
      setIsLoadingEvents(false);
    }
  }, []); 

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!isAuthenticated || (user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN')) {
      router.push('/organizers/login');
      return;
    }
    fetchEvents();
  }, [isMounted, loading, isAuthenticated, user, router, fetchEvents]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('flastal-token');
    localStorage.removeItem('authToken');
    toast.success('ログアウトしました');
    router.push('/organizers/login');
  };

  if (!isMounted || loading || (isLoadingEvents && user)) {
    return <div className="flex items-center justify-center min-h-screen bg-indigo-50/50"><Loader2 className="animate-spin text-indigo-500 w-12 h-12" /></div>;
  }

  if (user?.role === 'ORGANIZER' && (isPending || !isApproved)) {
      return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-200/30 rounded-full blur-[100px] pointer-events-none" />
          <header className="flex justify-between items-center py-4 px-6 md:px-8 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white max-w-5xl mx-auto mt-6 relative z-10">
            <h1 className="font-black text-slate-800 flex items-center gap-2"><Layers className="text-indigo-500" size={18}/> Organizer Dashboard</h1>
            <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"><LogOut size={14}/> ログアウト</button>
          </header>
          <div className="max-w-2xl mx-auto mt-12 relative z-10"><ApprovalPendingCard /></div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-24 relative overflow-hidden text-slate-800">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-purple-100/30 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto py-5 px-6 lg:px-8 flex justify-between items-center">
          <div>
            <p className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-0.5">Professional Menu</p>
            <h1 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tighter"><Layers className="text-slate-400 hidden sm:block" size={20}/> 主催者ダッシュボード</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/organizers/profile" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-full text-slate-500 font-bold text-xs border border-slate-200 shadow-sm hover:text-indigo-600 hover:border-indigo-200 transition-all">
                <Settings size={14}/> プロフィール設定
            </Link>
            <button onClick={handleLogout} className="w-10 h-10 md:w-auto md:h-auto md:px-5 md:py-2.5 bg-white border border-slate-200 rounded-full text-slate-500 md:text-xs font-black hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5 shadow-sm transition-all">
              <LogOut size={16}/> <span className="hidden md:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-12 relative z-10">
        
        {/* Stats & Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard title="今後の開催イベント" value={`${stats.upcomingEvents} 件`} subText={`全 ${stats.totalEvents} イベント中`} icon={Calendar} color="indigo" />
            <StatCard title="受け入れ中の企画総数" value={`${stats.totalProjects} 件`} icon={Layers} color="purple" />
            <Link href="/organizers/events/new" className="group h-full">
              <div className="h-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-indigo-400/50 flex flex-col justify-center items-center gap-3 hover:shadow-indigo-500/30 transition-all hover:-translate-y-1 cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <div className="p-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-[1.5rem] group-hover:scale-110 transition-transform relative z-10">
                    <Plus size={28} />
                  </div>
                  <span className="font-black text-lg relative z-10 tracking-tight">新しいイベントを作成</span>
              </div>
            </Link>
        </motion.div>

        {/* Events List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="mb-6 flex justify-between items-end px-2">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Calendar className="text-indigo-500" size={20}/> 管理中のイベント一覧
              </h2>
              <Link href="/organizers/profile" className="sm:hidden text-xs font-bold text-indigo-500 flex items-center gap-1"><Settings size={12}/> 設定</Link>
            </div>

            {events.length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300 shadow-inner rotate-3">
                   <Calendar size={36} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">イベントがまだありません</h3>
                <p className="text-sm font-bold text-slate-500 mb-8">イベントを作成して、ファンからのフラスタ企画を募集しましょう🌸</p>
                <Link href="/organizers/events/new">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-slate-900 text-white font-black rounded-full shadow-lg flex items-center gap-2">
                        <Plus size={18} /> 最初のイベントを作成
                    </motion.button>
                </Link>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <AnimatePresence>
                    {events.map((event, i) => {
                    const isUpcoming = new Date(event.eventDate) > new Date();
                    return (
                        <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="h-full">
                            <GlassCard className="!p-0 h-full flex flex-col group overflow-hidden hover:-translate-y-2 hover:border-indigo-200 transition-all duration-500 hover:shadow-[0_16px_40px_rgba(79,70,229,0.15)] bg-white">
                                <div className="h-48 relative overflow-hidden bg-slate-100 shrink-0">
                                    {event.imageUrls && event.imageUrls.length > 0 ? (
                                    <img src={event.imageUrls[0]} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><ImageIcon size={32} /></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                                    <div className="absolute top-4 left-4">
                                        <span className={cn("text-[10px] px-3 py-1.5 rounded-full font-black tracking-widest shadow-sm uppercase border backdrop-blur-md", isUpcoming ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-slate-800/80 text-white border-slate-600')}>
                                            {isUpcoming ? '開催予定' : '終了'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-black text-slate-800 mb-4 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">{event.title}</h3>
                                    <div className="space-y-2 text-xs font-bold text-slate-500 mt-auto">
                                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <Calendar className="text-indigo-400 shrink-0" size={14}/>
                                            <span>{new Date(event.eventDate).toLocaleDateString('ja-JP')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <MapPin className="text-indigo-400 shrink-0" size={14}/>
                                            <span className="truncate">{event.venue?.venueName || '会場未定'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                        <Layers className="text-sky-500" size={14}/>
                                        <span>企画 {event._count?.projects || 0}件</span>
                                    </div>
                                    <Link href={`/organizers/events/${event.id}`} className="text-xs font-black text-white bg-slate-900 px-5 py-2.5 rounded-full hover:bg-indigo-600 flex items-center gap-1 transition-all shadow-md">
                                        詳細・編集 <ArrowRight size={14}/>
                                    </Link>
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                    })}
                </AnimatePresence>
              </div>
            )}
        </motion.div>
      </main>
    </div>
  );
}

export default function OrganizerDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-indigo-50/50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 w-12 h-12"/></div>}>
      <OrganizerDashboardContent />
    </Suspense>
  );
}