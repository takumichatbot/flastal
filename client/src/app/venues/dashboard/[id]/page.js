'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Zap, Star, Gem, 
  ArrowRight, Info, Loader2, Edit3, 
  MapPin, Calendar, Truck, CheckCircle, 
  Activity, BarChart3, Settings, LogOut, ExternalLink
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-emerald-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(16,185,129,0.05)] rounded-[2.5rem] p-6 md:p-8", className)}>
    {children}
  </div>
);

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: "easeOut" }}>
    {children}
  </motion.div>
);

function VenueDashboardContent() {
  const params = useParams();
  const id = params?.id;
  const { user, loading: authLoading, logout } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [venueAuth, setVenueAuth] = useState(null);
  const router = useRouter();

  const fetchVenueData = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`${API_URL}/api/venues/${id}`);
      if (!response.ok) throw new Error('会場データの取得に失敗しました');
      const data = await response.json();
      setVenue({ ...data, projects: data.projects || [] });
    } catch (error) {
      toast.error('会場情報を読み込めませんでした');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const storedVenue = localStorage.getItem('flastal-venue');
    const storedToken = localStorage.getItem('flastal-token');
    if (storedVenue && storedToken) {
      try { setVenueAuth(JSON.parse(storedVenue)); } catch (e) {}
    }
    fetchVenueData();
  }, [id, fetchVenueData]);

  const currentUserId = user?.id || venueAuth?.id;
  const currentUserRole = user?.role || (venueAuth ? 'VENUE' : null);

  const hasAccess = currentUserId && (
    String(currentUserId) === String(id) || currentUserRole === 'ADMIN' || currentUserRole === 'VENUE'
  );

  const handleLogout = () => {
    logout();
    router.push('/venues/login');
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen bg-emerald-50/50"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>;
  }

  if (!hasAccess) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingParticles />
        <GlassCard className="max-w-md w-full text-center relative z-10">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
             <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">アクセス権限がありません</h2>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium text-sm">
            会場ダッシュボードを利用するには、該当の会場アカウントでログインしてください。
          </p>
          <Link href="/venues/login" className="block w-full py-4 font-black text-white bg-slate-900 rounded-full hover:shadow-lg hover:bg-slate-800 transition-all">
              会場ログインページへ
          </Link>
          <Link href="/" className="block mt-6 text-sm text-slate-400 font-bold hover:text-slate-600 transition-colors">
              トップページに戻る
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50/50 to-sky-50/50 min-h-screen pb-32 font-sans text-slate-800 overflow-x-hidden relative">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto py-4 px-6 lg:px-8 flex justify-between items-center">
          <div>
            <p className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-0.5">Venue Menu</p>
            <h1 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2 tracking-tighter"><MapPin className="text-slate-400 hidden sm:block" size={18}/> 会場ダッシュボード</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="w-10 h-10 md:w-auto md:h-auto md:px-5 md:py-2 bg-white border border-slate-200 rounded-full text-slate-500 md:text-xs font-black hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-1.5 shadow-sm transition-all">
              <LogOut size={16}/> <span className="hidden md:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="relative pt-12 pb-16 md:pb-24 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <GlassCard className="bg-gradient-to-br from-emerald-500 to-teal-500 !border-emerald-400 relative overflow-hidden !p-8 md:!p-12 text-white shadow-xl shadow-emerald-200/50">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter drop-shadow-md">
                  {venue?.venueName || '会場名未設定'}
                </h1>
                <p className="text-emerald-50 flex items-center justify-center md:justify-start gap-2 font-bold text-sm bg-white/10 w-fit md:mx-0 mx-auto px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20 shadow-inner">
                  <MapPin size={16} /> {venue?.address || '住所未設定'}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link href={`/venues/dashboard/${id}/edit`} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full font-black text-white hover:bg-white/30 transition-all shadow-sm">
                  <Edit3 size={18} /> 情報を編集
                </Link>
                <Link href={`/venues/${id}`} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-emerald-600 rounded-full font-black hover:bg-slate-50 transition-all shadow-lg active:scale-95">
                  <ExternalLink size={18} /> 公開ページ確認
                </Link>
              </div>
            </div>
            <MapPin className="absolute -bottom-10 -right-10 text-[12rem] text-white opacity-10 rotate-12 pointer-events-none" />
          </GlassCard>
        </Reveal>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-16 relative z-20 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Reveal delay={0.1}>
            <GlassCard className="h-full">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-[1.25rem] flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-4">受入ステータス</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">スタンド花</span>
                  <span className={cn("text-xs font-black px-3 py-1 rounded-md shadow-sm border", venue?.isStandAllowed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200')}>
                    {venue?.isStandAllowed ? '許可' : '禁止'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">楽屋花</span>
                  <span className={cn("text-xs font-black px-3 py-1 rounded-md shadow-sm border", venue?.isBowlAllowed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200')}>
                    {venue?.isBowlAllowed ? '許可' : '禁止'}
                  </span>
                </div>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.2}>
            <GlassCard className="h-full">
              <div className="w-14 h-14 bg-sky-50 text-sky-500 rounded-[1.25rem] flex items-center justify-center mb-6 shadow-inner border border-sky-100">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">フラスタ実績</h3>
              <div className="mt-4">
                <p className="text-5xl font-black text-slate-800 tracking-tighter">
                  {venue?.projects?.length || 0} <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Projects</span>
                </p>
                <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  これまでにFLASTALを通じてこの会場に贈られたお花の総数です。
                </p>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.3}>
            <GlassCard className="bg-slate-900 !border-slate-800 text-white h-full relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 text-white rounded-[1.25rem] flex items-center justify-center mb-6 border border-white/20 backdrop-blur-sm">
                  <Calendar size={28} />
                </div>
                <h3 className="text-lg font-black mb-2 text-white">直近の搬入予定</h3>
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-slate-400 font-bold bg-white/5 p-4 rounded-2xl border border-white/10">※ 現在、確定した搬入予定はありません。</p>
                  <Link href={`/venues/settings`} className="inline-flex items-center gap-2 text-xs font-black text-sky-300 hover:text-sky-200 mt-2 transition-colors bg-sky-500/10 px-4 py-2.5 rounded-full border border-sky-500/20 group-hover:bg-sky-500/20">
                    <Settings size={14} /> 搬入ルール・搬入口の設定
                  </Link>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500 opacity-20 rounded-full blur-3xl"></div>
            </GlassCard>
          </Reveal>
        </div>
      </section>
      
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 max-w-4xl relative z-20">
        <Reveal delay={0.4}>
          <GlassCard className="!p-8 md:!p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-amber-100 p-2.5 rounded-[1rem] text-amber-600 shadow-inner">
                <Info size={20} />
              </div>
              <h3 className="font-black text-slate-800 text-lg">会場オーナーへのご案内</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-black text-slate-400 border border-slate-200">1</div>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    <strong className="text-slate-700 block mb-1 font-black">レギュレーションの正確性</strong>
                    ファンは会場の情報を頼りに企画を立てます。変更がある場合は速やかに更新をお願いします。
                  </p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-black text-slate-400 border border-slate-200">2</div>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    <strong className="text-slate-700 block mb-1 font-black">搬入トラブルの防止</strong>
                    搬入口や回収ルールを明文化することで、当日のお花屋さんとのトラブルを未然に防げます。
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" /> システム連携
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                  イベント主催者（イベンター）様との連携機能は現在開発中です。公式レギュレーションの自動同期が可能になります。
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full w-fit border border-emerald-100 shadow-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Coming Soon
                </div>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </section>
    </div>
  );
}

export default function VenueDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-emerald-50/50"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>}>
      <VenueDashboardContent />
    </Suspense>
  );
}