'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { 
  FiHome, FiHeart, FiBell, FiUser, 
  FiPlus, FiSearch, FiCamera, FiSettings, 
  FiCheckCircle, FiLogOut, FiAward, FiStar
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import UploadForm from '@/app/components/UploadForm'; 
import SupportLevelBadge from '@/app/components/SupportLevelBadge'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// 🎨 DOPA風! リッチな2カラム企画カード
// ==========================================
function ProjectCard({ project, roleType }) {
  const targetAmount = project.targetAmount || 0;
  const collectedAmount = project.collectedAmount || 0;
  const percent = targetAmount > 0 ? Math.min((collectedAmount / targetAmount) * 100, 100) : 0;
  const isOrganizer = roleType === 'owner';
  
  // ステータスバッジの判定
  const isSuccess = percent >= 100 || project.status === 'SUCCESSFUL' || project.status === 'COMPLETED';
  const badgeLabel = project.status === 'COMPLETED' ? '完了' : isSuccess ? '達成!' : '募集中';
  const badgeColor = project.status === 'COMPLETED' ? 'bg-purple-500' : isSuccess ? 'bg-emerald-500' : 'bg-pink-500';

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div className="bg-white/80 backdrop-blur-md rounded-[1.5rem] overflow-hidden border border-white/60 shadow-[0_8px_20px_rgba(244,114,182,0.08)] hover:shadow-[0_12px_30px_rgba(244,114,182,0.15)] transition-all duration-300 hover:-translate-y-1 relative h-full flex flex-col">
        
        {/* 画像エリア (縦長/正方形比率) */}
        <div className="relative w-full aspect-[4/5] bg-slate-100 shrink-0">
          {project.imageUrl ? (
            <Image src={project.imageUrl} alt={project.title || "企画画像"} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-sky-100 flex items-center justify-center text-4xl">💐</div>
          )}
          
          {/* 上部のグラデーションとバッジ */}
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-slate-900/50 to-transparent" />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className={cn("px-2 py-1 rounded-md text-[9px] font-black shadow-sm text-white", badgeColor)}>
              {badgeLabel}
            </span>
            <span className={cn("px-2 py-1 rounded-md text-[9px] font-black shadow-sm flex items-center gap-1 backdrop-blur-md border", 
              isOrganizer ? "bg-slate-900/80 text-white border-slate-700" : "bg-white/90 text-pink-500 border-pink-100"
            )}>
              {isOrganizer ? <FiStar size={10} className="fill-yellow-400 text-yellow-400"/> : <FiHeart size={10} className="fill-pink-500 text-pink-500"/>}
              {isOrganizer ? '主催' : '参加'}
            </span>
          </div>

          {/* 右下の1口バッジ */}
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-full text-[9px] font-black shadow-md border border-white/10">
              1口 ¥{(project.minContributionAmount || 1000).toLocaleString()}〜
            </span>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="p-3 flex flex-col flex-grow bg-white">
          <h3 className="font-bold text-slate-800 text-[11px] sm:text-xs leading-snug group-hover:text-pink-500 transition-colors line-clamp-2 mb-2">
            {project.title}
          </h3>
          
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] sm:text-xs font-black text-slate-800 leading-none">
                ¥{collectedAmount.toLocaleString()}
              </span>
              <span className={cn("text-[10px] sm:text-xs font-black font-mono leading-none", percent >= 100 ? "text-emerald-500" : "text-pink-500")}>
                {percent.toFixed(0)}%
              </span>
            </div>
            {/* プログレスバー */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner relative">
              <motion.div 
                initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1, ease: "easeOut" }}
                className={cn("h-full rounded-full absolute left-0 top-0", percent >= 100 ? "bg-emerald-400" : "bg-gradient-to-r from-pink-400 to-rose-400")} 
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ==========================================
// 💡 メインのダッシュボードコンポーネント
// ==========================================
function DashboardContent() {
  const { user, isLoading: authLoading, logout, authenticatedFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [filterPill, setFilterPill] = useState('all'); // all, created, pledged
  
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

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  
  // ピルタブでフィルタリングされたプロジェクト一覧
  const displayProjects = useMemo(() => {
    const created = createdProjects.map(p => ({ ...p, _role: 'owner' }));
    const pledged = pledgedProjects.map(p => ({ ...p.project, _role: 'backer' })).filter(p => p.id); // null除外
    
    // 重複除去 (主催かつ支援の場合など)
    const all = [...created, ...pledged].reduce((acc, current) => {
      const x = acc.find(item => item.id === current.id);
      if (!x) return acc.concat([current]);
      return acc;
    }, []);

    // 日付順にソート
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filterPill === 'created') return created;
    if (filterPill === 'pledged') return pledged;
    return all;
  }, [createdProjects, pledgedProjects, filterPill]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFC]"><Loader2 className="w-10 h-10 text-pink-500 animate-spin" /></div>;

  // ボトムナビの定義
  const BOTTOM_NAVS = [
    { id: 'home', label: 'ホーム', icon: FiHome },
    { id: 'projects', label: 'マイ企画', icon: FiHeart },
    { id: 'album', label: 'アルバム', icon: FiCamera },
    { id: 'notifications', label: '通知', icon: FiBell, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'settings', label: 'マイページ', icon: FiUser }
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFC] font-sans pb-[90px] pt-[72px] relative overflow-x-hidden selection:bg-pink-500 selection:text-white">
      {/* 背景の装飾（透明感パステル） */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="fixed top-40 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] -translate-x-1/2 pointer-events-none z-0" />

      {/* --- アプリ風 トップ固定ヘッダー --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-pink-100/50 px-4 py-3 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('settings')}>
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white shadow-sm bg-slate-100">
            {user.iconUrl ? <Image src={user.iconUrl} alt="Icon" fill className="object-cover" /> : <FiUser className="m-auto mt-2.5 text-slate-300" size={20}/>}
          </div>
          <div className="leading-tight">
            <p className="text-[9px] text-pink-500 font-black uppercase tracking-widest">{user.supportLevel || 'BRONZE'}</p>
            <p className="text-sm font-black text-slate-800 truncate max-w-[120px]">{user.handleName || 'Guest'}</p>
          </div>
        </div>
        
        {/* ポイント＆チャージボタン */}
        <Link href="/points" className="flex items-center bg-slate-900 text-white rounded-full pl-4 pr-1 py-1 gap-3 shadow-md hover:scale-105 active:scale-95 transition-transform border border-slate-700">
          <div className="flex flex-col items-end leading-none justify-center">
            <span className="text-[8px] text-slate-400 font-black tracking-widest">POINTS</span>
            <span className="text-sm font-black font-mono tracking-tighter">{(user.points || 0).toLocaleString()}</span>
          </div>
          <div className="w-7 h-7 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-inner">
            <FiPlus size={16} className="text-white" />
          </div>
        </Link>
      </header>

      {/* --- メインコンテンツエリア --- */}
      <main className="max-w-xl mx-auto px-4 relative z-10 w-full">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full pt-4">
            
            {loadingData && activeTab !== 'settings' ? (
              <div className="py-32 flex justify-center"><Loader2 className="w-8 h-8 text-pink-400 animate-spin" /></div>
            ) : (
              <>
                {/* ==================================
                    1. HOME & PROJECTS (マイ企画・ダッシュボード) 
                ================================== */}
                {(activeTab === 'home' || activeTab === 'projects') && (
                  <div className="space-y-6">
                    
                    {/* DOPA風 スワイプできるカテゴリピル */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x">
                      {[
                        { id: 'all', label: 'すべて' },
                        { id: 'created', label: '主催した企画' },
                        { id: 'pledged', label: '参加中の企画' }
                      ].map(pill => (
                        <button
                          key={pill.id}
                          onClick={() => setFilterPill(pill.id)}
                          className={cn(
                            "px-5 py-2 rounded-full text-xs font-black whitespace-nowrap snap-start transition-all duration-300 shadow-sm border",
                            filterPill === pill.id 
                              ? "bg-slate-900 text-white border-slate-900" 
                              : "bg-white text-slate-500 border-white hover:border-pink-200"
                          )}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === 'home' && filterPill === 'all' && (
                      <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-[1.5rem] p-5 shadow-lg shadow-pink-200/50 flex justify-between items-center text-white relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
                        <div className="relative z-10">
                          <h2 className="text-lg font-black mb-0.5 tracking-tight">新しい企画を立てる</h2>
                          <p className="text-[10px] font-bold opacity-90">推しへの想いを形にしよう🌸</p>
                        </div>
                        <Link href="/projects/create" className="relative z-10 w-10 h-10 bg-white text-pink-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform active:scale-95">
                          <FiPlus size={20} />
                        </Link>
                      </div>
                    )}

                    {/* DOPA風 2カラムカード一覧 */}
                    {displayProjects.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {displayProjects.map(p => <ProjectCard key={`${p._role}_${p.id}`} project={p} roleType={p._role} />)}
                      </div>
                    ) : (
                      <div className="py-20 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm border border-slate-100">🌸</div>
                        <h3 className="text-lg font-black text-slate-800 mb-2">企画がありません</h3>
                        <p className="text-xs font-bold text-slate-500 mb-6">参加中のフラスタ企画を探してみましょう！</p>
                        <Link href="/projects" className="px-8 py-3.5 bg-slate-900 text-white rounded-full font-black text-sm shadow-md flex items-center gap-2">
                          <FiSearch size={16}/> 企画を探す
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* ==================================
                    2. ALBUM (アルバム)
                ================================== */}
                {activeTab === 'album' && (
                  <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center"><FiCamera size={20}/></div>
                        <div>
                          <h2 className="text-lg font-black text-slate-800 leading-tight">思い出アルバム</h2>
                          <p className="text-[10px] text-slate-500 font-bold">完成写真や思い出を保存できます</p>
                        </div>
                      </div>
                      <UploadForm onUploadSuccess={fetchMyData} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {myPosts.length > 0 ? myPosts.map(post => (
                        <div key={post.id} className="relative aspect-square rounded-[1.5rem] overflow-hidden group shadow-sm border border-slate-100 bg-slate-100">
                          <Image src={post.imageUrl} alt="思い出写真" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                            <p className="text-white font-bold text-[10px] leading-tight mb-0.5 line-clamp-2">{post.eventName}</p>
                            <p className="text-white/60 text-[8px] font-black uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 py-20 text-center text-slate-400 font-bold flex flex-col items-center">
                          <FiCamera size={32} className="mb-3 opacity-30" />
                          <span className="text-xs">まだ写真がありません</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==================================
                    3. NOTIFICATIONS (お知らせ)
                ================================== */}
                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-black text-slate-800 mb-4 px-2">お知らせ</h2>
                    <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-sm overflow-hidden">
                      {notifications.length > 0 ? notifications.map((n) => (
                        <div key={n.id} onClick={async () => {
                            await authenticatedFetch(`${API_URL}/api/notifications/${n.id}/read`, { method: 'PATCH' });
                            if(n.linkUrl) router.push(n.linkUrl);
                            fetchMyData();
                          }}
                          className={cn(
                            "p-5 flex gap-4 cursor-pointer transition-all hover:bg-slate-50/50 border-b border-slate-100/50 last:border-0",
                            n.isRead ? 'opacity-60' : 'bg-sky-50/30'
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm", n.isRead ? 'bg-slate-200' : 'bg-pink-500 animate-pulse shadow-pink-200')} />
                          <div className="flex-1">
                            <p className={cn("text-xs leading-relaxed", n.isRead ? 'text-slate-600' : 'text-slate-900 font-bold')}>{n.message}</p>
                            <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-widest">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-16 text-center flex flex-col items-center">
                          <FiBell size={32} className="text-slate-200 mb-3" />
                          <p className="text-slate-400 font-bold text-xs">新しいお知らせはありません</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==================================
                    4. SETTINGS (マイページ・設定)
                ================================== */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-white shadow-sm flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 bg-slate-100">
                        {user.iconUrl ? <Image src={user.iconUrl} alt="アイコン" fill className="object-cover" /> : <FiUser size={40} className="m-auto mt-6 text-slate-300"/>}
                      </div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">{user.handleName}</h3>
                      <p className="text-slate-400 text-[10px] font-bold font-mono mb-4">{user.email}</p>
                      
                      <div className="flex flex-wrap gap-2 justify-center mb-6">
                        <button onClick={() => router.push('/mypage/edit')} className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-black rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1.5 border border-slate-200"><FiSettings size={14}/> プロフィール編集</button>
                      </div>

                      <div className="w-full bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex justify-between items-center mb-4">
                         <div className="text-left">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FiAward /> 応援ランク</p>
                           <p className="text-sm font-black text-slate-800">{user.supportLevel || 'BRONZE'}</p>
                         </div>
                         <SupportLevelBadge level={user.supportLevel} />
                      </div>

                      <div className="w-full bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex justify-between items-center group">
                         <div className="text-left">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">招待コード</p>
                           <p className="text-sm font-black text-slate-800 tracking-widest font-mono group-hover:text-pink-500 transition-colors">{user.referralCode || '----'}</p>
                         </div>
                         <button onClick={() => {navigator.clipboard.writeText(user.referralCode); toast.success('コピーしました')}} className="p-2.5 bg-white rounded-xl shadow-sm text-slate-400 hover:text-pink-500 transition-all active:scale-95"><FiCheckCircle size={16}/></button>
                      </div>
                    </div>
                    
                    <button onClick={() => { logout(); router.push('/login'); }} className="w-full py-4 bg-white border border-rose-100 text-rose-500 text-xs font-black rounded-[1.5rem] hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                      <FiLogOut size={16}/> ログアウト
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* --- DOPA風 Bottom Navigation (スマホ完全特化) --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-end h-[64px] max-w-xl mx-auto px-2">
          {BOTTOM_NAVS.map(nav => {
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className="relative flex flex-col items-center justify-center w-full h-full pb-2 pt-1 transition-all group"
              >
                {/* アクティブ時の背景ハイライト */}
                {isActive && (
                   <motion.div layoutId="nav-pill" className="absolute inset-x-2 -top-2 bottom-1 bg-pink-50/80 rounded-xl -z-10" />
                )}
                
                <div className="relative mb-1">
                  <nav.icon 
                    size={22} 
                    className={cn("transition-all duration-300", isActive ? "text-pink-500 drop-shadow-md" : "text-slate-400 group-hover:text-slate-600")} 
                  />
                  {nav.badge !== undefined && nav.badge !== null && (
                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-white border-solid">
                      {nav.badge > 99 ? '99+' : nav.badge}
                    </span>
                  )}
                </div>
                <span className={cn("text-[9px] font-black transition-colors duration-300", isActive ? "text-pink-500" : "text-slate-400 group-hover:text-slate-600")}>
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

// ==========================================
// 👑 ROOT EXPORT (Wrapped in Suspense)
// ==========================================
export default function MyPageClientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FAFAFC]"><Loader2 className="w-10 h-10 text-pink-500 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}