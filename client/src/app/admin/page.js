'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

import { 
    MessageSquare, AlertTriangle, RefreshCw, DollarSign, 
    Award, MapPin, Calendar, Clock, Settings, Edit3, 
    Mail, Activity, TrendingUp, UserCheck, CheckCircle2, LogOut, ArrowRight, Palette,
    Flower2, Building2, ShieldCheck, FileText
} from 'lucide-react'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(15)].map((_, i) => (
        <motion.div key={i} className="absolute w-2 h-2 bg-sky-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]", className)}>
    {children}
  </div>
);

export default function AdminPage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  const [commissions, setCommissions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [chatReportCount, setChatReportCount] = useState(0); 
  const [pendingCounts, setPendingCounts] = useState({
      florists: 0, illustrators: 0, venues: 0, organizers: 0, projects: 0,
  });

  const fetchAdminData = useCallback(async () => { 
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [commissionsRes, reportsRes, floristRes, illustratorRes, venueRes, organizerRes, projectRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/commissions`, { headers }),
          fetch(`${API_URL}/api/admin/chat-reports`, { headers }),
          fetch(`${API_URL}/api/admin/florists/pending`, { headers }), 
          fetch(`${API_URL}/api/admin/illustrators/pending`, { headers }), 
          fetch(`${API_URL}/api/admin/venues/pending`, { headers }), 
          fetch(`${API_URL}/api/admin/organizers/pending`, { headers }), 
          fetch(`${API_URL}/api/admin/projects/pending`, { headers }),
      ]);
      
      const commissionData = commissionsRes.ok ? await commissionsRes.json() : [];
      const reportData = reportsRes.ok ? await reportsRes.json() : []; 
      const florists = floristRes.ok ? await floristRes.json() : [];
      const illustrators = illustratorRes.ok ? await illustratorRes.json() : [];
      const venues = venueRes.ok ? await venueRes.json() : [];
      const organizers = organizerRes.ok ? await organizerRes.json() : [];
      const projects = projectRes.ok ? await projectRes.json() : [];

      setCommissions(Array.isArray(commissionData) ? commissionData : []);
      setChatReportCount(Array.isArray(reportData) ? reportData.length : 0); 
      
      setPendingCounts({
          florists: Array.isArray(florists) ? florists.length : 0,
          illustrators: Array.isArray(illustrators) ? illustrators.length : 0,
          venues: Array.isArray(venues) ? venues.length : 0,
          organizers: Array.isArray(organizers) ? organizers.length : 0,
          projects: Array.isArray(projects) ? projects.length : 0,
      });

    } catch (error) {
      toast.error('データ更新中に一部エラーが発生しました');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      toast.error('管理者権限がありません');
      router.push('/login');
      return;
    }
    fetchAdminData();
  }, [isAuthenticated, user, router, loading, fetchAdminData]);

  const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPendingAccounts = pendingCounts.florists + pendingCounts.illustrators + pendingCounts.venues + pendingCounts.organizers;
  
  const recentCommissions = useMemo(() => {
      return [...commissions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [commissions]);

  const chartData = [35, 45, 30, 60, 75, 90]; 

  if (loading || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-3xl text-sky-500"/></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50/30 p-4 sm:p-8 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10 pt-4">
        
        {/* --- ヘッダー --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 bg-white/60 backdrop-blur-md p-4 rounded-full border border-white shadow-sm">
            <div className="flex items-center gap-4 px-4">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">FL</div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tighter">
                        管理者ダッシュボード
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Platform Admin Console</p>
                </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={fetchAdminData} disabled={loadingData} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                    <RefreshCw size={14} className={loadingData ? "animate-spin" : ""}/> 更新
                </button>
                <button onClick={() => { logout(); router.push('/login'); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-black hover:bg-slate-800 transition-colors shadow-md">
                    <LogOut size={14}/> ログアウト
                </button>
            </div>
        </div>

        {/* --- KPIカード (Grid) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard label="総手数料収益" value={`¥${totalCommission.toLocaleString()}`} subValue="累計システム手数料" icon={<DollarSign size={24}/>} color="sky" />
            <KpiCard label="取引成立数" value={`${commissions.length}件`} subValue="累計トランザクション" icon={<CheckCircle2 size={24}/>} color="emerald" />
            <KpiCard label="審査待ちアカウント" value={`${totalPendingAccounts}件`} subValue="早急な対応が必要です" icon={<UserCheck size={24}/>} color="amber" isAlert={totalPendingAccounts > 0} />
            <KpiCard label="未処理の通報" value={`${chatReportCount}件`} subValue="チャット・企画の違反報告" icon={<AlertTriangle size={24}/>} color="rose" isAlert={chatReportCount > 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- 左カラム (メイン) --- */}
            <div className="lg:col-span-2 space-y-8">
                <GlassCard className="!p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="font-black text-xl text-slate-800 flex items-center gap-2"><TrendingUp className="text-sky-500"/> 売上推移 <span className="text-sm text-slate-400 font-bold">(過去6ヶ月)</span></h2>
                        <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">Monthly</span>
                    </div>
                    <div className="h-56 flex items-end justify-between gap-4 px-2">
                        {chartData.map((height, idx) => (
                            <div key={idx} className="w-full flex flex-col justify-end group cursor-pointer h-full">
                                <div className="relative w-full bg-gradient-to-t from-sky-100 to-sky-200 rounded-t-xl hover:from-sky-200 hover:to-sky-300 transition-all duration-500 shadow-inner" style={{ height: `${height}%` }}>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                        ¥{(height * 10000).toLocaleString()}
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-center text-slate-400 mt-3">{idx + 1}月</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard className="!p-8">
                    <h2 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2"><DollarSign className="text-emerald-500"/> 最近の収益発生</h2>
                    <div className="divide-y divide-slate-100">
                        {recentCommissions.length === 0 ? (
                            <p className="py-12 text-center text-slate-400 font-bold">データがありません</p>
                        ) : (
                            recentCommissions.map((c) => (
                                <div key={c.id} className="py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors px-4 rounded-2xl group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-[10px] shadow-sm">PAY</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 truncate max-w-[200px] group-hover:text-emerald-600 transition-colors">{c.project?.title || '不明なプロジェクト'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-black text-emerald-600">+{c.amount?.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">pt</span></p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Fee</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                        <Link href="/admin/payouts" className="text-xs text-sky-600 font-black hover:text-sky-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-1">
                            すべての履歴を見る <ArrowRight size={14}/>
                        </Link>
                    </div>
                </GlassCard>
            </div>

            {/* --- 右カラム (サイドバー) --- */}
            <div className="space-y-8">
                
                {/* 統合審査センターへのリンクに変更 */}
                <GlassCard className="!p-8 !border-amber-200">
                    <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Activity className="text-amber-500"/> 要対応アクション</h3>
                    <div className="space-y-3">
                        <TodoItem label="花屋 審査待ち" count={pendingCounts.florists} href="/admin/approval?tab=florists" color="amber" />
                        <TodoItem label="絵師 審査待ち" count={pendingCounts.illustrators} href="/admin/approval?tab=illustrators" color="purple" />
                        <TodoItem label="プロジェクト審査待ち" count={pendingCounts.projects} href="/admin/approval?tab=projects" color="sky" />
                        <TodoItem label="未処理の通報" count={chatReportCount} href="/admin/reports" color="rose" />
                    </div>
                    {totalPendingAccounts === 0 && pendingCounts.projects === 0 && chatReportCount === 0 && (
                        <div className="mt-6 text-center text-xs font-black text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                            現在、緊急のタスクはありません 🎉
                        </div>
                    )}
                </GlassCard>

                {/* クイックリンク集も統合審査センターへのリンクに更新 */}
                <GlassCard className="!p-8">
                    <h3 className="font-black text-slate-800 mb-6 text-xs uppercase tracking-widest text-slate-400">Control Menu</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <QuickLink href="/admin/approval?tab=projects" icon={<Award/>} label="プロジェクト審査" />
                        <QuickLink href="/admin/approval?tab=florists" icon={<Flower2/>} label="花屋審査管理" />
                        <QuickLink href="/admin/approval?tab=illustrators" icon={<Palette/>} label="絵師審査管理" />
                        <QuickLink href="/admin/approval?tab=venues" icon={<Building2/>} label="会場審査管理" />
                        <QuickLink href="/admin/approval?tab=organizers" icon={<ShieldCheck/>} label="主催者審査管理" />
                        <div className="my-3 border-t border-slate-100/50"></div>
                        <QuickLink href="/admin/contact" icon={<Mail/>} label="個別チャット連絡" />
                        <QuickLink href="/admin/payouts" icon={<DollarSign/>} label="出金申請の管理" />
                        <QuickLink href="/admin/florists" icon={<Edit3/>} label="花屋手数料設定" />
                        <QuickLink href="/admin/settings" icon={<Settings/>} label="システム全体設定" />
                    </div>
                </GlassCard>

            </div>
        </div>
      </div>
    </div>
  );
}

// --- サブコンポーネント ---
function KpiCard({ label, value, subValue, icon, color, isAlert }) {
    const colors = {
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return (
        <GlassCard className={cn("!p-6 flex items-start justify-between hover:-translate-y-1 transition-transform", isAlert ? 'ring-4 ring-rose-100 border-rose-200' : '')}>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{value}</h3>
                <p className={cn("text-[10px] mt-2 font-bold", isAlert ? 'text-rose-500' : 'text-slate-400')}>{subValue}</p>
            </div>
            <div className={cn("p-4 rounded-[1.25rem] shadow-inner border", colors[color])}>
                {icon}
            </div>
        </GlassCard>
    );
}

function TodoItem({ label, count, href, color }) {
    if (count === 0) return null;
    const colors = { amber: 'bg-amber-100 text-amber-700', rose: 'bg-rose-100 text-rose-700', sky: 'bg-sky-100 text-sky-700', purple: 'bg-purple-100 text-purple-700' };
    return (
        <Link href={href} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-white hover:border-slate-300 transition-all group shadow-sm">
            <span className="text-xs font-black text-slate-600 group-hover:text-slate-900">{label}</span>
            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black shadow-sm", colors[color])}>{count}件</span>
        </Link>
    );
}

function QuickLink({ href, icon, label }) {
    return (
        <Link href={href} className="flex items-center gap-3 p-3 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-all font-bold text-sm border border-transparent hover:border-slate-100">
            <span className="text-lg opacity-60">{icon}</span> {label}
        </Link>
    );
}