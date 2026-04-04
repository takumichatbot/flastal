'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { 
  FiUser, FiHeart, FiBell, FiSettings, 
  FiPlus, FiSearch, FiCamera, FiClock, FiUsers, 
  FiStar, FiCheckCircle, FiChevronRight, FiLogOut, FiAward, FiActivity 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// ★新しく大きなアイコンを追加
import { Loader2, Zap, CreditCard, History, ArrowRight } from 'lucide-react';

import UploadForm from '@/app/components/UploadForm'; 
import SupportLevelBadge from '@/app/components/SupportLevelBadge'; 
// ※古い PointsCard のインポートは完全に削除しました！

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- 進捗ステータスの日本語設定 ---
const PROJECT_STATUS_CONFIG = {
  'PENDING_APPROVAL': { label: '審査中', color: 'text-orange-500', bg: 'bg-orange-500', bgLight: 'bg-orange-50', step: 1 },
  'FUNDRAISING': { label: '募集中', color: 'text-pink-500', bg: 'bg-pink-500', bgLight: 'bg-pink-50', step: 2 },
  'SUCCESSFUL': { label: '達成!', color: 'text-emerald-500', bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', step: 3 },
  'IN_PRODUCTION': { label: '制作中', color: 'text-sky-500', bg: 'bg-sky-500', bgLight: 'bg-sky-50', step: 4 },
  'COMPLETED': { label: '完了', color: 'text-purple-500', bg: 'bg-purple-500', bgLight: 'bg-purple-50', step: 5 },
  'CANCELED': { label: '中止', color: 'text-slate-400', bg: 'bg-slate-400', bgLight: 'bg-slate-50', step: 0 },
};

// --- ミンサカ風の可愛い進捗バー ---
const ProgressSteps = ({ currentStep }) => {
  const steps = ['審査', '募集', '達成', '制作', '完了'];
  return (
    <div className="flex items-center w-full mt-5 px-1 relative">
      <div className="absolute top-2.5 left-0 right-0 h-1 bg-slate-100 rounded-full z-0" />
      {steps.map((s, i) => {
        const stepNum = i + 1;
        const isActive = stepNum <= currentStep;
        return (
          <div key={s} className="flex-1 flex flex-col items-center gap-2 relative z-10">
            <motion.div 
              initial={false}
              animate={{ 
                backgroundColor: isActive ? '#f472b6' : '#ffffff',
                borderColor: isActive ? '#f472b6' : '#e2e8f0',
                scale: isActive ? 1.1 : 1
              }}
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm"
            >
              {isActive && <FiCheckCircle size={10} className="text-white" />}
            </motion.div>
            <span className={cn("text-[9px] font-black tracking-widest", isActive ? 'text-pink-500' : 'text-slate-300')}>{s}</span>
          </div>
        );
      })}
    </div>
  );
};

// --- 透明感のある企画カード ---
function ProjectCard({ project, roleType }) {
  const config = PROJECT_STATUS_CONFIG[project.status] || { label: project.status, color: 'text-slate-600', bg: 'bg-slate-500', bgLight: 'bg-slate-50', step: 0 };
  
  const targetAmount = project.targetAmount || 0;
  const collectedAmount = project.collectedAmount || 0;
  const percent = targetAmount > 0 ? Math.min((collectedAmount / targetAmount) * 100, 100) : 0;
  const isOrganizer = roleType === 'owner';
  
  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-4 sm:p-5 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(244,114,182,0.15)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden flex flex-col h-full">
        {/* アイキャッチ画像 */}
        <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-inner bg-slate-100 shrink-0">
          {project.imageUrl ? (
            <Image src={project.imageUrl} alt={project.title || "企画画像"} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-sky-100 flex items-center justify-center text-4xl">💐</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
          
          {/* ロールバッジ */}
          <div className="absolute top-4 left-4">
            <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 backdrop-blur-md", 
              isOrganizer ? "bg-slate-900/90 text-white border border-slate-700" : "bg-white/90 text-pink-500 border border-pink-100"
            )}>
              {isOrganizer ? <FiStar className="fill-yellow-400 text-yellow-400"/> : <FiHeart className="fill-pink-500 text-pink-500"/>}
              {isOrganizer ? 'Organizer' : 'Supporter'}
            </span>
          </div>

          {/* ステータスバッジ */}
          <div className="absolute bottom-4 left-4">
            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black shadow-md", config.bg, "text-white")}>
              {config.label}
            </span>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="pt-5 flex flex-col flex-grow px-2">
          <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-pink-500 transition-colors line-clamp-2 mb-4">
            {project.title}
          </h3>
          
          <div className="mt-auto">
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold mb-4">
              <span className="flex items-center gap-1.5"><FiClock className="text-pink-400"/> {project.deliveryDateTime ? new Date(project.deliveryDateTime).toLocaleDateString() : '未定'}</span>
              <span className="flex items-center gap-1.5"><FiUsers className="text-sky-400"/> {project.backerCount || 0}人参加</span>
            </div>

            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current</p>
                <p className="text-lg font-black text-slate-800 leading-none">
                  ¥{collectedAmount.toLocaleString()}
                  <span className="text-[10px] text-slate-400 font-medium ml-1">/ ¥{targetAmount.toLocaleString()}</span>
                </p>
              </div>
              <span className={cn("text-2xl font-black font-mono leading-none", percent >= 100 ? "text-emerald-500" : "text-pink-500")}>
                {percent.toFixed(0)}%
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner relative">
              <motion.div 
                initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1, ease: "easeOut" }}
                className={cn("h-full rounded-full absolute left-0 top-0", percent >= 100 ? "bg-emerald-400" : "bg-gradient-to-r from-pink-400 to-rose-400")} 
              />
            </div>
            
            <ProgressSteps currentStep={config.step} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ==========================================
