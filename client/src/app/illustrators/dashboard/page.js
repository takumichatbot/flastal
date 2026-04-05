'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-react
import { 
  PenTool, CheckCircle2, Clock, Settings, LogOut, Loader2, Home, 
  RefreshCw, HelpCircle, FileText, Check, Inbox, ArrowRight, MessageSquare,
  XCircle, Coins, HeartHandshake, Send, User
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ふわふわ浮かぶパーティクル
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-amber-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-40"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

// ===========================================
// 審査中の画面コンポーネント (変更なし)
// ===========================================
function ApprovalPendingView({ user, logout, isChecking, handleRefresh }) {
  const router = useRouter();
  const onLogout = async () => {
    await logout();
    router.push('/illustrators/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50/50 flex flex-col items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgba(245,158,11,0.15)] overflow-hidden border border-white relative z-10"
      >
        <div className="h-3 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"></div>

        <div className="p-8 md:p-10 text-center">
          <div className="mx-auto w-24 h-24 bg-amber-50 rounded-[1.5rem] flex items-center justify-center mb-6 relative border border-white shadow-sm -rotate-3">
             <div className="absolute inset-0 rounded-[1.5rem] border-4 border-amber-100 animate-ping opacity-30"></div>
             <Clock className="w-10 h-10 text-amber-500" />
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter">審査を行っております</h2>
          <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
            ご登録ありがとうございます。<br/>
            現在、運営事務局にてポートフォリオ等の確認を行っております。<br/>
            通常<span className="font-black text-amber-600">1〜3営業日以内</span>に審査結果をメールにてお知らせいたします。
          </p>

          <div className="space-y-4">
             <button onClick={handleRefresh} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
                {isChecking ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                ステータスを再確認する
             </button>
             <div className="grid grid-cols-2 gap-4">
               <Link href="/" className="w-full py-3.5 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm">
                  <Home size={16} /> トップページ
               </Link>
               <button onClick={onLogout} className="w-full py-3.5 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm">
                  <LogOut size={16} /> ログアウト
               </button>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ===========================================
// 本来のダッシュボードコンポーネント
// ===========================================
export default function IllustratorDashboard() {
  const { user, logout, isLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({ activeOrders: 0, completedOrders: 0, salesBalance: 0 });
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('offers'); // offers, active, applications
  
  // データ状態
  const [offers, setOffers] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // データの取得
  const fetchDashboardData = useCallback(async () => {
      if (!user || user.status !== 'APPROVED') return;
      setLoadingData(true);
      try {
          // ※バックエンドのAPIを並列で叩く想定
          const [statsRes, offersRes, activeRes, appsRes] = await Promise.all([
              authenticatedFetch(`${API_URL}/api/illustrators/dashboard/stats`),
              authenticatedFetch(`${API_URL}/api/illustrators/offers?status=PENDING`),
              authenticatedFetch(`${API_URL}/api/illustrators/projects?status=ACTIVE`),
              authenticatedFetch(`${API_URL}/api/illustrators/applications`)
          ]);

          if (statsRes.ok) setStats(await statsRes.json());
          if (offersRes.ok) setOffers(await offersRes.json());
          if (activeRes.ok) setActiveProjects(await activeRes.json());
          if (appsRes.ok) setApplications(await appsRes.json());
          
      } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
      } finally {
          setLoadingData(false);
      }
  }, [user, authenticatedFetch]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ILLUSTRATOR')) {
      router.push('/illustrators/login');
    } else if (user && !isLoading) {
      fetchDashboardData();
    }
  }, [user, isLoading, router, fetchDashboardData]);

  const handleRefresh = () => {
    setIsChecking(true);
    window.location.reload();
  };

  // オファー承認・辞退処理
  const handleOfferAction = async (offerId, action) => {
      const confirmMsg = action === 'ACCEPT' ? 'この依頼を受注しますか？' : 'この依頼を辞退しますか？';
      if (!window.confirm(confirmMsg)) return;

      const toastId = toast.loading('処理中...');
      try {
          const res = await authenticatedFetch(`${API_URL}/api/illustrators/offers/${offerId}/${action.toLowerCase()}`, {
              method: 'PATCH'
          });
          if (!res.ok) throw new Error('処理に失敗しました');
          
          toast.success(action === 'ACCEPT' ? '受注しました！' : '辞退しました', { id: toastId });
          fetchDashboardData(); // データ再取得
      } catch (e) {
          toast.error(e.message, { id: toastId });
      }
  };

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-amber-50/50"><Loader2 className="animate-spin text-amber-500" size={40} /></div>;
  if (user.status !== 'APPROVED') return <ApprovalPendingView user={user} logout={logout} isChecking={isChecking} handleRefresh={handleRefresh} />;

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-800 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-2 rounded-xl text-amber-600 shadow-inner border border-white">
                <PenTool size={20} />
            </div>
            <span className="font-black text-slate-800 tracking-tight">Illustrator Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">{user.handleName || user.activityName} 様</span>
            <button onClick={() => { logout(); router.push('/illustrators/login'); }} className="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full hover:bg-rose-50 transition-colors shadow-sm border border-slate-100">
                <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter">ダッシュボード</h1>
                <p className="text-slate-500 text-sm mt-1 font-bold">案件の管理やプロフィールの編集が行えます。</p>
            </div>
            <Link href="/illustrators/profile/edit" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm text-xs flex items-center gap-2">
                <Settings size={14}/> プロフィールを編集
            </Link>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
                <div className="bg-sky-50 text-sky-500 p-4 rounded-[1.5rem] shadow-inner"><Clock size={28}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">進行中の案件</p>
                    <p className="text-3xl font-black text-slate-800">{stats.activeOrders || activeProjects.length} <span className="text-sm font-bold text-slate-400">件</span></p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
                <div className="bg-emerald-50 text-emerald-500 p-4 rounded-[1.5rem] shadow-inner"><CheckCircle2 size={28}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">納品完了</p>
                    <p className="text-3xl font-black text-slate-800">{stats.completedOrders || 0} <span className="text-sm font-bold text-slate-400">件</span></p>
                </div>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] shadow-xl text-white flex items-center gap-5 border-4 border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
                <div className="bg-white/10 text-amber-400 p-4 rounded-[1.5rem] shadow-inner border border-white/10 relative z-10"><Coins size={28}/></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">売上残高</p>
                    <p className="text-3xl font-black font-mono">{(user.points || 0).toLocaleString()} <span className="text-sm font-bold text-slate-400">pt</span></p>
                </div>
            </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-4 pb-4 mb-6">
            <button onClick={() => setActiveTab('offers')} className={cn("px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all shadow-sm border", activeTab === 'offers' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-white hover:border-amber-200")}>
                <Inbox size={16}/> 届いたオファー {offers.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{offers.length}</span>}
            </button>
            <button onClick={() => setActiveTab('active')} className={cn("px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all shadow-sm border", activeTab === 'active' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-white hover:border-amber-200")}>
                <PenTool size={16}/> 進行中の案件
            </button>
            <button onClick={() => setActiveTab('applications')} className={cn("px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all shadow-sm border", activeTab === 'applications' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-white hover:border-amber-200")}>
                <Send size={16}/> 応募履歴
            </button>
        </div>

        {/* --- TAB CONTENT --- */}
        <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                
                {loadingData ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
                ) : (
                    <>
                        {/* 1. 届いたオファー */}
                        {activeTab === 'offers' && (
                            offers.length > 0 ? (
                                <div className="space-y-4">
                                    {offers.map(offer => (
                                        <div key={offer.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">指名依頼</span>
                                                    <span className="text-xs font-bold text-slate-400">{new Date(offer.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 mb-2">{offer.project?.title || '企画名未定'}</h3>
                                                <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5 mb-4"><User size={14}/> 企画者: {offer.project?.planner?.handleName || '不明'}</p>
                                                
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MessageSquare size={12}/> メッセージ</p>
                                                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{offer.message}</p>
                                                </div>
                                            </div>
                                            <div className="w-full md:w-64 bg-amber-50/50 p-6 rounded-3xl border border-amber-100 flex flex-col justify-center shrink-0 text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">提示金額 (報酬)</p>
                                                <p className="text-3xl font-black text-amber-500 font-mono mb-4">{offer.amount?.toLocaleString()} <span className="text-sm font-bold text-amber-600/60">pt</span></p>
                                                <div className="space-y-2">
                                                    <button onClick={() => handleOfferAction(offer.id, 'ACCEPT')} className="w-full py-3 bg-amber-500 text-white font-black rounded-xl shadow-md hover:bg-amber-600 transition-colors">承認して受注する</button>
                                                    <button onClick={() => handleOfferAction(offer.id, 'REJECT')} className="w-full py-3 bg-white text-slate-400 font-black rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-rose-500 transition-colors">今回は辞退する</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-16 md:p-24 text-center border-2 border-dashed border-slate-200 shadow-sm">
                                    <Inbox size={48} className="mx-auto text-slate-200 mb-4"/>
                                    <h3 className="text-xl font-black text-slate-700 mb-2">現在、届いているオファーはありません</h3>
                                    <p className="text-slate-500 text-sm font-bold">プロフィールを充実させて、企画者からの依頼を待ちましょう！</p>
                                </div>
                            )
                        )}

                        {/* 2. 進行中の案件 */}
                        {activeTab === 'active' && (
                            activeProjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {activeProjects.map(project => (
                                        <div key={project.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="bg-sky-50 text-sky-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-100">進行中</span>
                                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> 納期: {new Date(project.deliveryDateTime).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-amber-500 transition-colors line-clamp-2">{project.title}</h3>
                                            <div className="flex items-center justify-between mt-6">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">報酬予定: <span className="text-sm font-black text-slate-700">{project.illustratorReward?.toLocaleString()} pt</span></p>
                                                <Link href={`/projects/${project.id}?tab=collaboration`} className="px-5 py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm">
                                                    チャットを開く <ArrowRight size={14}/>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-16 md:p-24 text-center border-2 border-dashed border-slate-200 shadow-sm">
                                    <PenTool size={48} className="mx-auto text-slate-200 mb-4"/>
                                    <h3 className="text-xl font-black text-slate-700 mb-2">進行中の案件はありません</h3>
                                </div>
                            )
                        )}

                        {/* 3. 応募履歴 */}
                        {activeTab === 'applications' && (
                            applications.length > 0 ? (
                                <div className="space-y-4">
                                    {applications.map(app => (
                                        <div key={app.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest", app.status === 'PENDING' ? 'bg-slate-100 text-slate-500' : app.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500')}>
                                                        {app.status === 'PENDING' ? '結果待ち' : app.status === 'ACCEPTED' ? '採用 🎉' : '見送り'}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-base font-black text-slate-800">{app.event?.title || '募集名不明'}</h3>
                                                <p className="text-xs text-slate-500 font-bold mt-1">希望額: {app.proposedAmount?.toLocaleString()} pt</p>
                                            </div>
                                            {app.status === 'ACCEPTED' && app.project && (
                                                <Link href={`/projects/${app.project.id}?tab=collaboration`} className="px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
                                                    案件へ進む
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-16 md:p-24 text-center border-2 border-dashed border-slate-200 shadow-sm">
                                    <Send size={48} className="mx-auto text-slate-200 mb-4"/>
                                    <h3 className="text-xl font-black text-slate-700 mb-2">応募履歴はありません</h3>
                                    <Link href="/illustrators/recruitment" className="inline-block mt-4 text-sm font-black text-amber-500 hover:underline">公募掲示板を見る</Link>
                                </div>
                            )
                        )}
                    </>
                )}
            </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}