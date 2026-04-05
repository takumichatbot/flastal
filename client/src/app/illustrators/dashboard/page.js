'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// lucide-reactに統一
import { PenTool, CheckCircle2, Clock, Settings, LogOut, Loader2, Home, RefreshCw, HelpCircle, FileText, Check } from 'lucide-react';

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
// 審査中の画面コンポーネント
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

          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter">
            審査を行っております
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
            ご登録ありがとうございます。<br/>
            現在、運営事務局にてポートフォリオ等の確認を行っております。<br/>
            通常<span className="font-black text-amber-600">1〜3営業日以内</span>に審査結果をメールにてお知らせいたします。
          </p>

          <div className="flex items-center justify-between mb-10 px-2 relative">
             <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
             <div className="flex flex-col items-center gap-2 bg-transparent px-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm shadow-sm border-2 border-white"><Check size={16}/></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">申請完了</span>
             </div>
             <div className="flex flex-col items-center gap-2 bg-transparent px-2">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-lg shadow-lg ring-4 ring-amber-100 border-2 border-white">
                   <Clock size={20} className="animate-pulse" />
                </div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">審査中</span>
             </div>
             <div className="flex flex-col items-center gap-2 bg-transparent px-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-sm border-2 border-white"><FileText size={16} /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">利用開始</span>
             </div>
          </div>

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
        <div className="bg-slate-50/50 px-8 py-5 text-center border-t border-slate-100">
           <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5">
              <HelpCircle size={14}/> 審査についてご不明な点は <Link href="/contact" className="text-amber-500 hover:text-amber-600 transition-colors">お問い合わせ</Link> ください
           </p>
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
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedOrders: 0,
    salesBalance: 0
  });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ILLUSTRATOR')) {
      router.push('/illustrators/login');
    }
  }, [user, isLoading, router]);

  // データの取得
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.status !== 'APPROVED') return; // 承認されていない場合は取得しない
      try {
        const res = await authenticatedFetch(`${API_URL}/api/illustrators/dashboard`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    if (user && !isLoading) {
      fetchDashboardData();
    }
  }, [user, isLoading, authenticatedFetch]);

  const handleRefresh = () => {
    setIsChecking(true);
    window.location.reload();
  };

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-amber-50/50"><Loader2 className="animate-spin text-amber-500" size={40} /></div>;

  // ★ 追加: 審査中の場合、ダッシュボードの中身は見せず専用の画面を返す
  if (user.status !== 'APPROVED') {
    return <ApprovalPendingView user={user} logout={logout} isChecking={isChecking} handleRefresh={handleRefresh} />;
  }

  // 承認済みの場合に表示されるダッシュボード
  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-800">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter">ダッシュボード</h1>
            <p className="text-slate-500 text-sm mt-1 font-bold">案件の管理やプロフィールの編集が行えます。</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="bg-sky-50 text-sky-500 p-4 rounded-[1.5rem] shadow-inner"><Clock size={28}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">依頼受付中</p>
                    <p className="text-3xl font-black text-slate-800">{stats.activeOrders || 0} <span className="text-sm font-bold text-slate-400">件</span></p>
                </div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="bg-emerald-50 text-emerald-500 p-4 rounded-[1.5rem] shadow-inner"><CheckCircle2 size={28}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">納品完了</p>
                    <p className="text-3xl font-black text-slate-800">{stats.completedOrders || 0} <span className="text-sm font-bold text-slate-400">件</span></p>
                </div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="bg-purple-50 text-purple-500 p-4 rounded-[1.5rem] shadow-inner"><Settings size={28}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">売上残高</p>
                    <p className="text-3xl font-black text-slate-800 font-mono">¥{(stats.salesBalance || 0).toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-12 md:p-20 text-center border-2 border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                <PenTool size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">まだ案件がありません</h3>
            <p className="text-slate-500 text-sm mb-8 font-bold">プロフィールを充実させて、依頼を待ちましょう！🎨</p>
            <button className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-8 py-4 rounded-full font-black shadow-lg shadow-amber-200 hover:scale-105 transition-transform">
                プロフィールを編集
            </button>
        </div>
      </main>
    </div>
  );
}