// 💡 メインのダッシュボードコンポーネント (Suspenseで囲む中身)
// ==========================================
function DashboardContent() {
  const { user, isLoading: authLoading, logout, authenticatedFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchMyData = useCallback(async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const [createdRes, pledgedRes, notifRes, postsRes] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/users/${user.id}/created-projects`),
        authenticatedFetch(`${API_URL}/api/users/${user.id}/pledged-projects`),
        authenticatedFetch(`${API_URL}/api/notifications`),
        authenticatedFetch(`${API_URL}/api/users/${user.id}/posts`)
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

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  
  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full" /></div>;

  const TABS = [
    { id: 'home', label: 'すべて', icon: FiActivity },
    { id: 'created', label: '主催した企画', icon: FiStar, badge: createdProjects.length },
    { id: 'pledged', label: '参加した企画', icon: FiHeart, badge: pledgedProjects.length },
    { id: 'album', label: '思い出アルバム', icon: FiCamera },
    { id: 'notifications', label: 'お知らせ', icon: FiBell, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'settings', label: '設定', icon: FiSettings }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] font-sans pb-24 relative overflow-hidden">
      {/* 背景の装飾（透明感） */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] -translate-x-1/2 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-8 md:pt-12">
        
        {/* --- HEADER (Profile & Points) --- */}
        <div className="flex flex-col lg:flex-row gap-8 lg:items-end justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-white shrink-0 group cursor-pointer" onClick={() => setActiveTab('settings')}>
              {user.iconUrl ? (
                <Image src={user.iconUrl} alt="Icon" fill className="object-cover group-hover:scale-110 transition-transform" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><FiUser size={32}/></div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-pink-500 tracking-[0.2em] uppercase mb-1">Welcome back</p>
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">{user.handleName || 'Guest'}</h1>
              <div className="mt-2"><SupportLevelBadge level={user.supportLevel} /></div>
            </div>
          </div>

          {/* ★大改修: ポイント管理カード (直接大きく実装・古いPointsCardは削除) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-1.5 rounded-[2.5rem] shadow-2xl w-full lg:w-[420px] shrink-0 transform transition-transform hover:-translate-y-1">
             <div className="bg-white/10 backdrop-blur-md rounded-[2.2rem] p-6 border border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                   <p className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <Zap size={18} className="text-amber-400 fill-amber-400"/> ポイント残高
                   </p>
                </div>
                
                <div className="flex items-baseline gap-2">
                   <span className="text-white text-5xl md:text-6xl font-black font-mono tracking-tighter drop-shadow-md">
                     {(user.points || 0).toLocaleString()}
                   </span>
                   <span className="text-xl text-slate-400 font-bold">pt</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                   <Link href="/points" className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-white font-black text-sm py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                     <CreditCard size={18}/> チャージ
                   </Link>
                   <Link href="/points?tab=history" className="bg-white/20 hover:bg-white/30 text-white font-black text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10">
                     <History size={18}/> 利用履歴
                   </Link>
                </div>
             </div>
          </div>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-4 pb-4 mb-8 snap-x">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap snap-start shadow-sm border",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white text-slate-500 border-white hover:border-pink-200 hover:text-pink-500"
              )}
            >
              <tab.icon size={16} className={activeTab === tab.id ? "text-pink-400" : ""} />
              {tab.label}
              {tab.badge !== undefined && tab.badge !== null && (
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black ml-1", activeTab === tab.id ? "bg-white/20" : "bg-slate-100 text-slate-400")}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
            className="w-full"
          >
            {loadingData && activeTab !== 'settings' ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-pink-300 animate-spin" /></div>
            ) : (
              <>
                {/* === HOME (すべて) === */}
                {activeTab === 'home' && (
                  <div className="space-y-10">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 rounded-[2rem] p-6 shadow-xl shadow-pink-200">
                      <div className="text-white">
                        <h2 className="text-xl font-black mb-1">新しい企画を始めませんか？</h2>
                        <p className="text-xs font-medium opacity-90">推しへの愛を形にする第一歩を踏み出しましょう。</p>
                      </div>
                      <Link href="/projects/create" className="w-full sm:w-auto px-8 py-3.5 bg-white text-pink-600 rounded-full font-black shadow-md hover:scale-105 transition-all flex items-center justify-center gap-2">
                        <FiPlus size={18} /> 企画を立てる
                      </Link>
                    </div>

                    {(createdProjects.length > 0 || pledgedProjects.length > 0) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {createdProjects.map(p => <ProjectCard key={`c_${p.id}`} project={p} roleType="owner" />)}
                        {pledgedProjects.map(pledge => pledge.project && <ProjectCard key={`p_${pledge.id}`} project={pledge.project} roleType="backer" />)}
                      </div>
                    ) : (
                      <div className="bg-white/60 backdrop-blur-md rounded-[3rem] p-16 text-center border border-white shadow-sm">
                        <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">🌸</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-4">まだ参加している企画がありません</h3>
                        <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">
                          現在募集中のフラスタ企画を探して、推し活をもっと盛り上げましょう！
                        </p>
                        <Link href="/projects" className="inline-flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-full font-black hover:bg-slate-800 transition-all shadow-xl">
                          <FiSearch /> 企画を探しに行く
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* === CREATED / PLEDGED === */}
                {(activeTab === 'created' || activeTab === 'pledged') && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                      {activeTab === 'created' ? <><FiStar className="text-yellow-400 fill-yellow-400"/> 主催した企画</> : <><FiHeart className="text-pink-500 fill-pink-500"/> 参加した企画</>}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeTab === 'created' 
                        ? createdProjects.map(p => <ProjectCard key={p.id} project={p} roleType="owner" />)
                        : pledgedProjects.map(pledge => pledge.project && <ProjectCard key={pledge.id} project={pledge.project} roleType="backer" />)
                      }
                      {(activeTab === 'created' && createdProjects.length === 0) || (activeTab === 'pledged' && pledgedProjects.length === 0) ? (
                        <div className="col-span-full py-20 text-center text-slate-400 font-bold">該当する企画はありません</div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* === ALBUM === */}
                {activeTab === 'album' && (
                  <div className="space-y-8">
                    <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-[1rem] flex items-center justify-center"><FiCamera size={24}/></div>
                        <div>
                          <h2 className="text-xl font-black text-slate-800">思い出アルバム</h2>
                          <p className="text-xs text-slate-500 mt-1">企画の完成写真や思い出を保存できます</p>
                        </div>
                      </div>
                      <UploadForm onUploadSuccess={fetchMyData} />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8">
                      {myPosts.length > 0 ? myPosts.map(post => (
                        <div key={post.id} className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-md border-4 border-white bg-slate-100">
                          <Image src={post.imageUrl} alt="思い出写真" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                            <p className="text-white font-bold text-xs leading-tight mb-1 line-clamp-2">{post.eventName}</p>
                            <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-full py-20 text-center text-slate-400 font-bold flex flex-col items-center">
                          <FiCamera size={48} className="mb-4 opacity-20" />
                          まだ写真がありません
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === NOTIFICATIONS === */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-[1rem] flex items-center justify-center"><FiBell size={24}/></div>
                      <h2 className="text-2xl font-black text-slate-800">お知らせ</h2>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-sm overflow-hidden">
                      {notifications.length > 0 ? notifications.map((n, i) => (
                        <div key={n.id} onClick={async () => {
                            await authenticatedFetch(`${API_URL}/api/notifications/${n.id}/read`, { method: 'PATCH' });
                            if(n.linkUrl) router.push(n.linkUrl);
                            fetchMyData();
                          }}
                          className={cn(
                            "p-6 flex gap-5 cursor-pointer transition-all hover:bg-slate-50/50 border-b border-slate-100/50 last:border-0",
                            n.isRead ? 'opacity-60' : 'bg-sky-50/30'
                          )}
                        >
                          <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm", n.isRead ? 'bg-slate-200' : 'bg-pink-500 animate-pulse shadow-pink-200')} />
                          <div className="flex-1">
                            <p className={cn("text-sm leading-relaxed", n.isRead ? 'text-slate-600' : 'text-slate-900 font-bold')}>{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-24 text-center flex flex-col items-center">
                          <FiBell size={40} className="text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold text-sm">新しいお知らせはありません</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === SETTINGS === */}
                {activeTab === 'settings' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 border border-white shadow-sm">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-10">
                        <div className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-xl shrink-0">
                          {user.iconUrl ? <Image src={user.iconUrl} alt="アイコン" fill className="object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><FiUser size={48}/></div>}
                        </div>
                        <div className="text-center sm:text-left flex-1">
                          <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-1">{user.handleName}</h3>
                          <p className="text-slate-400 text-xs font-bold font-mono">{user.email}</p>
                          
                          <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start">
                            <button onClick={() => router.push('/mypage/edit')} className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-all shadow-md">プロフィールを編集</button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2"><FiAward /> 現在の応援ランク</p>
                          <SupportLevelBadge level={user.supportLevel} />
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                          <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">招待用コード</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-black text-slate-800 tracking-widest font-mono group-hover:text-pink-500 transition-colors">{user.referralCode || '----'}</span>
                            <button onClick={() => {navigator.clipboard.writeText(user.referralCode); toast.success('コピーしました')}} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-pink-500 transition-all active:scale-95"><FiCheckCircle size={18}/></button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                         <button onClick={() => { logout(); router.push('/login'); }} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors py-2 px-4 rounded-full hover:bg-red-50">
                           <FiLogOut /> ログアウト
                         </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==========================================
// 👑 ROOT EXPORT (Wrapped in Suspense)
// ==========================================
export default function MyPageClientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-pink-500 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}