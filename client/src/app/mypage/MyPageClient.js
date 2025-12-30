"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { 
  FiUser, FiList, FiHeart, FiBell, FiSettings, 
  FiPlus, FiActivity, FiCheckCircle, FiAlertCircle, 
  FiShoppingCart, FiSearch, FiCamera, FiLogOut, FiChevronRight,
  FiTrophy, FiMessageSquare, FiTrendingUp, FiClock, FiStar
} from 'react-icons/fi';

import UploadForm from '@/app/components/UploadForm'; 
import SupportLevelBadge from '@/app/components/SupportLevelBadge'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- ステータス設定 ---
const PROJECT_STATUS_CONFIG = {
  'PENDING_APPROVAL': { label: '審査中', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', step: 1 },
  'FUNDRAISING': { label: '募集中', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', step: 2 },
  'SUCCESSFUL': { label: '目標達成', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', step: 3 },
  'IN_PRODUCTION': { label: '制作中', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', step: 4 },
  'COMPLETED': { label: '完了', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', step: 5 },
  'CANCELED': { label: '中止', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100', step: 0 },
};

// --- サブコンポーネント: ステップインジケーター ---
const ProgressSteps = ({ currentStep }) => {
    const steps = ['審査', '募集', '達成', '制作', '完了'];
    return (
        <div className="flex items-center w-full mt-4 gap-1">
            {steps.map((s, i) => {
                const stepNum = i + 1;
                const isActive = stepNum <= currentStep;
                const isCurrent = stepNum === currentStep;
                return (
                    <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className={`h-1 w-full rounded-full transition-all duration-500 ${isActive ? 'bg-sky-500' : 'bg-gray-100'}`} />
                        <span className={`text-[9px] font-bold tracking-tighter ${isCurrent ? 'text-sky-600' : 'text-gray-400'}`}>{s}</span>
                    </div>
                );
            })}
        </div>
    );
};

// --- サブコンポーネント: 進行中企画カード (ミンサカ風) ---
function ProjectCard({ project, isOwner }) {
    const config = PROJECT_STATUS_CONFIG[project.status] || { label: project.status, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', step: 0 };
    const progress = project.targetAmount > 0 ? Math.min((project.collectedAmount / project.targetAmount) * 100, 100) : 0;
    
    let nextAction = null;
    if (isOwner) {
        if (project.status === 'FUNDRAISING' && !project.offer) 
            nextAction = { text: 'お花屋さんを決定してください', link: `/florists?projectId=${project.id}`, linkText: '花屋を探す' };
        else if (project.offer?.status === 'ACCEPTED' && !project.quotation) 
            nextAction = { text: '見積もりの最終確認が必要です', link: `/chat/${project.offer.chatRoom?.id}`, linkText: 'チャットを開く' };
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 overflow-hidden flex flex-col">
            <div className="relative aspect-video sm:aspect-[16/7] overflow-hidden">
                {project.imageUrl ? (
                    <Image src={project.imageUrl} alt={project.title} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-bold">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.bg} ${config.color} ${config.border} shadow-sm`}>
                    {config.label}
                </div>
            </div>

            <div className="p-6 flex-grow flex flex-col">
                <Link href={`/projects/${project.id}`} className="group">
                    <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-sky-600 transition-colors line-clamp-2 mb-2">
                        {project.title}
                    </h3>
                </Link>
                
                <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mb-4">
                    <span className="flex items-center gap-1"><FiClock /> {new Date(project.deliveryDateTime).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><FiUser /> {isOwner ? '主催' : '参加'}</span>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-2xl font-black text-slate-800 tracking-tighter">
                            {progress.toFixed(0)}<span className="text-sm ml-0.5">%</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {project.collectedAmount.toLocaleString()} / {project.targetAmount.toLocaleString()} pt
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500" 
                        />
                    </div>
                    <ProgressSteps currentStep={config.step} />
                </div>

                {nextAction && (
                    <div className="mt-6 p-4 bg-sky-50 rounded-2xl flex items-center justify-between gap-3 animate-pulse ring-1 ring-sky-100">
                        <p className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
                            <FiAlertCircle className="shrink-0" /> {nextAction.text}
                        </p>
                        <Link href={nextAction.link} className="bg-sky-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-md hover:bg-sky-700 transition-colors whitespace-nowrap">
                            {nextAction.linkText}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- メインコンポーネント ---
export default function MyPageClient() {
  const { user, isLoading: authLoading, logout, authenticatedFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
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
  const activeProjectsCount = useMemo(() => 
    [...createdProjects, ...pledgedProjects.map(p => p.project)].filter(p => p && p.status !== 'COMPLETED' && p.status !== 'CANCELED').length
  , [createdProjects, pledgedProjects]);

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing Session...</p>
        </div>
    </div>
  );

  const NavButton = ({ id, label, icon: Icon, badge }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-black transition-all relative ${activeTab === id ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
        <Icon size={20} />
        <span className="flex-grow text-left uppercase tracking-tighter">{label}</span>
        {badge > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>}
        {activeTab === id && <motion.div layoutId="nav-active" className="absolute left-0 w-1 h-8 bg-sky-500 rounded-r-full" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* --- Sidebar (Left) --- */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen overflow-y-auto z-20">
        <div className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-sky-100 border-4 border-white mb-4 rotate-3">
                    {user.iconUrl ? <Image src={user.iconUrl} alt={user.handleName} fill className="object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><FiUser size={40}/></div>}
                </div>
                <h2 className="font-black text-slate-800 text-xl tracking-tighter">{user.handleName}</h2>
                <div className="mt-2"><SupportLevelBadge level={user.supportLevel} /></div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden mb-8">
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                    <p className="text-3xl font-black font-mono tracking-tighter">{(user.points || 0).toLocaleString()}<span className="text-sm ml-1 opacity-50">PT</span></p>
                    <Link href="/points" className="mt-4 flex items-center justify-center gap-2 w-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-black py-3 rounded-2xl transition-all shadow-lg shadow-sky-900/20">
                        <FiShoppingCart size={14}/> CHARGE POINTS
                    </Link>
                </div>
                <FiStar className="absolute -right-4 -bottom-4 text-8xl text-white/5 rotate-12" />
            </div>

            <nav className="space-y-1">
                <NavButton id="dashboard" label="Dashboard" icon={FiActivity} />
                <NavButton id="created" label="Organizer" icon={FiList} badge={createdProjects.length} />
                <NavButton id="pledged" label="Supported" icon={FiHeart} badge={pledgedProjects.length} />
                <NavButton id="posts" label="Album" icon={FiCamera} />
                <NavButton id="notifications" label="Notifications" icon={FiBell} badge={unreadCount} />
                <NavButton id="profile" label="Settings" icon={FiSettings} />
            </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-slate-50">
            <button onClick={logout} className="flex items-center gap-3 text-slate-400 hover:text-red-500 font-bold text-sm transition-colors uppercase tracking-widest">
                <FiLogOut size={18}/> Sign Out
            </button>
        </div>
      </aside>

      {/* --- Main Content (Center) --- */}
      <main className="flex-grow p-4 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
            {activeTab === 'dashboard' && (
                <div className="space-y-12 animate-fadeIn">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">Hello, {user.handleName}!</h1>
                            <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.2em]">Welcome back to your flastal dashboard</p>
                        </div>
                        <Link href="/projects/create" className="flex items-center gap-2 bg-slate-900 text-white font-black px-8 py-4 rounded-[1.5rem] shadow-2xl hover:bg-slate-800 transition-all active:scale-95">
                            <FiPlus /> START PROJECT
                        </Link>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Active', value: activeProjectsCount, icon: <FiActivity />, color: 'text-sky-500' },
                            { label: 'Created', value: createdProjects.length, icon: <FiTrophy />, color: 'text-amber-500' },
                            { label: 'Supported', value: pledgedProjects.length, icon: <FiHeart />, color: 'text-pink-500' },
                            { label: 'Messages', value: notifications.length, icon: <FiMessageSquare />, color: 'text-indigo-500' },
                        ].map(s => (
                            <div key={s.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className={`mb-3 ${s.color}`}>{s.icon}</div>
                                <p className="text-2xl font-black text-slate-800">{s.value}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Active Projects (ミンサカ mina風) */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <FiTrendingUp className="text-sky-500"/> CURRENT PROJECTS
                            </h2>
                            <button onClick={() => setActiveTab('created')} className="text-[10px] font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-4 py-2 rounded-full">View All</button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            {[...createdProjects, ...pledgedProjects.map(p => p.project)]
                                .filter(p => p && p.status !== 'COMPLETED' && p.status !== 'CANCELED')
                                .slice(0, 3)
                                .map((p, i) => (
                                    <ProjectCard key={p.id + i} project={p} isOwner={p.plannerId === user.id} />
                                ))
                            }
                            {activeProjectsCount === 0 && (
                                <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                                    <p className="text-slate-300 font-black text-lg uppercase tracking-widest mb-4 text-center mx-auto">No Active Projects</p>
                                    <Link href="/projects" className="text-sky-500 font-black text-sm hover:underline uppercase">Discover Projects</Link>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'created' && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">YOUR PROJECTS</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {createdProjects.map(p => <ProjectCard key={p.id} project={p} isOwner={true} />)}
                    </div>
                </div>
            )}

            {activeTab === 'pledged' && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">SUPPORTED PROJECTS</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {pledgedProjects.map(pledge => pledge.project && (
                            <ProjectCard key={pledge.id} project={pledge.project} isOwner={false} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'posts' && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Memory Album</h2>
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <UploadForm onUploadComplete={fetchMyData} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {myPosts.map(post => (
                            <div key={post.id} className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-lg">
                                <Image src={post.imageUrl} alt="memory" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                    <p className="text-white font-black text-sm tracking-tight">{post.eventName}</p>
                                    <p className="text-white/60 text-[10px] font-bold uppercase mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">NOTIFICATIONS</h2>
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                        {notifications.length > 0 ? notifications.map(n => (
                            <div 
                                key={n.id} 
                                onClick={async () => {
                                    await authenticatedFetch(`${API_URL}/api/notifications/${n.id}/read`, { method: 'PATCH' });
                                    if(n.linkUrl) router.push(n.linkUrl);
                                    fetchMyData();
                                }}
                                className={`p-8 border-b border-slate-50 flex gap-6 cursor-pointer transition-all hover:bg-slate-50 ${n.isRead ? 'opacity-50' : 'bg-sky-50/20'}`}
                            >
                                <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-slate-200' : 'bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.5)]'}`} />
                                <div className="flex-1">
                                    <p className={`text-base leading-relaxed ${n.isRead ? 'text-slate-500' : 'text-slate-800 font-black'}`}>{n.message}</p>
                                    <p className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-widest">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest">No notifications</div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">SETTINGS</h2>
                    <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-12 border border-slate-100">
                        <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
                            <div className="w-32 h-32 rounded-[3rem] relative overflow-hidden border-8 border-slate-50 shadow-inner">
                                {user.iconUrl ? <Image src={user.iconUrl} alt="icon" fill className="object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><FiUser size={48}/></div>}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{user.handleName}</h2>
                                <p className="text-slate-400 font-bold mt-1">{user.email}</p>
                                <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                                    <Link href="/mypage/edit" className="px-8 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg">Edit Profile</Link>
                                    <button onClick={logout} className="px-8 py-3 bg-red-50 text-red-500 text-xs font-black rounded-2xl hover:bg-red-100 transition-all uppercase tracking-widest">Log Out</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Referral Code</p>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-black font-mono text-slate-700 tracking-tighter">{user.referralCode || '----'}</span>
                                    <button onClick={() => {navigator.clipboard.writeText(user.referralCode); toast.success('Copied!')}} className="ml-auto p-3 bg-white text-slate-400 hover:text-sky-500 rounded-xl shadow-sm transition-colors"><FiCheckCircle size={20}/></button>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Support Level</p>
                                <div className="flex items-center gap-2">
                                    <SupportLevelBadge level={user.supportLevel} />
                                </div>
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