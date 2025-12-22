"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { 
  FiUser, FiList, FiHeart, FiBell, FiSettings, 
  FiPlus, FiActivity, FiCheckCircle, FiAlertCircle, 
  FiShoppingCart, FiSearch, FiCamera, FiLogOut, FiChevronRight
} from 'react-icons/fi';

// コンポーネントが存在しない場合のフォールバック（開発用）
const UploadFormStub = () => <div className="p-4 border border-dashed rounded text-gray-400 text-center">画像投稿フォーム (components/UploadForm.jsを作成してください)</div>;
const SupportLevelBadgeStub = ({ level }) => <span className="text-xs bg-gray-200 px-2 py-1 rounded">{level || 'No Rank'}</span>;

// 実際のインポート（ファイルが存在することを確認してください）
import UploadForm from '@/app/components/UploadForm'; 
import SupportLevelBadge from '@/app/components/SupportLevelBadge'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ステータスバッジ
const getStatusBadge = (status) => {
  const styles = {
    'PENDING_APPROVAL': { label: '審査中', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' },
    'FUNDRAISING': { label: '募集中', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📢' },
    'SUCCESSFUL': { label: '達成！', color: 'bg-green-100 text-green-800 border-green-200', icon: '🎉' },
    'COMPLETED': { label: '完了', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '✅' },
    'CANCELED': { label: '中止', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '🚫' },
    'REJECTED': { label: '却下', color: 'bg-red-100 text-red-800 border-red-200', icon: '❌' },
  };
  const s = styles[status] || { label: status, color: 'bg-gray-100 text-gray-500', icon: '?' };
  
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${s.color} shadow-sm`}>
      <span>{s.icon}</span> {s.label}
    </span>
  );
};

export default function MyPageContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingData, setLoadingData] = useState(true); 

  const fetchMyData = useCallback(async () => {
    if (!user || !user.id) return; 
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 並列でデータ取得
      const [createdRes, pledgedRes, notifRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${user.id}/created-projects`),
        fetch(`${API_URL}/api/users/${user.id}/pledged-projects`),
        fetch(`${API_URL}/api/notifications`, { headers }),
        fetch(`${API_URL}/api/users/${user.id}/posts`).catch(() => ({ ok: false })) // エラーでも止まらないように
      ]);

      if (createdRes.ok) setCreatedProjects(await createdRes.json());
      if (pledgedRes.ok) setPledgedProjects(await pledgedRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (postsRes.ok) setMyPosts(await postsRes.json()); 

    } catch (error) {
      console.error("データ取得エラー:", error);
    } finally {
      setLoadingData(false);
    }
  }, [user]); 

  useEffect(() => {
    if (authLoading) return; 
    if (!user) { router.push('/login'); return; }
    fetchMyData(); 
  }, [user, authLoading, router, fetchMyData]); 

  const markAsRead = async (notifId) => {
    try {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        await fetch(`${API_URL}/api/notifications/${notifId}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    } catch (e) { console.error(e); }
  };

  if (authLoading || !user) return <div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div></div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ナビゲーションボタン用コンポーネント
  const NavButton = ({ id, label, icon: Icon, badge }) => (
    <button 
        onClick={() => setActiveTab(id)} 
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group ${
            activeTab === id 
            ? 'bg-sky-50 text-sky-600 shadow-sm' 
            : 'text-gray-500 hover:bg-white hover:shadow-sm'
        }`}
    >
        <Icon size={20} className={`transition-colors ${activeTab === id ? 'text-sky-500' : 'text-gray-400 group-hover:text-gray-600'}`}/>
        {label}
        {badge !== undefined && (
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs transition-transform ${badge > 0 ? 'bg-red-500 text-white scale-100' : 'bg-gray-100 text-gray-400 scale-90'}`}>
                {badge}
            </span>
        )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* ★★★ 左サイドバー ★★★ */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-100 md:min-h-screen shrink-0 md:sticky md:top-0 md:h-screen overflow-y-auto">
        {/* ユーザー情報カード */}
        <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full relative overflow-hidden border-2 border-sky-100 shadow-sm shrink-0">
                    {user.iconUrl ? (
                        <Image 
                            src={user.iconUrl} 
                            alt={user.handleName} 
                            fill 
                            style={{ objectFit: 'cover' }}
                            sizes="56px"
                            className="hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"><FiUser size={24}/></div>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate text-lg">{user.handleName}</p>
                    <div className="flex items-center gap-2 mt-1">
                         {/* Badgeコンポーネントがある場合は使用、なければスタブ */}
                        {SupportLevelBadge ? <SupportLevelBadge level={user.supportLevel} /> : <SupportLevelBadgeStub level={user.supportLevel} />}
                    </div>
                </div>
            </div>

            {/* ポイントカード */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-5 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                <p className="text-xs text-slate-300 mb-1">現在の保有ポイント</p>
                <div className="flex justify-between items-end">
                    <p className="text-2xl font-bold font-mono tracking-wider">{(user.points || 0).toLocaleString()} <span className="text-sm">pt</span></p>
                    <Link href="/points" className="bg-sky-500 hover:bg-sky-400 text-white text-xs px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1 shadow-md">
                        <FiShoppingCart size={12}/> 購入
                    </Link>
                </div>
            </div>
        </div>
        
        {/* ナビゲーション */}
        <nav className="p-4 space-y-1">
            <p className="px-4 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Menu</p>
            <NavButton id="dashboard" label="ダッシュボード" icon={FiActivity} />
            <NavButton id="created" label="作成した企画" icon={FiList} badge={createdProjects.length} />
            <NavButton id="pledged" label="支援した企画" icon={FiHeart} badge={pledgedProjects.length} />
            <NavButton id="posts" label="アルバム・投稿" icon={FiCamera} />
            <NavButton id="notifications" label="通知" icon={FiBell} badge={unreadCount} />
            <NavButton id="profile" label="プロフィール設定" icon={FiSettings} />
            
            {/* 企画作成ボタン (強調) */}
            <Link href="/projects/create" className="mt-6 flex items-center justify-center gap-2 w-full bg-gradient-to-r from-sky-400 to-sky-600 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <FiPlus size={20}/> 企画を立ち上げる
            </Link>
        </nav>
        
        <div className="p-4 mt-auto border-t border-gray-100">
             <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <FiLogOut size={18}/> ログアウト
            </button>
        </div>
      </aside>

      {/* ★★★ メインコンテンツエリア ★★★ */}
      <main className="flex-grow p-4 md:p-10 overflow-y-auto bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
            
            {/* ダッシュボード */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">おかえりなさい、{user.handleName}さん！</h1>
                            <p className="text-gray-500 text-sm mt-1">今日のフラスタ活動をチェックしましょう。</p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <div onClick={() => setActiveTab('notifications')} className="bg-white border-l-4 border-orange-400 p-4 rounded-r-xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-full group-hover:scale-110 transition-transform">
                                    <FiBell size={20}/>
                                </div>
                                <span className="font-bold text-gray-700">{unreadCount}件の未読通知があります</span>
                            </div>
                            <FiChevronRight className="text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"/>
                        </div>
                    )}

                    {/* 進行中の企画セクション */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center"><FiActivity className="mr-2 text-sky-500"/> 進行中の企画</h2>
                            {createdProjects.length > 0 && <button onClick={() => setActiveTab('created')} className="text-xs text-sky-600 font-bold hover:underline">すべて見る</button>}
                        </div>
                        
                        {createdProjects.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELED').length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {createdProjects.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELED').slice(0, 4).map(project => (
                                    <ProjectCard key={project.id} project={project} isOwner={true} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center shadow-sm">
                                <div className="text-4xl mb-4">🌱</div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">まだ進行中の企画はありません</h3>
                                <p className="text-gray-500 text-sm mb-6">推しへの想いを形にするために、<br/>最初のプロジェクトを立ち上げてみませんか？</p>
                                <Link href="/projects/create" className="inline-flex items-center gap-2 text-sky-600 font-bold hover:bg-sky-50 px-4 py-2 rounded-lg transition-colors">
                                    <FiPlus/> 企画作成ページへ
                                </Link>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* 作成した企画一覧 */}
            {activeTab === 'created' && (
                <div className="animate-fadeIn space-y-6">
                    <h1 className="text-2xl font-bold text-gray-800">作成した企画</h1>
                    {createdProjects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {createdProjects.map(project => (
                                <ProjectCard key={project.id} project={project} isOwner={true} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm">企画はまだありません</div>
                    )}
                </div>
            )}

            {/* 支援した企画一覧 */}
            {activeTab === 'pledged' && (
                <div className="animate-fadeIn space-y-6">
                    <h1 className="text-2xl font-bold text-gray-800">支援した企画</h1>
                    {pledgedProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {pledgedProjects.map(pledge => (
                                pledge.project && (
                                    <Link key={pledge.id} href={`/projects/${pledge.project.id}`} className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-sky-200 transition-all group overflow-hidden">
                                        <div className="relative h-32 bg-gray-100">
                                            {pledge.project.imageUrl ? (
                                                <Image src={pledge.project.imageUrl} alt={pledge.project.title} fill style={{objectFit:'cover'}} />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-300 text-xs">No Image</div>
                                            )}
                                            <div className="absolute top-2 left-2">
                                                {getStatusBadge(pledge.project.status)}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-800 group-hover:text-sky-600 line-clamp-1 mb-2">{pledge.project.title}</h3>
                                            <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                                                <div className="text-xs text-gray-500">
                                                    <p>支援日: {new Date(pledge.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <p className="font-bold text-sky-600 text-lg">{pledge.amount.toLocaleString()} <span className="text-xs">pt</span></p>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                            <p className="text-gray-500 mb-4">まだ支援した企画はありません</p>
                            <Link href="/projects" className="bg-sky-500 text-white px-6 py-2 rounded-full font-bold hover:bg-sky-600">企画を探す</Link>
                        </div>
                    )}
                </div>
            )}

            {/* アルバム・投稿 */}
            {activeTab === 'posts' && (
                <div className="animate-fadeIn space-y-8">
                    <header className="flex justify-between items-end">
                        <h1 className="text-2xl font-bold text-gray-800">アルバム・投稿</h1>
                    </header>
                    
                    {/* 投稿コンポーネントがある場合のみ表示 */}
                    {UploadForm ? (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h2 className="font-bold text-gray-700 mb-4 flex items-center"><FiCamera className="mr-2"/> 思い出を投稿する</h2>
                            <UploadForm onUploadComplete={fetchMyData} />
                        </div>
                    ) : <UploadFormStub />}

                    <div>
                        <h2 className="text-lg font-bold text-gray-700 mb-4">自分の投稿一覧</h2>
                        {myPosts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {myPosts.map(post => (
                                    <div key={post.id} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer">
                                        <Image 
                                            src={post.imageUrl} 
                                            alt={post.eventName || 'photo'} 
                                            fill 
                                            style={{ objectFit: 'cover' }}
                                            className="group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-white font-bold text-sm line-clamp-1">{post.eventName}</p>
                                            <p className="text-white/80 text-xs">{new Date(post.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400">投稿はまだありません</div>
                        )}
                    </div>
                </div>
            )}

            {/* 通知センター */}
            {activeTab === 'notifications' && (
                <div className="animate-fadeIn max-w-3xl">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">通知センター</h1>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {notifications.length > 0 ? notifications.map(n => (
                            <div 
                                key={n.id} 
                                onClick={() => { markAsRead(n.id); if(n.linkUrl) router.push(n.linkUrl); }}
                                className={`p-5 border-b border-gray-50 flex gap-4 cursor-pointer transition-colors hover:bg-gray-50 ${n.isRead ? 'bg-white' : 'bg-sky-50/40'}`}
                            >
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-gray-200' : 'bg-sky-500'}`}></div>
                                <div>
                                    <p className={`text-sm leading-relaxed ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-bold'}`}>{n.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-10 text-center text-gray-400">新しい通知はありません</div>
                        )}
                    </div>
                </div>
            )}

            {/* プロフィール設定 */}
            {activeTab === 'profile' && (
                <div className="animate-fadeIn max-w-2xl">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">プロフィール設定</h1>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-8">
                            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full relative overflow-hidden border-4 border-sky-50 shrink-0">
                                    {user.iconUrl ? (
                                        <Image src={user.iconUrl} alt="icon" fill style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"><FiUser size={32}/></div>
                                    )}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-xl font-bold text-gray-800">{user.handleName}</h2>
                                    <p className="text-gray-500 text-sm mt-1">{user.email}</p>
                                    <div className="mt-3">
                                        <Link href="/mypage/edit" className="inline-block px-6 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700 transition-colors">
                                            プロフィールを編集
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">紹介コード</h3>
                                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <span className="flex-grow font-mono text-lg font-bold text-gray-700 text-center tracking-widest">{user.referralCode || '----'}</span>
                                    <button 
                                        onClick={()=>{navigator.clipboard.writeText(user.referralCode); toast.success('コピーしました')}} 
                                        className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded font-bold hover:bg-gray-50 text-gray-600"
                                    >
                                        コピー
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">※ 友達が登録時にこのコードを入力すると、特典ポイントが付与されます。</p>
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

// --- サブコンポーネント: 企画カード (Next Action 付き) ---
function ProjectCard({ project, isOwner }) {
    const progress = project.targetAmount > 0 
        ? Math.min((project.collectedAmount / project.targetAmount) * 100, 100)
        : 0;
    
    // 次のアクションを提案するロジック
    let nextAction = null;
    if (isOwner) {
        if (project.status === 'PENDING_APPROVAL') 
            nextAction = { text: '運営の審査をお待ちください', color: 'text-yellow-600', bg: 'bg-yellow-50' };
        else if (project.status === 'FUNDRAISING' && !project.offer) 
            nextAction = { text: 'お花屋さんを探してオファーしましょう', link: `/florists?projectId=${project.id}`, linkText: '探す', color: 'text-sky-600', bg: 'bg-sky-50' };
        else if (project.offer?.status === 'PENDING') 
            nextAction = { text: 'お花屋さんからの返信待ちです', color: 'text-gray-500', bg: 'bg-gray-50' };
        else if (project.offer?.status === 'ACCEPTED' && !project.quotation) 
            nextAction = { text: 'チャットで見積もり相談をしましょう', link: `/chat/${project.offer.chatRoom?.id}`, linkText: 'チャット', color: 'text-indigo-600', bg: 'bg-indigo-50' };
        else if (project.status === 'SUCCESSFUL') 
            nextAction = { text: '目標達成！完了報告の準備をしましょう', link: `/projects/${project.id}`, linkText: '詳細', color: 'text-green-600', bg: 'bg-green-50' };
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-sky-200 transition-all flex flex-col sm:flex-row h-full">
            {/* サムネイル */}
            <div className="w-full sm:w-48 h-40 sm:h-auto bg-gray-100 relative shrink-0">
                {project.imageUrl ? (
                    <Image 
                        src={project.imageUrl} 
                        alt={project.title} 
                        fill 
                        sizes="(max-width: 640px) 100vw, 192px"
                        style={{ objectFit: 'cover' }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 flex-col gap-2">
                        <span className="text-2xl">💐</span>
                        <span className="text-xs">No Image</span>
                    </div>
                )}
                <div className="absolute top-2 left-2 z-10">
                    {getStatusBadge(project.status)}
                </div>
            </div>
            
            {/* 内容 */}
            <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-2 leading-tight">
                        <Link href={`/projects/${project.id}`} className="hover:text-sky-600 transition-colors">
                            {project.title}
                        </Link>
                    </h3>
                    <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                        🗓 納品予定: {new Date(project.deliveryDateTime).toLocaleDateString()}
                    </p>
                    
                    {/* 進捗バー */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-400 to-sky-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs mb-4">
                        <span className="font-bold text-sky-600">{progress.toFixed(0)}%</span>
                        <span className="text-gray-400">{project.collectedAmount.toLocaleString()} / {project.targetAmount.toLocaleString()} pt</span>
                    </div>
                </div>

                {/* アクションエリア */}
                {nextAction && (
                    <div className={`mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs ${nextAction.bg} -mx-5 -mb-5 px-5 py-3`}>
                        <div className={`font-bold flex items-center gap-1.5 ${nextAction.color}`}>
                            <FiAlertCircle className="shrink-0"/>
                            <span className="truncate">{nextAction.text}</span>
                        </div>
                        {nextAction.link && (
                            <Link href={nextAction.link} className="shrink-0 bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors font-bold shadow-sm">
                                {nextAction.linkText}
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}