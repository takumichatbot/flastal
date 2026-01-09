"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { 
  FiUser, FiList, FiHeart, FiBell, FiSettings, 
  FiPlus, FiActivity, FiCheckCircle, FiAlertCircle, 
  FiShoppingCart, FiSearch, FiCamera, FiLogOut, FiChevronRight,
  FiAward, FiMessageSquare, FiTrendingUp, FiClock, FiStar,
  FiMapPin, FiFlag, FiCompass, FiZap, FiUsers, FiTag
} from 'react-icons/fi';
import { motion } from 'framer-motion';

import UploadForm from '@/app/components/UploadForm'; 
import SupportLevelBadge from '@/app/components/SupportLevelBadge'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- 進捗ステータスの日本語設定 ---
const PROJECT_STATUS_CONFIG = {
  'PENDING_APPROVAL': { label: '確認中', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', step: 1 },
  'FUNDRAISING': { label: '募集中', color: 'text-[var(--oshi-color)]', bg: 'bg-[var(--oshi-color)]/5', border: 'border-[var(--oshi-color)]/10', step: 2 },
  'SUCCESSFUL': { label: '目標達成', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', step: 3 },
  'IN_PRODUCTION': { label: '制作中', color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100', step: 4 },
  'COMPLETED': { label: '完了', color: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-200', step: 5 },
  'CANCELED': { label: '中止', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100', step: 0 },
};

// --- ミンサカ風の進捗バー ---
const ProgressSteps = ({ currentStep }) => {
    const steps = ['審査', '募集', '達成', '制作', '完了'];
    return (
        <div className="flex items-center w-full mt-6 px-2">
            {steps.map((s, i) => {
                const stepNum = i + 1;
                const isActive = stepNum <= currentStep;
                return (
                    <div key={s} className="flex-1 flex flex-col items-center gap-2 relative">
                        {i > 0 && (
                            <div className={`absolute top-2 right-1/2 w-full h-[2px] -z-10 ${isActive ? 'bg-[var(--oshi-color)]/30' : 'bg-gray-100'}`} />
                        )}
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${isActive ? 'bg-[var(--oshi-color)] border-[var(--oshi-color)]/20 shadow-[0_0_8px_var(--oshi-color)]/30' : 'bg-white border-gray-100'}`} />
                        <span className={`text-[10px] font-bold ${isActive ? 'text-[var(--oshi-color)]' : 'text-gray-300'}`}>{s}</span>
                    </div>
                );
            })}
        </div>
    );
};

// --- 企画カード（オーナー/バッカー識別バッジ付き） ---
function ProjectCard({ project, roleType }) {
    const config = PROJECT_STATUS_CONFIG[project.status] || { label: project.status, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', step: 0 };
    const progress = project.targetAmount > 0 ? Math.min((project.collectedAmount / project.targetAmount) * 100, 100) : 0;
    
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 hover:border-[var(--oshi-color)]/30 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden flex flex-col md:flex-row group">
            <div className="w-full md:w-72 h-48 md:h-auto relative shrink-0 overflow-hidden">
                {project.imageUrl ? (
                    <Image src={project.imageUrl} alt={project.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200 text-3xl">💐</div>
                )}
                
                {/* 役割バッジ (主催か参加か) */}
                <div className="absolute top-4 right-4">
                    {roleType === 'owner' ? (
                        <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest">
                            <FiStar size={10} className="text-yellow-400 fill-yellow-400"/> Organizer
                        </span>
                    ) : (
                        <span className="bg-white text-slate-900 text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest border border-slate-100">
                            <FiHeart size={10} className="text-pink-500 fill-pink-500"/> Backer
                        </span>
                    )}
                </div>

                <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-[10px] font-black border shadow-xl backdrop-blur-md ${config.bg}/90 ${config.color} ${config.border}`}>
                    {config.label}
                </div>
            </div>

            <div className="p-8 flex-grow flex flex-col">
                <Link href={`/projects/${project.id}`}>
                    <h3 className="font-black text-slate-800 text-xl hover:text-[var(--oshi-color)] transition-colors line-clamp-2 leading-tight mb-2">
                        {project.title}
                    </h3>
                </Link>
                
                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><FiClock className="text-[var(--oshi-color)]"/> {new Date(project.deliveryDateTime).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><FiUsers className="text-sky-400"/> {project.backerCount || 0}人参加</span>
                </div>

                <div className="mt-auto pt-8">
                    <div className="flex justify-between items-end mb-3">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">{progress.toFixed(0)}</span>
                            <span className="text-sm font-black text-slate-400">%</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-black tracking-tighter">
                            <strong className="text-slate-900">{project.collectedAmount.toLocaleString()}</strong> / {project.targetAmount.toLocaleString()} pt
                        </span>
                    </div>
                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden shadow-inner">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[var(--oshi-color)] shadow-[0_0_12px_var(--oshi-color)]/40" />
                    </div>
                    <ProgressSteps currentStep={config.step} />
                </div>
            </div>
        </div>
    );
}

export default function MyPageClient() {
  const { user, isLoading: authLoading, logout, authenticatedFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const oshiThemeStyle = useMemo(() => ({
    '--oshi-color': user?.themeColor || '#ec4899', 
  }), [user?.themeColor]);

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
  
  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" /></div>;

  const NavButton = ({ id, label, icon: Icon, badge, color = "text-slate-600" }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-4 px-8 py-4 text-[15px] font-bold transition-all relative ${activeTab === id ? 'text-[var(--oshi-color)] bg-[var(--oshi-color)]/5' : `${color} hover:bg-slate-50`}`}>
        <Icon size={20} className={activeTab === id ? "text-[var(--oshi-color)]" : "text-slate-400"} />
        <span className="flex-grow text-left">{label}</span>
        {badge > 0 && <span className="bg-[var(--oshi-color)] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{badge}</span>}
        {activeTab === id && <div className="absolute left-0 w-1.5 h-full bg-[var(--oshi-color)]" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" style={oshiThemeStyle}>
      {/* --- サイドバー --- */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-100 sticky top-0 md:h-screen overflow-y-auto flex flex-col z-20 shadow-sm">
        <div className="p-10 pb-6 flex flex-col items-center border-b border-slate-50">
            <div className="w-24 h-24 rounded-[2rem] relative overflow-hidden border-4 border-white shadow-2xl mb-5 group ring-4 ring-[var(--oshi-color)]/5">
                {user.iconUrl ? <Image src={user.iconUrl} alt="アイコン" fill className="object-cover" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><FiUser size={40}/></div>}
                <Link href="/mypage/edit" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCamera className="text-white" size={24} />
                </Link>
            </div>
            <h2 className="font-black text-slate-900 text-xl tracking-tighter">{user.handleName}</h2>
            <div className="mt-3"><SupportLevelBadge level={user.supportLevel} /></div>
        </div>

        <div className="px-6 py-6">
            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl shadow-slate-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">My Points</p>
                <div className="flex justify-between items-center relative z-10">
                    <p className="text-3xl font-black tracking-tight">{(user.points || 0).toLocaleString()}<span className="text-xs ml-1 text-slate-500 uppercase">pt</span></p>
                    <Link href="/points" className="bg-[var(--oshi-color)] hover:opacity-90 p-3 rounded-2xl transition-all shadow-lg shadow-[var(--oshi-color)]/20 active:scale-90"><FiPlus size={20}/></Link>
                </div>
            </div>
        </div>

        <nav className="mt-2 flex-grow pb-10">
            <p className="px-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4 mt-4">Dashboard</p>
            <NavButton id="home" label="マイ企画一覧" icon={FiActivity} />
            <NavButton id="created" label="主催のみ" icon={FiStar} badge={createdProjects.length} />
            <NavButton id="pledged" label="参加のみ" icon={FiHeart} badge={pledgedProjects.length} />
            <NavButton id="album" label="アルバム" icon={FiCamera} />
            
            <p className="px-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4 mt-8">Settings</p>
            <NavButton id="notifications" label="お知らせ" icon={FiBell} badge={unreadCount} />
            <NavButton id="settings" label="プロフィール設定" icon={FiSettings} />
            <button onClick={logout} className="w-full flex items-center gap-4 px-8 py-6 text-[15px] font-bold text-red-400 hover:bg-red-50/50 transition-all mt-4 border-t border-slate-50">
                <FiLogOut size={20} /><span>ログアウト</span>
            </button>
        </nav>
      </aside>

      {/* --- メインコンテンツ --- */}
      <main className="flex-grow p-6 md:p-12 lg:p-20 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
            
            {/* ホームタブ（ここがすぐ企画一覧になる） */}
            {activeTab === 'home' && (
                <div className="space-y-12 animate-fadeIn">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My Projects</h1>
                            <p className="text-slate-400 text-sm font-bold mt-2 tracking-tight flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--oshi-color)] animate-pulse" />
                                現在進行中の全プロジェクトを表示しています
                            </p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Link href="/projects/create" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 text-sm">
                                <FiPlus /> 企画を立てる
                            </Link>
                            <Link href="/projects" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-600 font-black px-6 py-4 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 text-sm">
                                <FiSearch /> 探す
                            </Link>
                        </div>
                    </header>

                    <section className="space-y-8">
                        <div className="grid grid-cols-1 gap-6">
                            {/* 主催した企画 */}
                            {createdProjects.map(p => (
                                <ProjectCard key={p.id} project={p} roleType="owner" />
                            ))}
                            
                            {/* 参加した企画 */}
                            {pledgedProjects.map(pledge => pledge.project && (
                                <ProjectCard key={pledge.id} project={pledge.project} roleType="backer" />
                            ))}

                            {/* 企画がゼロの場合の空状態デザイン */}
                            {createdProjects.length === 0 && pledgedProjects.length === 0 && (
                                <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">🌸</div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">まだ企画がありません</h3>
                                    <p className="text-slate-400 font-bold mb-10 max-w-xs leading-relaxed">推しに届けるフラスタ企画への参加や、あなた自身の企画立ち上げを始めましょう！</p>
                                    <Link href="/projects" className="bg-[var(--oshi-color)] text-white px-12 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-[var(--oshi-color)]/30 hover:opacity-90 transition-all text-lg">企画を探しに行く</Link>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* その他のタブ（Created/Pledged）は個別の絞り込みとして維持 */}
            {activeTab === 'created' && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">主催している企画のみ</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {createdProjects.map(p => <ProjectCard key={p.id} project={p} roleType="owner" />)}
                    </div>
                </div>
            )}

            {activeTab === 'pledged' && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">参加している企画のみ</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {pledgedProjects.map(pledge => pledge.project && (
                            <ProjectCard key={pledge.id} project={pledge.project} roleType="backer" />
                        ))}
                    </div>
                </div>
            )}

            {/* アルバムタブ、お知らせ、設定は以前のデザインを継承 */}
            {activeTab === 'album' && (
                <div className="space-y-10 animate-fadeIn">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Memory Album</h2>
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"><UploadForm onUploadComplete={fetchMyData} /></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
                        {myPosts.map(post => (
                            <div key={post.id} className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-lg border-4 border-white">
                                <Image src={post.imageUrl} alt="思い出写真" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                                    <p className="text-white font-black text-sm leading-tight mb-1">{post.eventName}</p>
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Notifications</h2>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                        {notifications.length > 0 ? notifications.map(n => (
                            <div key={n.id} onClick={async () => {
                                    await authenticatedFetch(`${API_URL}/api/notifications/${n.id}/read`, { method: 'PATCH' });
                                    if(n.linkUrl) router.push(n.linkUrl);
                                    fetchMyData();
                                }}
                                className={`p-8 border-b border-slate-50 flex gap-6 cursor-pointer transition-all hover:bg-slate-50/50 ${n.isRead ? 'opacity-50' : ''}`}
                            >
                                <div className={`w-3 h-3 rounded-full mt-2 shrink-0 ${n.isRead ? 'bg-slate-200' : 'bg-[var(--oshi-color)] animate-pulse'}`} />
                                <div className="flex-1">
                                    <p className={`text-[15px] leading-relaxed ${n.isRead ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>{n.message}</p>
                                    <p className="text-[11px] text-slate-300 mt-3 font-black uppercase tracking-widest">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )) : (<div className="p-32 text-center text-slate-200 font-black uppercase tracking-[0.3em]">No notifications</div>)}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-10 animate-fadeIn">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Account Settings</h2>
                    <div className="bg-white rounded-[3rem] p-10 md:p-16 border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col md:flex-row items-center gap-12 mb-16 relative z-10">
                            <div className="w-32 h-32 rounded-[2.5rem] relative overflow-hidden border-8 border-slate-50 shadow-2xl ring-4 ring-[var(--oshi-color)]/5">
                                {user.iconUrl ? <Image src={user.iconUrl} alt="アイコン" fill className="object-cover" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><FiUser size={48}/></div>}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{user.handleName}</h3>
                                <p className="text-slate-400 text-sm font-bold mt-2">{user.email}</p>
                                <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                                    <Link href="/mypage/edit" className="px-10 py-3.5 bg-slate-900 text-white text-[11px] font-black rounded-full hover:bg-slate-800 transition-all uppercase tracking-[0.2em] shadow-xl">編集する</Link>
                                    <button onClick={logout} className="px-10 py-3.5 border-2 border-slate-100 text-slate-400 text-[11px] font-black rounded-full hover:bg-red-50 hover:text-red-400 hover:border-red-100 transition-all uppercase tracking-[0.2em]">ログアウト</button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                                <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">招待用コード</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-black text-slate-900 tracking-widest font-mono group-hover:text-[var(--oshi-color)] transition-colors">{user.referralCode || '----'}</span>
                                    <button onClick={() => {navigator.clipboard.writeText(user.referralCode); toast.success('コピーしました')}} className="text-slate-300 hover:text-[var(--oshi-color)] transition-all active:scale-90"><FiCheckCircle size={24}/></button>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">現在の応援ランク</p>
                                <SupportLevelBadge level={user.supportLevel} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}