"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiUser, FiList, FiHeart, FiBell, FiSettings, FiPlus, FiMessageSquare, FiActivity, FiCheckCircle, FiAlertCircle, FiShoppingCart, FiSearch } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★ ステータスバッジ
const getStatusBadge = (status) => {
  const styles = {
    'PENDING_APPROVAL': { label: '審査中', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' },
    'FUNDRAISING': { label: '募集中', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📢' },
    'SUCCESSFUL': { label: '目標達成', color: 'bg-green-100 text-green-800 border-green-200', icon: '🎉' },
    'COMPLETED': { label: '完了', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '✅' },
    'CANCELED': { label: '中止', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '🚫' },
    'REJECTED': { label: '却下', color: 'bg-red-100 text-red-800 border-red-200', icon: '❌' },
  };
  const s = styles[status] || { label: '不明', color: 'bg-gray-100', icon: '?' };
  
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${s.color}`}>
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
  const [loadingData, setLoadingData] = useState(true); 

  const fetchMyData = useCallback(async () => {
    if (!user || !user.id) return; 
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [createdRes, pledgedRes, notifRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${user.id}/created-projects`),
        fetch(`${API_URL}/api/users/${user.id}/pledged-projects`),
        fetch(`${API_URL}/api/notifications`, { headers })
      ]);

      if (createdRes.ok) setCreatedProjects(await createdRes.json());
      if (pledgedRes.ok) setPledgedProjects(await pledgedRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());

    } catch (error) {
      console.error("データ取得エラー:", error);
      toast.error("データの取得に失敗しました");
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

  if (authLoading || !user) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div></div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* ★★★ 左サイドバー (ナビゲーション) ★★★ */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 md:min-h-screen shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            {user.iconUrl ? (
                <img src={user.iconUrl} className="w-10 h-10 rounded-full object-cover border"/>
            ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center"><FiUser/></div>
            )}
            <div className="overflow-hidden">
                <p className="font-bold text-gray-800 truncate">{user.handleName}</p>
                
                {/* ★★★ ポイント表示と購入ボタン ★★★ */}
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-sky-600 font-bold">{(user.points || 0).toLocaleString()} pt</p>
                    <Link href="/points" className="flex items-center gap-1 bg-sky-100 hover:bg-sky-200 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors">
                        <FiShoppingCart size={10} /> 購入
                    </Link>
                </div>
            </div>
        </div>
        
        <nav className="p-4 space-y-1">
            {/* ダッシュボード */}
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-sky-50 text-sky-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                <FiActivity size={18}/> ダッシュボード
            </button>

            {/* 作成した企画 */}
            <button onClick={() => setActiveTab('created')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'created' ? 'bg-sky-50 text-sky-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                <FiList size={18}/> 作成した企画 <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{createdProjects.length}</span>
            </button>
            {/* ★★★ 【追加】サイドバー内：企画を作成するボタン ★★★ */}
            <Link href="/projects/create" className="ml-4 w-[90%] flex items-center gap-3 px-4 py-2 text-xs font-bold rounded-lg text-pink-500 hover:bg-pink-50 transition-colors mb-2">
                <FiPlus size={16}/> 企画を作成する
            </Link>

            {/* 支援した企画 */}
            <button onClick={() => setActiveTab('pledged')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'pledged' ? 'bg-sky-50 text-sky-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                <FiHeart size={18}/> 支援した企画
            </button>
            {/* ★★★ 【追加】サイドバー内：企画を探すボタン ★★★ */}
            <Link href="/projects" className="ml-4 w-[90%] flex items-center gap-3 px-4 py-2 text-xs font-bold rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors mb-2">
                <FiSearch size={16}/> 企画を探す
            </Link>

            {/* 通知 */}
            <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'notifications' ? 'bg-sky-50 text-sky-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                <FiBell size={18}/> 通知 <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{unreadCount}</span>
            </button>

            {/* プロフィール設定 */}
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-sky-50 text-sky-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                <FiSettings size={18}/> プロフィール設定
            </button>
        </nav>
        
        {/* 管理者メニュー */}
        {user.role === 'ADMIN' && (
            <div className="p-4 mt-4 border-t border-gray-100">
                <Link href="/admin" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700">
                    👑 管理画面へ
                </Link>
            </div>
        )}
      </aside>

      {/* ★★★ メインコンテンツエリア ★★★ */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        
        {/* ダッシュボード (サマリー) */}
        {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
                </header>

                {/* 未読通知がある場合のアラート */}
                {unreadCount > 0 && (
                    <div onClick={() => setActiveTab('notifications')} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-orange-100 transition-colors">
                        <div className="flex items-center gap-3 text-orange-800">
                            <FiBell className="fill-orange-500 text-orange-600"/>
                            <span className="font-bold">{unreadCount}件の未読通知があります</span>
                        </div>
                        <span className="text-sm text-orange-600 underline">確認する</span>
                    </div>
                )}

                {/* 直近の進行中企画 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center"><FiActivity className="mr-2"/> 進行中の企画</h2>
                    {createdProjects.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELED').length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {createdProjects.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELED').slice(0, 4).map(project => (
                                <ProjectCard key={project.id} project={project} isOwner={true} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
                            <p className="text-gray-500 mb-2">現在進行中の企画はありません。</p>
                            <Link href="/projects/create" className="text-sky-600 font-bold hover:underline">企画を立ち上げてみましょう！</Link>
                        </div>
                    )}
                </section>
            </div>
        )}

        {/* 作成した企画一覧 */}
        {activeTab === 'created' && (
            <div className="animate-fadeIn">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">作成した企画一覧</h1>
                {createdProjects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {createdProjects.map(project => (
                            <ProjectCard key={project.id} project={project} isOwner={true} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-6">企画はまだありません。</p>
                )}

                {/* ★★★ 企画を作成するボタン (リストの下に配置) ★★★ */}
                <div className="mt-8 flex justify-center">
                    <Link href="/projects/create" className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:-translate-y-0.5">
                        <FiPlus size={20}/> 新しい企画を作成する
                    </Link>
                </div>
            </div>
        )}

        {/* 支援した企画一覧 */}
        {activeTab === 'pledged' && (
            <div className="animate-fadeIn">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">支援した企画一覧</h1>
                {pledgedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pledgedProjects.map(pledge => (
                            pledge.project && (
                                <Link key={pledge.id} href={`/projects/${pledge.project.id}`} className="block bg-white p-5 rounded-xl border hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-800 group-hover:text-sky-600 line-clamp-1">{pledge.project.title}</h3>
                                        {getStatusBadge(pledge.project.status)}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p>支援額: <span className="font-bold text-sky-600">{pledge.amount.toLocaleString()} pt</span></p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(pledge.createdAt).toLocaleDateString()} に支援</p>
                                    </div>
                                </Link>
                            )
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-6">まだ支援した企画はありません。</p>
                )}

                {/* ★★★ 企画を探すボタン (リストの下に配置) ★★★ */}
                <div className="mt-8 flex justify-center">
                    <Link href="/projects" className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:-translate-y-0.5">
                        <FiSearch size={20}/> 他の企画を探しに行く
                    </Link>
                </div>
            </div>
        )}

        {/* 通知センター */}
        {activeTab === 'notifications' && (
            <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">通知センター</h1>
                    {notifications.length > 0 && (
                        <button onClick={()=>{/* 全既読処理APIがあれば呼ぶ */}} className="text-xs text-gray-500 hover:text-sky-600">すべて既読にする</button>
                    )}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {notifications.length > 0 ? notifications.map(n => (
                        <div 
                            key={n.id} 
                            onClick={() => {
                                markAsRead(n.id);
                                if(n.linkUrl) router.push(n.linkUrl);
                            }}
                            className={`p-4 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${n.isRead ? 'opacity-60' : 'bg-sky-50/30'}`}
                        >
                            <div className={`mt-1 min-w-[8px] h-2 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-sky-500'}`}></div>
                            <div>
                                <p className="text-sm text-gray-800 leading-relaxed">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-gray-400">通知はありません</div>
                    )}
                </div>
            </div>
        )}

        {/* プロフィール編集 */}
        {activeTab === 'profile' && (
            <div className="max-w-xl animate-fadeIn">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">プロフィール設定</h1>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    {/* 簡易表示（編集機能は /mypage/edit へ） */}
                    <div className="flex items-center gap-4 mb-6">
                        {user.iconUrl ? <img src={user.iconUrl} className="w-16 h-16 rounded-full border"/> : <div className="w-16 h-16 rounded-full bg-gray-200"></div>}
                        <div>
                            <p className="font-bold text-lg">{user.handleName}</p>
                            <p className="text-gray-500 text-sm">{user.email}</p>
                        </div>
                    </div>
                    <Link href="/mypage/edit" className="block w-full py-2 text-center border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">
                        編集する
                    </Link>
                    
                    <div className="mt-8 pt-6 border-t">
                        <h3 className="font-bold text-gray-700 mb-2">紹介コード</h3>
                        <div className="flex gap-2">
                            <input readOnly value={user.referralCode} className="flex-grow bg-gray-100 p-2 rounded text-center font-mono text-lg tracking-widest"/>
                            <button onClick={()=>{navigator.clipboard.writeText(user.referralCode); toast.success('コピーしました')}} className="px-4 bg-sky-500 text-white rounded font-bold hover:bg-sky-600">コピー</button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">友達が登録時にこのコードを入力すると、お互いにポイントゲット！</p>
                    </div>

                    <div className="mt-8 pt-6 border-t text-center">
                        <button onClick={logout} className="text-red-500 text-sm hover:underline">ログアウト</button>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

// --- サブコンポーネント: 企画カード ---
function ProjectCard({ project, isOwner }) {
    const progress = Math.min((project.collectedAmount / project.targetAmount) * 100, 100);
    
    // 次のアクションを提案するロジック
    let nextAction = null;
    if (isOwner) {
        if (project.status === 'PENDING_APPROVAL') nextAction = { text: '審査待ちです', color: 'text-yellow-600' };
        else if (project.status === 'FUNDRAISING' && !project.offer) nextAction = { text: 'お花屋さんを探しましょう', link: `/florists?projectId=${project.id}`, linkText: '探す' };
        else if (project.offer?.status === 'PENDING') nextAction = { text: 'お花屋さんの返信待ち', color: 'text-gray-500' };
        else if (project.offer?.status === 'ACCEPTED' && !project.quotation) nextAction = { text: 'チャットで見積もり相談', link: `/chat/${project.offer.chatRoom?.id}`, linkText: 'チャットへ' };
        else if (project.status === 'SUCCESSFUL') nextAction = { text: '完了報告の準備', link: `/projects/${project.id}`, linkText: '詳細へ' };
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all flex flex-col sm:flex-row">
            {/* サムネイル */}
            <div className="w-full sm:w-48 h-32 sm:h-auto bg-gray-200 relative shrink-0">
                {project.imageUrl ? (
                    <img src={project.imageUrl} className="w-full h-full object-cover"/>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                )}
                <div className="absolute top-2 left-2">
                    {getStatusBadge(project.status)}
                </div>
            </div>
            
            {/* 内容 */}
            <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">
                        <Link href={`/projects/${project.id}`} className="hover:text-sky-600 transition-colors">
                            {project.title}
                        </Link>
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">納品: {new Date(project.deliveryDateTime).toLocaleDateString()}</p>
                    
                    {/* 進捗バー */}
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                        <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs mb-3">
                        <span className="font-bold text-sky-600">{progress.toFixed(0)}%</span>
                        <span className="text-gray-400">{project.collectedAmount.toLocaleString()} / {project.targetAmount.toLocaleString()} pt</span>
                    </div>
                </div>

                {/* アクションエリア */}
                <div className="flex items-center justify-between border-t pt-3 mt-1">
                    {nextAction ? (
                        <div className="text-xs font-bold flex items-center gap-2">
                            <span className={nextAction.color || 'text-indigo-600'}>
                                {nextAction.color ? <FiAlertCircle className="inline mr-1"/> : <FiCheckCircle className="inline mr-1"/>}
                                {nextAction.text}
                            </span>
                            {nextAction.link && (
                                <Link href={nextAction.link} className="bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 transition-colors">
                                    {nextAction.linkText}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400">進行中</span>
                    )}
                    
                    {/* チャットへのショートカット */}
                    {project.offer?.chatRoom && (
                        <Link href={`/chat/${project.offer.chatRoom.id}`} className="text-gray-400 hover:text-sky-500 transition-colors" title="チャットへ">
                            <FiMessageSquare size={18}/>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}