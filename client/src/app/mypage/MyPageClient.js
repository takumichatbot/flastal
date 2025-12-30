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
  FiAward, FiMessageSquare, FiTrendingUp, FiClock, FiStar,
  FiMapPin, FiFlag, FiCompass, FiZap
} from 'react-icons/fi';
import { motion } from 'framer-motion';

import UploadForm from '@/app/components/UploadForm'; 
import SupportLevelBadge from '@/app/components/SupportLevelBadge'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- 進捗ステータスの日本語設定 ---
const PROJECT_STATUS_CONFIG = {
  'PENDING_APPROVAL': { label: '確認中', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', step: 1 },
  'FUNDRAISING': { label: '参加者募集中', color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', step: 2 },
  'SUCCESSFUL': { label: '目標達成！', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', step: 3 },
  'IN_PRODUCTION': { label: '制作しています', color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100', step: 4 },
  'COMPLETED': { label: 'お届け完了', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', step: 5 },
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
                            <div className={`absolute top-2 right-1/2 w-full h-[2px] -z-10 ${isActive ? 'bg-pink-300' : 'bg-gray-100'}`} />
                        )}
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${isActive ? 'bg-pink-500 border-pink-200' : 'bg-white border-gray-100'}`} />
                        <span className={`text-[10px] font-bold ${isActive ? 'text-pink-600' : 'text-gray-300'}`}>{s}</span>
                    </div>
                );
            })}
        </div>
    );
};

// --- 企画カード ---
function ProjectCard({ project, isOwner }) {
    const config = PROJECT_STATUS_CONFIG[project.status] || { label: project.status, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', step: 0 };
    const progress = project.targetAmount > 0 ? Math.min((project.collectedAmount / project.targetAmount) * 100, 100) : 0;
    
    return (
        <div className="bg-white rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col sm:flex-row">
            <div className="w-full sm:w-64 h-40 sm:h-auto relative shrink-0">
                {project.imageUrl ? (
                    <Image src={project.imageUrl} alt={project.title} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-pink-50 flex items-center justify-center text-pink-200 text-2xl">💐</div>
                )}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${config.bg} ${config.color} ${config.border}`}>
                    {config.label}
                </div>
            </div>
            <div className="p-6 flex-grow flex flex-col">
                <Link href={`/projects/${project.id}`}>
                    <h3 className="font-bold text-gray-800 text-lg hover:text-pink-500 transition-colors line-clamp-2">{project.title}</h3>
                </Link>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><FiClock /> 納品: {new Date(project.deliveryDateTime).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><FiUser /> {isOwner ? '主催' : '応援'}</span>
                </div>
                <div className="mt-5">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xl font-black text-gray-800">{progress.toFixed(0)}%</span>
                        <span className="text-[10px] text-gray-400 font-black">{project.collectedAmount.toLocaleString()} / {project.targetAmount.toLocaleString()} pt</span>
                    </div>
                    <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-pink-400" />
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

  const NavButton = ({ id, label, icon: Icon, badge, color = "text-gray-500" }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-bold transition-all relative ${activeTab === id ? 'text-pink-600 bg-pink-50/50' : `${color} hover:bg-gray-50`}`}>
        <Icon size={18} />
        <span className="flex-grow text-left">{label}</span>
        {badge > 0 && <span className="bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>}
        {activeTab === id && <div className="absolute right-0 w-1 h-6 bg-pink-500 rounded-l-full" />}
    </button>
  );

  const QuickLink = ({ href, label, icon: Icon, sub }) => (
    <Link href={href} className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all">
        <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Icon size={24} />
        </div>
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{sub}</p>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
      {/* --- サイドバー --- */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-100 sticky top-0 md:h-screen overflow-y-auto flex flex-col z-20">
        <div className="p-8 pb-4 flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl relative overflow-hidden border-4 border-white shadow-sm mb-4">
                {user.iconUrl ? <Image src={user.iconUrl} alt="アイコン" fill className="object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300"><FiUser size={32}/></div>}
            </div>
            <h2 className="font-bold text-gray-800 text-lg">{user.handleName}</h2>
            <div className="mt-2"><SupportLevelBadge level={user.supportLevel} /></div>
        </div>

        <div className="px-4 py-2">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Point Balance</p>
                <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold">{(user.points || 0).toLocaleString()}</p>
                    <Link href="/points" className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors"><FiPlus size={16}/></Link>
                </div>
            </div>
        </div>

        <nav className="mt-4 flex-grow">
            <p className="px-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">My Activity</p>
            <NavButton id="home" label="ホーム" icon={FiActivity} />
            <NavButton id="created" label="主催した企画" icon={FiList} badge={createdProjects.length} />
            <NavButton id="pledged" label="参加中の企画" icon={FiHeart} badge={pledgedProjects.length} />
            <NavButton id="album" label="アルバム" icon={FiCamera} />
            
            <p className="px-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-6 mb-2">Explore</p>
            <Link href="/projects" className="w-full flex items-center gap-3 px-6 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"><FiCompass size={18} /><span>支援する企画を探す</span></Link>
            <Link href="/events" className="w-full flex items-center gap-3 px-6 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"><FiFlag size={18} /><span>公式企画・イベント</span></Link>
            <Link href="/venues" className="w-full flex items-center gap-3 px-6 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"><FiMapPin size={18} /><span>会場レギュレーション</span></Link>
            <Link href="/florists" className="w-full flex items-center gap-3 px-6 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"><FiZap size={18} /><span>お花屋さん一覧</span></Link>

            <p className="px-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-6 mb-2">System</p>
            <NavButton id="notifications" label="お知らせ" icon={FiBell} badge={unreadCount} />
            <NavButton id="settings" label="設定" icon={FiSettings} />
        </nav>
        
        <div className="p-6 border-t border-gray-50">
            <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest transition-colors w-full justify-center">
                <FiLogOut /> Sign Out
            </button>
        </div>
      </aside>

      {/* --- メインコンテンツ --- */}
      <main className="flex-grow p-4 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
            {activeTab === 'home' && (
                <div className="space-y-10 animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">おかえりなさい！</h1>
                            <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">Your Flower Project Station</p>
                        </div>
                        <Link href="/projects/create" className="flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                            <FiPlus /> 企画を立ち上げる
                        </Link>
                    </div>

                    {/* クイックアクセスパネル */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickLink href="/projects" label="企画を探す" icon={FiSearch} sub="Support Now" />
                        <QuickLink href="/events" label="イベント" icon={FiFlag} sub="Official News" />
                        <QuickLink href="/venues" label="会場確認" icon={FiMapPin} sub="Regulation" />
                        <QuickLink href="/florists" label="お花屋さん" icon={FiAward} sub="Artist List" />
                    </div>

                    {/* 動いている企画セクション */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                                進行中のプロジェクト
                            </h2>
                            <button onClick={() => setActiveTab('pledged')} className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">View All</button>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {[...createdProjects, ...pledgedProjects.map(p => p.project)]
                                .filter(p => p && p.status !== 'COMPLETED' && p.status !== 'CANCELED')
                                .slice(0, 3)
                                .map((p, i) => (
                                    <ProjectCard key={p.id + '-' + i} project={p} isOwner={p.plannerId === user.id} />
                                ))
                            }
                            {createdProjects.length + pledgedProjects.length === 0 && (
                                <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 text-center flex flex-col items-center">
                                    <div className="text-4xl mb-4 text-gray-100">🔭</div>
                                    <p className="text-gray-400 font-bold mb-6">進行中の企画はありません。支援する企画を探してみましょう！</p>
                                    <Link href="/projects" className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 transition-all">企画を探しに行く</Link>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* その他のタブ（created, pledged, album, notifications, settings）は既存のロジックを維持 */}
            {activeTab === 'created' && (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-bold text-gray-800">主催した企画</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {createdProjects.map(p => <ProjectCard key={p.id} project={p} isOwner={true} />)}
                    </div>
                </div>
            )}

            {activeTab === 'pledged' && (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-bold text-gray-800">参加中（支援した）企画</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {pledgedProjects.map(pledge => pledge.project && (
                            <ProjectCard key={pledge.id} project={pledge.project} isOwner={false} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'album' && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-xl font-bold text-gray-800 font-black tracking-tighter uppercase">Memory Album</h2>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"><UploadForm onUploadComplete={fetchMyData} /></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                        {myPosts.map(post => (
                            <div key={post.id} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm border border-gray-100">
                                <Image src={post.imageUrl} alt="思い出写真" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <p className="text-white font-bold text-xs">{post.eventName}</p>
                                    <p className="text-white/70 text-[9px] mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-bold text-gray-800 font-black tracking-tighter uppercase">Notifications</h2>
                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                        {notifications.length > 0 ? notifications.map(n => (
                            <div key={n.id} onClick={async () => {
                                    await authenticatedFetch(`${API_URL}/api/notifications/${n.id}/read`, { method: 'PATCH' });
                                    if(n.linkUrl) router.push(n.linkUrl);
                                    fetchMyData();
                                }}
                                className={`p-6 border-b border-gray-50 flex gap-4 cursor-pointer transition-all hover:bg-gray-50 ${n.isRead ? 'opacity-50' : ''}`}
                            >
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-gray-200' : 'bg-pink-500'}`} />
                                <div className="flex-1">
                                    <p className={`text-sm leading-relaxed ${n.isRead ? 'text-gray-500' : 'text-gray-800 font-bold'}`}>{n.message}</p>
                                    <p className="text-[10px] text-gray-300 mt-2 font-bold">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )) : (<div className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest">No notifications</div>)}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-bold text-gray-800 font-black tracking-tighter uppercase">Settings</h2>
                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                            <div className="w-24 h-24 rounded-3xl relative overflow-hidden border-4 border-pink-50">
                                {user.iconUrl ? <Image src={user.iconUrl} alt="アイコン" fill className="object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300"><FiUser size={40}/></div>}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h3 className="text-xl font-bold text-gray-800">{user.handleName}</h3>
                                <p className="text-gray-400 text-xs mt-1 font-bold">{user.email}</p>
                                <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                                    <Link href="/mypage/edit" className="px-6 py-2 bg-gray-800 text-white text-[10px] font-bold rounded-full hover:bg-gray-700 transition-all uppercase tracking-widest">編集する</Link>
                                    <button onClick={logout} className="px-6 py-2 border border-red-100 text-red-400 text-[10px] font-bold rounded-full hover:bg-red-50 transition-all uppercase tracking-widest">ログアウト</button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">紹介コード</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-gray-700 tracking-widest font-mono">{user.referralCode || '----'}</span>
                                    <button onClick={() => {navigator.clipboard.writeText(user.referralCode); toast.success('コピーしました')}} className="text-pink-500 hover:text-pink-600 transition-colors"><FiCheckCircle size={20}/></button>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">応援ランク</p>
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