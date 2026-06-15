'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Heart, Bell, User, Camera, Settings,
  Plus, Search, LogOut, Award,
  Loader2, Zap, ArrowRight, ChevronRight, Copy,
  FileText, HelpCircle, Mail, ShieldCheck, Star,
  Pencil, MessageCircle, X, Lock, Send, Trash2
} from 'lucide-react';

import UploadForm from '@/app/components/UploadForm';
import SupportLevelBadge from '@/app/components/SupportLevelBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function ProjectCard({ project, roleType }) {
  const router = useRouter();

  const targetAmount = project.targetAmount || 0;
  const collectedAmount = project.collectedAmount || 0;
  const percent = targetAmount > 0 ? Math.min((collectedAmount / targetAmount) * 100, 100) : 0;
  const isOrganizer = roleType === 'owner';

  const isSuccess = percent >= 100 || project.status === 'SUCCESSFUL' || project.status === 'COMPLETED';
  const badgeLabel = project.status === 'COMPLETED' ? '完了' : isSuccess ? '達成!' : '募集中';
  const badgeColor = project.status === 'COMPLETED' ? 'bg-purple-500' : isSuccess ? 'bg-emerald-500' : 'bg-pink-500';

  return (
    <div onClick={() => router.push(`/projects/${project.id}`)} className="block group h-full cursor-pointer">
      <div className="bg-white/90 backdrop-blur-md rounded-[1.5rem] overflow-hidden border border-white shadow-sm hover:shadow-[0_12px_30px_rgba(244,114,182,0.15)] transition-all duration-300 hover:-translate-y-1 relative h-full flex flex-col">
        <div className="relative w-full aspect-[3/4] bg-slate-100 shrink-0">
          {project.imageUrl ? (
            <Image src={project.imageUrl} alt={project.title || '企画画像'} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-4xl">💐</div>
          )}
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-slate-900/50 to-transparent" />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className={cn('px-2 py-1 rounded-md text-[9px] font-black shadow-sm text-white', badgeColor)}>
              {badgeLabel}
            </span>
            <span className={cn('px-2 py-1 rounded-md text-[9px] font-black shadow-sm flex items-center gap-1 backdrop-blur-md border',
              isOrganizer ? 'bg-slate-900/80 text-white border-slate-700' : 'bg-white/90 text-pink-500 border-pink-100'
            )}>
              {isOrganizer ? <Star size={10} className="fill-yellow-400 text-yellow-400" /> : <Heart size={10} className="fill-pink-500 text-pink-500" />}
              {isOrganizer ? '主催' : '参加'}
            </span>
          </div>
        </div>
        <div className="p-3 lg:p-4 flex flex-col flex-grow bg-white">
          <h3 className="font-black text-slate-800 text-xs leading-snug group-hover:text-pink-500 transition-colors line-clamp-2 mb-2">
            {project.title}
          </h3>
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] font-black text-slate-800 leading-none">
                ¥{collectedAmount.toLocaleString()}
              </span>
              <span className={cn('text-[10px] font-black font-mono leading-none', percent >= 100 ? 'text-emerald-500' : 'text-pink-500')}>
                {percent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner relative">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${percent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn('h-full rounded-full absolute left-0 top-0', percent >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-pink-400 to-rose-400')}
              />
            </div>
            {project.status === 'FUNDRAISING' && (
              <div className="mt-3 pt-3 border-t border-slate-100 border-dashed relative z-20">
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.id}#pledge-section`); }}
                  className="w-full py-2.5 bg-pink-50 hover:bg-pink-500 text-pink-600 hover:text-white rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5"
                >
                  <Heart size={12} className="fill-current" />
                  支援する (1口 ¥{(project.minContributionAmount || 1000).toLocaleString()}〜)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, value, onClick, href, danger }) {
  const inner = (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0 transition-colors select-none',
        onClick || href ? 'cursor-pointer active:bg-slate-50' : '',
        danger ? 'text-rose-500' : 'text-slate-700'
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        danger ? 'bg-rose-50 text-rose-400' : 'bg-slate-100 text-slate-500'
      )}>
        {icon}
      </div>
      <span className="flex-1 text-sm font-bold">{label}</span>
      {value && <span className="text-xs font-mono text-slate-400 mr-1">{value}</span>}
      {(onClick || href) && <ChevronRight size={16} className="text-slate-300 shrink-0" />}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function DashboardContent() {
  const { user, isLoading: authLoading, logout, authenticatedFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [filterPill, setFilterPill] = useState('all');

  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const fetchMyData = useCallback(async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const [createdRes, pledgedRes, notifRes, postsRes] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/users/${user.id}/created-projects`),
        authenticatedFetch(`${API_URL}/api/users/${user.id}/pledged-projects`),
        authenticatedFetch(`${API_URL}/api/notifications`),
        authenticatedFetch(`${API_URL}/api/posts/my`)
      ]);
      if (createdRes?.ok) setCreatedProjects(await createdRes.json());
      if (pledgedRes?.ok) setPledgedProjects(await pledgedRes.json());
      if (notifRes?.ok) setNotifications(await notifRes.json());
      if (postsRes?.ok) setMyPosts(await postsRes.json());
    } catch (e) { console.error(e); }
    finally { setLoadingData(false); }
  }, [user, authenticatedFetch]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) fetchMyData();
  }, [user, authLoading, fetchMyData, router]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const displayProjects = useMemo(() => {
    const created = createdProjects.map(p => ({ ...p, _role: 'owner' }));
    const pledged = pledgedProjects.map(p => ({ ...p.project, _role: 'backer' })).filter(p => p.id);
    const all = [...created, ...pledged].reduce((acc, current) => {
      const x = acc.find(item => item.id === current.id);
      if (!x) return acc.concat([current]);
      return acc;
    }, []);
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (filterPill === 'created') return created;
    if (filterPill === 'pledged') return pledged;
    return all;
  }, [createdProjects, pledgedProjects, filterPill]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FA]">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    );
  }

  const BOTTOM_NAVS = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'projects', label: '企画', icon: Heart },
    { id: 'album', label: 'アルバム', icon: Camera },
    { id: 'notifications', label: '通知', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'settings', label: '設定', icon: Settings }
  ];

  const FilterPills = () => (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x">
      {[
        { id: 'all', label: 'すべて' },
        { id: 'created', label: '主催した企画' },
        { id: 'pledged', label: '参加中の企画' }
      ].map(pill => (
        <button
          key={pill.id}
          onClick={() => setFilterPill(pill.id)}
          className={cn(
            'px-5 py-2 rounded-full text-xs font-black whitespace-nowrap snap-start transition-all duration-300 shadow-sm border',
            filterPill === pill.id
              ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-100'
              : 'bg-white text-slate-500 border-white hover:border-pink-200 hover:text-pink-500'
          )}
        >
          {pill.label}
        </button>
      ))}
    </div>
  );

  const ProjectGrid = () => (
    displayProjects.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
        {displayProjects.map(p => <ProjectCard key={`${p._role}_${p.id}`} project={p} roleType={p._role} />)}
      </div>
    ) : (
      <div className="py-20 text-center flex flex-col items-center bg-white/50 backdrop-blur-sm rounded-[2rem]">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm border border-slate-100">🌸</div>
        <h3 className="text-base font-black text-slate-800 mb-2">企画がありません</h3>
        <p className="text-xs font-bold text-slate-500 mb-6">参加中のフラスタ企画を探してみましょう！</p>
        <Link href="/projects" className="px-8 py-3.5 bg-slate-900 text-white rounded-full font-black text-sm shadow-md flex items-center gap-2">
          <Search size={16} /> 企画を探す
        </Link>
      </div>
    )
  );

  return (
    <div className="min-h-[100dvh] bg-[#F7F7FA] font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white">

      {/* 背景装飾 */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="fixed top-40 left-0 w-[400px] h-[400px] bg-rose-100/20 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none z-0" />

      {/* === モバイル固定ヘッダー === */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-14 px-5 max-w-xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-black">F</span>
            </div>
            <span className="font-black text-slate-800 text-base tracking-tight">FLASTAL</span>
          </div>
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 rounded-xl active:bg-slate-100 transition-colors"
          >
            <Bell size={22} className={activeTab === 'notifications' ? 'text-pink-500' : 'text-slate-500'} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main
        className="max-w-xl lg:max-w-6xl mx-auto px-4 relative z-10 w-full lg:pt-8 lg:pb-12"
        style={{
          paddingTop: 'calc(56px + env(safe-area-inset-top) + 16px)',
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)'
        }}
      >
        {/* PC ヘッダー */}
        <div className="hidden lg:flex justify-between items-end mb-8">
          <div className="flex items-center gap-5">
            <div
              className="relative w-20 h-20 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-white shrink-0 group cursor-pointer"
              onClick={() => setActiveTab('settings')}
            >
              {user.iconUrl
                ? <Image src={user.iconUrl} alt="Icon" fill className="object-cover group-hover:scale-110 transition-transform" />
                : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={32} /></div>
              }
            </div>
            <div>
              <p className="text-[10px] font-black text-pink-500 tracking-[0.2em] uppercase mb-1">Welcome back</p>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter">{user.handleName || 'Guest'}</h1>
              <div className="mt-2"><SupportLevelBadge level={user.supportLevel} /></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-1 rounded-[2rem] shadow-xl w-[350px] group transition-transform hover:-translate-y-1">
            <div className="bg-white/10 backdrop-blur-md rounded-[1.8rem] p-5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400 fill-amber-400" /> ポイント残高
                </p>
                <p className="text-white text-3xl font-black font-mono tracking-tighter flex items-baseline gap-1">
                  {(user.points || 0).toLocaleString()} <span className="text-sm text-slate-400">pt</span>
                </p>
              </div>
              <Link href="/points" className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-white font-black text-sm px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all group-hover:scale-105 active:scale-95">
                チャージ <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* PC タブナビ */}
        <div className="hidden lg:flex gap-2 mb-8 pb-4 border-b border-slate-200">
          {BOTTOM_NAVS.map(nav => (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id)}
              className={cn(
                'px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2',
                activeTab === nav.id ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
            >
              <nav.icon size={16} className={activeTab === nav.id ? 'text-white' : ''} />
              {nav.label}
              {nav.badge && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{nav.badge}</span>}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >

            {/* ========== HOME ========== */}
            {activeTab === 'home' && (
              <div className="space-y-5">

                {/* プロフィールヒーローカード */}
                <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-[2rem] p-5 text-white relative overflow-hidden shadow-lg shadow-pink-200/40">
                  <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-12 w-28 h-28 bg-rose-400/20 rounded-full pointer-events-none" />

                  <div className="flex items-center gap-4 relative z-10">
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg shrink-0 bg-white/20 active:scale-95 transition-transform"
                    >
                      {user.iconUrl
                        ? <Image src={user.iconUrl} alt="Icon" fill className="object-cover" />
                        : <User size={28} className="absolute inset-0 m-auto text-white/70" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-pink-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Welcome back</p>
                      <h1 className="text-xl font-black text-white truncate">{user.handleName || 'ゲスト'}</h1>
                      <div className="mt-1.5"><SupportLevelBadge level={user.supportLevel} size="sm" /></div>
                    </div>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center active:scale-95 transition-transform shrink-0"
                    >
                      <Settings size={16} className="text-white" />
                    </button>
                  </div>

                  {/* 統計ライン */}
                  <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/20 relative z-10">
                    <div className="text-center">
                      <p className="text-2xl font-black text-white leading-none">{createdProjects.length}</p>
                      <p className="text-[9px] text-pink-100/80 font-bold mt-1">主催企画</p>
                    </div>
                    <div className="text-center border-x border-white/20">
                      <p className="text-2xl font-black text-white leading-none">{pledgedProjects.length}</p>
                      <p className="text-[9px] text-pink-100/80 font-bold mt-1">参加企画</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-white leading-none font-mono">{(user.points || 0).toLocaleString()}</p>
                      <p className="text-[9px] text-pink-100/80 font-bold mt-1">ポイント</p>
                    </div>
                  </div>
                </div>

                {/* クイックアクション */}
                <div className="grid grid-cols-3 gap-3">
                  <Link href="/projects/create" className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-slate-100 active:scale-95 transition-transform text-center">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                      <Plus size={20} className="text-pink-500" />
                    </div>
                    <span className="text-[11px] font-black text-slate-700 leading-tight">企画を<br />立てる</span>
                  </Link>
                  <Link href="/projects" className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-slate-100 active:scale-95 transition-transform text-center">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Search size={20} className="text-violet-500" />
                    </div>
                    <span className="text-[11px] font-black text-slate-700 leading-tight">企画を<br />探す</span>
                  </Link>
                  <Link href="/points" className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-slate-100 active:scale-95 transition-transform text-center">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Zap size={20} className="text-amber-500" />
                    </div>
                    <span className="text-[11px] font-black text-slate-700 leading-tight">ポイント<br />チャージ</span>
                  </Link>
                </div>

                {/* マイ企画 */}
                {loadingData ? (
                  <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-pink-400 animate-spin" /></div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-black text-slate-800">マイ企画</h2>
                      <button onClick={() => setActiveTab('projects')} className="text-xs font-bold text-pink-500 flex items-center gap-0.5 active:opacity-70">
                        すべて見る <ChevronRight size={14} />
                      </button>
                    </div>
                    <FilterPills />
                    <ProjectGrid />
                  </div>
                )}

                {/* 思い出アルバムプレビュー */}
                {!loadingData && myPosts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-black text-slate-800">最近の投稿</h2>
                      <button onClick={() => setActiveTab('album')} className="text-xs font-bold text-pink-500 flex items-center gap-0.5 active:opacity-70">
                        アルバムへ <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
                      {myPosts.slice(0, 6).map((post) => (
                        <button
                          key={post.id}
                          onClick={() => { setActiveTab('album'); }}
                          className="relative aspect-square bg-slate-100 active:opacity-70 transition-opacity overflow-hidden"
                        >
                          <Image src={post.imageUrl} alt={post.eventName} fill className="object-cover" sizes="33vw" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========== PROJECTS ========== */}
            {activeTab === 'projects' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-800">マイ企画</h2>
                  {!loadingData && (
                    <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                      {displayProjects.length}件
                    </span>
                  )}
                </div>

                {/* 企画を立てるバナー */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-[1.5rem] p-5 shadow-lg shadow-pink-200/40 flex justify-between items-center text-white relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.4)_0%,_transparent_60%)]" />
                  <div className="relative z-10">
                    <h3 className="text-base font-black mb-0.5 tracking-tight">新しい企画を立てる</h3>
                    <p className="text-[10px] font-bold opacity-90">推しへの想いを形にしよう🌸</p>
                  </div>
                  <Link href="/projects/create" className="relative z-10 w-10 h-10 bg-white text-pink-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform active:scale-95">
                    <Plus className="w-5 h-5" />
                  </Link>
                </div>

                {loadingData ? (
                  <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-pink-400 animate-spin" /></div>
                ) : (
                  <div className="space-y-4">
                    <FilterPills />
                    <ProjectGrid />
                  </div>
                )}
              </div>
            )}

            {/* ========== ALBUM ========== */}
            {activeTab === 'album' && (
              <div className="space-y-4">
                {/* ヘッダー */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-800">思い出アルバム</h2>
                  <Link href="/album"
                    className="text-xs font-black text-pink-500 flex items-center gap-1 hover:text-pink-600 transition-colors">
                    みんなの投稿 <ArrowRight size={13} />
                  </Link>
                </div>

                {/* 投稿エリア */}
                <div className="bg-white/90 backdrop-blur-md rounded-[2rem] border border-white shadow-sm overflow-hidden">
                  {/* ストーリー風アップロード行 */}
                  <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-slate-100">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-pink-300 flex items-center justify-center bg-pink-50 cursor-pointer active:scale-95 transition-transform"
                        onClick={() => document.getElementById('album-upload-trigger')?.click()}>
                        <Plus size={22} className="text-pink-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">新しい投稿</span>
                    </div>
                    {myPosts.slice(0, 5).map(p => (
                      <div key={p.id}
                        onClick={() => {
                          setSelectedPost(p);
                          setPostComments([]);
                          fetch(`${API_URL}/api/posts/${p.id}/comments`)
                            .then(r => r.json()).then(setPostComments);
                        }}
                        className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-pink-400 p-0.5 bg-gradient-to-tr from-pink-500 to-rose-400 active:scale-95 transition-transform">
                          <div className="w-full h-full rounded-full overflow-hidden bg-white">
                            <Image src={p.imageUrl} alt={p.eventName} width={56} height={56} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 truncate max-w-[56px]">{p.eventName}</span>
                      </div>
                    ))}
                  </div>

                  {/* 投稿フォーム */}
                  <div id="album-upload-section" className="px-4 py-4">
                    <UploadForm onUploadSuccess={fetchMyData} />
                  </div>
                </div>

                {/* 投稿グリッド - Instagram風 3カラム */}
                <div>
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      {myPosts.length}件の投稿
                    </p>
                  </div>
                  {myPosts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-0.5">
                      {myPosts.map(post => (
                        <motion.div
                          key={post.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setSelectedPost(post);
                            setPostComments([]);
                            fetch(`${API_URL}/api/posts/${post.id}/comments`)
                              .then(r => r.json()).then(setPostComments);
                          }}
                          className="relative aspect-square bg-slate-100 cursor-pointer overflow-hidden"
                        >
                          <Image src={post.imageUrl} alt={post.eventName} fill className="object-cover" />
                          {/* like/comment overlay on hover */}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-4 opacity-0 hover:opacity-100">
                            <span className="text-white font-black text-sm flex items-center gap-1">
                              <Heart size={14} className="fill-white" /> {post._count?.likes ?? 0}
                            </span>
                            <span className="text-white font-black text-sm flex items-center gap-1">
                              <MessageCircle size={14} className="fill-white" /> {post._count?.comments ?? 0}
                            </span>
                          </div>
                          {!post.isPublic && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                              <Lock size={10} className="text-white" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center flex flex-col items-center bg-white/50 rounded-[2rem] border border-white">
                      <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-4 border border-pink-100">
                        <Camera size={32} className="text-pink-300" />
                      </div>
                      <h3 className="text-base font-black text-slate-700 mb-1">写真がありません</h3>
                      <p className="text-xs font-bold text-slate-400">完成したフラスタの写真を投稿しよう📸</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== POST DETAIL MODAL ========== */}
            <AnimatePresence>
              {selectedPost && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 z-50"
                    onClick={() => setSelectedPost(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none"
                  >
                    <div
                      className="pointer-events-auto bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-sm max-h-[90dvh] flex flex-col overflow-hidden"
                      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                      {/* image */}
                      <div className="relative aspect-square bg-slate-100 shrink-0">
                        <Image src={selectedPost.imageUrl} alt={selectedPost.eventName} fill className="object-cover" />
                        <button
                          onClick={() => setSelectedPost(null)}
                          className="absolute top-3 right-3 w-9 h-9 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                        >
                          <X size={18} />
                        </button>
                        {!selectedPost.isPublic && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full px-2 py-1">
                            <Lock size={10} className="text-white" />
                            <span className="text-white text-[10px] font-black">自分のみ</span>
                          </div>
                        )}
                      </div>

                      {/* actions */}
                      <div className="px-4 pt-3 pb-2 shrink-0">
                        <div className="flex items-center gap-4 mb-2">
                          <button
                            onClick={async () => {
                              const prev = selectedPost;
                              const next = {
                                ...selectedPost,
                                likedByMe: !selectedPost.likedByMe,
                                _count: {
                                  ...selectedPost._count,
                                  likes: selectedPost.likedByMe
                                    ? selectedPost._count.likes - 1
                                    : selectedPost._count.likes + 1,
                                },
                              };
                              setSelectedPost(next);
                              setMyPosts(ps => ps.map(p => p.id === next.id ? next : p));
                              try {
                                const res = await authenticatedFetch(`/api/posts/${selectedPost.id}/like`, { method: 'POST' });
                                if (!res.ok) throw new Error();
                              } catch {
                                setSelectedPost(prev);
                                setMyPosts(ps => ps.map(p => p.id === prev.id ? prev : p));
                              }
                            }}
                            className="transition-transform active:scale-90"
                          >
                            <Heart size={24} className={selectedPost.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-700'} />
                          </button>
                          <button className="transition-transform active:scale-90">
                            <MessageCircle size={24} className="text-slate-700" />
                          </button>
                          <div className="flex-1" />
                          <button
                            onClick={async () => {
                              if (!confirm('この投稿を削除しますか？')) return;
                              const res = await authenticatedFetch(`/api/posts/${selectedPost.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                toast.success('削除しました');
                                setMyPosts(ps => ps.filter(p => p.id !== selectedPost.id));
                                setSelectedPost(null);
                              } else { toast.error('削除に失敗しました'); }
                            }}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        {(selectedPost._count?.likes ?? 0) > 0 && (
                          <p className="text-sm font-black text-slate-800 mb-1">
                            {selectedPost._count.likes.toLocaleString()}件のいいね
                          </p>
                        )}
                        <p className="text-xs font-black text-slate-500 mb-0.5">{selectedPost.eventName}</p>
                        {selectedPost.caption && (
                          <p className="text-sm text-slate-700 leading-relaxed">{selectedPost.caption}</p>
                        )}
                      </div>

                      {/* comments */}
                      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 border-t border-slate-100">
                        {postComments.length === 0 ? (
                          <p className="text-center text-slate-400 text-xs font-bold py-4">まだコメントはありません</p>
                        ) : postComments.map(c => (
                          <div key={c.id} className="flex gap-2 items-start">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shrink-0">
                              <span className="text-white text-[10px] font-black">{c.user.handleName[0]}</span>
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-700 mr-1">{c.user.handleName}</span>
                              <span className="text-xs text-slate-600">{c.content}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* comment input */}
                      <div className="px-4 py-3 border-t border-slate-100 flex gap-2 items-center shrink-0">
                        <input
                          type="text"
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key !== 'Enter' || !commentText.trim() || sendingComment) return;
                            setSendingComment(true);
                            try {
                              const res = await authenticatedFetch(`/api/posts/${selectedPost.id}/comments`, {
                                method: 'POST',
                                body: JSON.stringify({ content: commentText.trim() }),
                              });
                              if (res.ok) {
                                const comment = await res.json();
                                setPostComments(prev => [...prev, comment]);
                                setSelectedPost(p => ({ ...p, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } }));
                                setCommentText('');
                              }
                            } finally { setSendingComment(false); }
                          }}
                          placeholder="コメントを追加..."
                          className="flex-1 bg-slate-50 rounded-full px-4 py-2 text-[16px] outline-none font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all"
                        />
                        <button
                          disabled={!commentText.trim() || sendingComment}
                          onClick={async () => {
                            if (!commentText.trim() || sendingComment) return;
                            setSendingComment(true);
                            try {
                              const res = await authenticatedFetch(`/api/posts/${selectedPost.id}/comments`, {
                                method: 'POST',
                                body: JSON.stringify({ content: commentText.trim() }),
                              });
                              if (res.ok) {
                                const comment = await res.json();
                                setPostComments(prev => [...prev, comment]);
                                setSelectedPost(p => ({ ...p, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } }));
                                setCommentText('');
                              }
                            } finally { setSendingComment(false); }
                          }}
                          className="w-9 h-9 bg-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-all shrink-0"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* ========== NOTIFICATIONS ========== */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-800">お知らせ</h2>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                      未読 {unreadCount}件
                    </span>
                  )}
                </div>
                <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-sm overflow-hidden">
                  {notifications.length > 0 ? notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={async () => {
                        await authenticatedFetch(`${API_URL}/api/notifications/${n.id}/read`, { method: 'PATCH' });
                        if (n.linkUrl) router.push(n.linkUrl);
                        fetchMyData();
                      }}
                      className={cn(
                        'p-5 flex gap-4 cursor-pointer transition-colors active:bg-slate-50 border-b border-slate-100/50 last:border-0',
                        n.isRead ? 'opacity-60' : 'bg-pink-50/30'
                      )}
                    >
                      <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', n.isRead ? 'bg-slate-200' : 'bg-pink-500 animate-pulse shadow-sm shadow-pink-200')} />
                      <div className="flex-1">
                        <p className={cn('text-xs leading-relaxed', n.isRead ? 'text-slate-600' : 'text-slate-900 font-bold')}>{n.message}</p>
                        <p className="text-[9px] text-slate-400 mt-1.5 font-black uppercase tracking-widest">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                      {n.linkUrl && <ChevronRight size={16} className="text-slate-200 shrink-0 mt-1" />}
                    </div>
                  )) : (
                    <div className="p-16 text-center flex flex-col items-center">
                      <Bell size={32} className="text-slate-200 mb-3" />
                      <p className="text-slate-400 font-bold text-sm">新しいお知らせはありません</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== SETTINGS ========== */}
            {activeTab === 'settings' && (
              <div className="space-y-4 max-w-2xl mx-auto">

                {/* プロフィールカード */}
                <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 shrink-0 bg-slate-100">
                      {user.iconUrl
                        ? <Image src={user.iconUrl} alt="アイコン" fill className="object-cover" />
                        : <User size={28} className="absolute inset-0 m-auto text-slate-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-slate-800 truncate">{user.handleName}</h3>
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{user.email}</p>
                      <div className="mt-1.5"><SupportLevelBadge level={user.supportLevel} size="sm" /></div>
                    </div>
                    <button
                      onClick={() => router.push('/mypage/edit')}
                      className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors shrink-0"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>

                {/* ポイント残高 */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Zap size={12} className="text-amber-400 fill-amber-400" /> ポイント残高
                      </p>
                      <p className="text-white text-3xl font-black font-mono tracking-tight">
                        {(user.points || 0).toLocaleString()}
                        <span className="text-sm text-slate-400 font-sans ml-1.5">pt</span>
                      </p>
                    </div>
                    <Link
                      href="/points"
                      className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black text-sm px-5 py-3 rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      チャージ <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

                {/* アカウント */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 pt-4 pb-1">アカウント</p>
                  <SettingsRow
                    icon={<Pencil size={16} />}
                    label="プロフィールを編集する"
                    onClick={() => router.push('/mypage/edit')}
                  />
                  <SettingsRow
                    icon={<Award size={16} />}
                    label="応援ランク"
                    value={user.supportLevel || 'FAN'}
                  />
                  <SettingsRow
                    icon={<Copy size={16} />}
                    label="招待コードをコピーする"
                    value={user.referralCode || '----'}
                    onClick={() => {
                      if (user.referralCode) {
                        navigator.clipboard.writeText(user.referralCode);
                        toast.success('招待コードをコピーしました');
                      }
                    }}
                  />
                </div>

                {/* サポート */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 pt-4 pb-1">サポート</p>
                  <SettingsRow icon={<HelpCircle size={16} />} label="よくある質問" href="/faq" />
                  <SettingsRow icon={<Mail size={16} />} label="お問い合わせ" href="/contact" />
                </div>

                {/* 法的情報 */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 pt-4 pb-1">法的情報</p>
                  <SettingsRow icon={<FileText size={16} />} label="利用規約" href="/terms" />
                  <SettingsRow icon={<ShieldCheck size={16} />} label="プライバシーポリシー" href="/privacy" />
                </div>

                {/* ログアウト */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <SettingsRow
                    icon={<LogOut size={16} />}
                    label="ログアウト"
                    danger
                    onClick={() => { logout(); router.push('/login'); }}
                  />
                </div>

                <p className="text-center text-[10px] text-slate-300 font-bold pb-4">FLASTAL v1.0.0</p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* === モバイル ボトムナビ === */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-end h-16 max-w-xl mx-auto px-2">
          {BOTTOM_NAVS.map(nav => {
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className="relative flex flex-col items-center justify-center w-full h-full pb-1.5 pt-1 transition-all group"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-x-2 -top-2 bottom-1 bg-pink-50/80 rounded-xl -z-10"
                  />
                )}
                <div className="relative mb-1">
                  <nav.icon
                    size={22}
                    className={cn('transition-all duration-300', isActive ? 'text-pink-500 drop-shadow-sm' : 'text-slate-400 group-hover:text-slate-600')}
                  />
                  {nav.badge !== undefined && nav.badge !== null && (
                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                      {nav.badge > 99 ? '99+' : nav.badge}
                    </span>
                  )}
                </div>
                <span className={cn('text-[9px] font-black transition-colors duration-300', isActive ? 'text-pink-500' : 'text-slate-400 group-hover:text-slate-600')}>
                  {nav.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}

export default function MyPageClientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FA]">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
