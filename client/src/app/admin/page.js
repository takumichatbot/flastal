'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const AdminLineChart = dynamic(
    () => import('./AdminCharts').then(m => ({ default: m.AdminLineChart })),
    { ssr: false, loading: () => <div className="h-full bg-slate-100 animate-pulse rounded-xl" /> }
);
const AdminBarChart = dynamic(
    () => import('./AdminCharts').then(m => ({ default: m.AdminBarChart })),
    { ssr: false, loading: () => <div className="h-full bg-slate-100 animate-pulse rounded-xl" /> }
);

import {
    MessageSquare, AlertTriangle, RefreshCw, DollarSign,
    Award, MapPin, Calendar, Clock, Settings, Edit3,
    Mail, Activity, TrendingUp, UserCheck, CheckCircle2, LogOut, ArrowRight, Palette,
    Flower2, Building2, ShieldCheck, FileText, Users, Send, LayoutGrid, Image as ImageIcon,
    RotateCcw, XCircle, Database
} from 'lucide-react';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]", className)}>
    {children}
  </div>
);

export default function AdminPage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  const [commissions, setCommissions] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const [chatReportCount, setChatReportCount] = useState(0);
  const [pendingCounts, setPendingCounts] = useState({
      florists: 0, illustrators: 0, venues: 0, organizers: 0, projects: 0,
  });

  // 追加KPI
  const [newUsersThisWeek, setNewUsersThisWeek] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(null);
  const [activeProjectCount, setActiveProjectCount] = useState(null);

  const fetchAdminData = useCallback(async () => { 
    setLoadingData(true);
    try {
      const token = window.__flastalToken || ''|window.__flastalToken;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // ★ Promise.allSettled に変更し、1つのエラーで全体が止まらないようにする
      const endpoints = [
          fetch(`${API_URL}/api/admin/commissions`, { headers }),
          fetch(`${API_URL}/api/admin/chat-reports`, { headers }),
          fetch(`${API_URL}/api/admin/florists/pending`, { headers }),
          fetch(`${API_URL}/api/admin/illustrators/pending`, { headers }),
          fetch(`${API_URL}/api/admin/venues/pending`, { headers }),
          fetch(`${API_URL}/api/admin/organizers/pending`, { headers }),
          fetch(`${API_URL}/api/admin/projects/pending`, { headers }),
          fetch(`${API_URL}/api/admin/projects`, { headers }),
          fetch(`${API_URL}/api/admin/analytics`, { headers }),
      ];

      const results = await Promise.allSettled(endpoints);

      const parseJsonSafe = async (result, name) => {
          if (result.status === 'fulfilled' && result.value.ok) {
              try { return await result.value.json(); }
              catch(e) { console.warn(`JSONパース失敗: ${name}`); return null; }
          }
          if (result.status === 'rejected') {
              console.error(`API通信エラー (${name}):`, result.reason);
          }
          return null;
      };

      const commissionData = await parseJsonSafe(results[0], 'commissions');
      const reportData = await parseJsonSafe(results[1], 'chat-reports');
      const florists = await parseJsonSafe(results[2], 'florists');
      const illustrators = await parseJsonSafe(results[3], 'illustrators');
      const venues = await parseJsonSafe(results[4], 'venues');
      const organizers = await parseJsonSafe(results[5], 'organizers');
      const pendingProjects = await parseJsonSafe(results[6], 'pending-projects');
      const allProjects = await parseJsonSafe(results[7], 'all-projects');
      const analyticsData = await parseJsonSafe(results[8], 'analytics');

      setCommissions(Array.isArray(commissionData) ? commissionData : []);
      setChatReportCount(Array.isArray(reportData) ? reportData.length : 0);
      if (analyticsData) {
        setAnalytics(analyticsData);
        // 追加KPI: analyticsデータから取得できる場合は優先して使用
        if (analyticsData.newUsersThisWeek !== undefined) setNewUsersThisWeek(analyticsData.newUsersThisWeek);
        if (analyticsData.monthlyRevenue !== undefined) setMonthlyRevenue(analyticsData.monthlyRevenue);
        if (analyticsData.activeProjects !== undefined) setActiveProjectCount(analyticsData.activeProjects);
      }

      if (Array.isArray(allProjects)) {
          const sorted = [...allProjects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
          setRecentProjects(sorted);
      }

      setPendingCounts({
          florists: Array.isArray(florists) ? florists.length : 0,
          illustrators: Array.isArray(illustrators) ? illustrators.length : 0,
          venues: Array.isArray(venues) ? venues.length : 0,
          organizers: Array.isArray(organizers) ? organizers.length : 0,
          projects: Array.isArray(pendingProjects) ? pendingProjects.length : 0,
      });

    } catch (error) {
      console.error('Fatal fetch error:', error);
      toast.error('データ更新中に一部エラーが発生しました（詳細はコンソールを確認）');
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

  const salesChart = analytics?.salesChart || [];
  const supportersChart = analytics?.supportersChart || [];

  if (loading || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-3xl text-sky-500"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-800 pb-24">

      <div className="max-w-7xl mx-auto space-y-8 pt-4">
        
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

        {/* --- 追加KPIカード (ユーザー統計) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard
                label="新規登録数（今週）"
                value={newUsersThisWeek !== null ? `${newUsersThisWeek}人` : (analytics?.totals?.users !== undefined ? `${analytics.totals.users}人` : '—')}
                subValue={newUsersThisWeek !== null ? "直近7日間の新規ユーザー" : "累計ユーザー数"}
                icon={<Users size={24}/>}
                color="indigo"
            />
            <KpiCard
                label="今月の売上"
                value={monthlyRevenue !== null ? `¥${Number(monthlyRevenue).toLocaleString()}` : (analytics?.totals?.pledgeAmount !== undefined ? `¥${Number(analytics.totals.pledgeAmount).toLocaleString()}` : '—')}
                subValue={monthlyRevenue !== null ? "今月の総支援金額" : "累計総支援金額"}
                icon={<TrendingUp size={24}/>}
                color="emerald"
            />
            <KpiCard
                label="アクティブ企画数"
                value={activeProjectCount !== null ? `${activeProjectCount}件` : (analytics?.totals?.projects !== undefined ? `${analytics.totals.projects}件` : '—')}
                subValue={activeProjectCount !== null ? "募集中（FUNDRAISING）" : "累計企画数"}
                icon={<Activity size={24}/>}
                color="pink"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- 左カラム (メイン) --- */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 🌟 1. 最近作成された企画パネル（追加） */}
                <GlassCard className="!p-8">
                    <h2 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2">
                        <LayoutGrid className="text-indigo-500"/> 最近作成された企画
                    </h2>
                    <div className="divide-y divide-slate-100">
                        {recentProjects.length === 0 ? (
                            <p className="py-12 text-center text-slate-400 font-bold">データがありません</p>
                        ) : (
                            recentProjects.map((p) => (
                                <div key={p.id} className="py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors px-4 rounded-2xl group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shadow-sm">
                                            <Award size={20}/>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 truncate max-w-[200px] group-hover:text-indigo-600 transition-colors">
                                                {p.title || 'タイトル未設定'}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">
                                                作成日: {new Date(p.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/admin/projects`} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-600 rounded-lg text-[10px] font-black transition-all shadow-sm">
                                            編集 / 削除
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                        <Link href="/admin/projects" className="text-xs text-indigo-600 font-black hover:text-indigo-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-1">
                            すべての企画を管理する (編集・削除) <ArrowRight size={14}/>
                        </Link>
                    </div>
                </GlassCard>

                {/* 2. 最近の収益発生 */}
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

                {/* 3. 売上推移グラフ */}
                <GlassCard className="!p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-black text-xl text-slate-800 flex items-center gap-2"><TrendingUp className="text-sky-500"/> 支援金額推移 <span className="text-sm text-slate-400 font-bold">(過去6ヶ月)</span></h2>
                        <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">Monthly</span>
                    </div>
                    {analytics?.totals && (
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-sky-50 rounded-2xl p-3 text-center">
                                <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">総支援額</p>
                                <p className="text-base font-black text-sky-700">¥{(analytics.totals.pledgeAmount || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">企画数</p>
                                <p className="text-base font-black text-emerald-700">{analytics.totals.projects}件</p>
                            </div>
                            <div className="bg-pink-50 rounded-2xl p-3 text-center">
                                <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">ユーザー数</p>
                                <p className="text-base font-black text-pink-700">{analytics.totals.users}人</p>
                            </div>
                        </div>
                    )}
                    {/* 支援金額 折れ線グラフ */}
                    <div className="h-52">
                        {salesChart.length > 0 ? (
                            <AdminLineChart data={salesChart} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 text-xs font-black">データを読み込み中...</div>
                        )}
                    </div>

                    {/* 支援者数 棒グラフ */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-black text-slate-400 mb-3 flex items-center gap-2"><Users size={13}/> 月別ユニーク支援者数</p>
                        <div className="h-32">
                            {supportersChart.length > 0 ? (
                                <AdminBarChart data={supportersChart} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-black">データなし</div>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* --- 右カラム (サイドバー) --- */}
            <div className="space-y-8">
                
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

                <GlassCard className="!p-8">
                    <h3 className="font-black text-slate-800 mb-6 text-xs uppercase tracking-widest text-slate-400">Control Menu</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <QuickLink href="/admin/projects" icon={<LayoutGrid/>} label="全企画一覧・情報編集・削除" />
                        <QuickLink href="/admin/events" icon={<Calendar/>} label="全イベント一覧・編集・削除" />
                        <QuickLink href="/admin/budget-references" icon={<ImageIcon/>} label="予算別カタログ画像の設定" />
                        <div className="my-3 border-t border-slate-100/50"></div>
                        <QuickLink href="/admin/approval?tab=projects" icon={<Award/>} label="プロジェクト審査" />
                        <QuickLink href="/admin/approval?tab=florists" icon={<Flower2/>} label="花屋審査管理" />
                        <QuickLink href="/admin/approval?tab=illustrators" icon={<Palette/>} label="絵師審査管理" />
                        <QuickLink href="/admin/approval?tab=venues" icon={<Building2/>} label="会場審査管理" />
                        <QuickLink href="/admin/approval?tab=organizers" icon={<ShieldCheck/>} label="主催者審査管理" />
                        <div className="my-3 border-t border-slate-100/50"></div>
                        <QuickLink href="/admin/users" icon={<Users/>} label="全ユーザー一覧・情報管理" />
                        <QuickLink href="/admin/contact" icon={<MessageSquare/>} label="個別チャット連絡" />
                        <QuickLink href="/admin/payouts" icon={<DollarSign/>} label="出金申請の管理" />
                        <QuickLink href="/admin/kyc" icon={<UserCheck/>} label="KYC 本人確認審査" />
                        <QuickLink href="/admin/fraud-flags" icon={<AlertTriangle/>} label="不正フラグ対応" />
                        <QuickLink href="/admin/florists" icon={<Edit3/>} label="花屋手数料設定" />
                        <QuickLink href="/admin/email-templates" icon={<Mail/>} label="メールテンプレート設定" />
                        <QuickLink href="/admin/settings" icon={<Settings/>} label="システム全体設定" />
                    </div>
                </GlassCard>

                {/* CSVエクスポート */}
                <GlassCard className="!p-6">
                    <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm"><FileText size={16} className="text-sky-500"/> データエクスポート</h3>
                    <div className="space-y-2">
                        {[
                            { label: '支援一覧 CSV', type: 'pledges' },
                            { label: '手数料一覧 CSV', type: 'commissions' },
                        ].map(({ label, type }) => (
                            <a
                                key={type}
                                href={`${API_URL}/api/admin/export/csv?type=${type}`}
                                onClick={e => {
                                    e.preventDefault();
                                    const token = window.__flastalToken || ''|window.__flastalToken;
                                    fetch(`${API_URL}/api/admin/export/csv?type=${type}`, { headers: { Authorization: `Bearer ${token}` } })
                                        .then(r => r.blob())
                                        .then(blob => {
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url; a.download = `${type}.csv`; a.click();
                                            URL.revokeObjectURL(url);
                                        })
                                        .catch(() => toast.error('CSVダウンロードに失敗しました'));
                                }}
                                className="flex items-center gap-2 w-full px-4 py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-2xl text-xs font-black transition-all border border-sky-100 cursor-pointer"
                            >
                                <FileText size={14}/> {label}
                            </a>
                        ))}
                    </div>
                </GlassCard>

                {/* 一斉メール */}
                <BulkEmailCard apiUrl={API_URL} />

                {/* WebhookLogビューア */}
                <WebhookLogViewer apiUrl={API_URL} />
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
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        pink: 'bg-pink-50 text-pink-600 border-pink-100',
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
function BulkEmailCard({ apiUrl }) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [targetRole, setTargetRole] = useState('ALL');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) return toast.error('件名と本文を入力してください');
        if (!confirm(`${targetRole === 'ALL' ? '全ユーザー・全花屋' : targetRole === 'USER' ? '全ユーザー' : '全花屋'}に送信します。よろしいですか？`)) return;
        setSending(true);
        try {
            const token = window.__flastalToken || ''|window.__flastalToken;
            const res = await fetch(`${apiUrl}/api/admin/bulk-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ subject, body, targetRole: targetRole === 'ALL' ? undefined : targetRole }),
            });
            const data = await res.json();
            if (res.ok) { toast.success(data.message); setSubject(''); setBody(''); }
            else toast.error(data.message || '送信失敗');
        } catch { toast.error('送信に失敗しました'); }
        finally { setSending(false); }
    };

    return (
        <GlassCard className="!p-6">
            <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm"><Send size={16} className="text-pink-500"/> 一斉メール送信</h3>
            <div className="space-y-3">
                <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none">
                    <option value="ALL">全員（ユーザー＋花屋）</option>
                    <option value="USER">ユーザーのみ</option>
                    <option value="FLORIST">花屋のみ</option>
                </select>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="件名"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-pink-300" />
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="本文（HTMLも使用可）"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-pink-300 resize-none" />
                <button onClick={handleSend} disabled={sending}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-pink-100">
                    {sending ? <><Activity size={14} className="animate-spin"/> 送信中...</> : <><Send size={14}/> 送信する</>}
                </button>
            </div>
        </GlassCard>
    );
}

function WebhookLogViewer({ apiUrl }) {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState('error');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const fetchLogs = async (f = filter, p = page) => {
        setLoading(true);
        try {
            const token = window.__flastalToken || ''|window.__flastalToken;
            const params = new URLSearchParams({ page: p, limit: 20 });
            if (f !== 'all') params.set('status', f);
            const res = await fetch(`${apiUrl}/api/admin/webhook-logs?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setLogs(data.logs || []);
            setTotal(data.total || 0);
        } catch { toast.error('取得に失敗しました'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [filter, page]);

    const handleRetry = async (id) => {
        try {
            const token = window.__flastalToken || ''|window.__flastalToken;
            const res = await fetch(`${apiUrl}/api/admin/webhook-logs/${id}/retry`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { toast.success('リトライ対象にセットしました'); fetchLogs(); }
            else toast.error('失敗しました');
        } catch { toast.error('エラーが発生しました'); }
    };

    return (
        <GlassCard className="!p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-700 flex items-center gap-2 text-sm">
                    <Database size={16} className="text-violet-500"/> WebhookLog
                    <span className="text-[10px] font-bold text-slate-400 ml-1">{total}件</span>
                </h3>
                <div className="flex gap-1">
                    {['error', 'success', 'all'].map(s => (
                        <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                            className={cn('px-2.5 py-1 rounded-lg text-[10px] font-black transition-all',
                                filter === s ? 'bg-violet-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
                            {s === 'error' ? '失敗' : s === 'success' ? '成功' : '全件'}
                        </button>
                    ))}
                    <button onClick={() => fetchLogs()} className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 ml-1">
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {loading && <div className="text-center py-6 text-xs text-slate-400">読み込み中...</div>}

            {!loading && logs.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">ログなし</div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto">
                {logs.map(log => (
                    <div key={log.id} className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border text-xs',
                        log.status === 'error' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'
                    )}>
                        {log.status === 'error'
                            ? <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5"/>
                            : <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5"/>}
                        <div className="flex-1 min-w-0">
                            <div className="font-black text-slate-700 truncate">{log.eventType}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{log.eventId}</div>
                            {log.error && <div className="text-[10px] text-rose-500 mt-1 truncate">{log.error}</div>}
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(log.createdAt).toLocaleString('ja-JP')}
                                {log.retryCount > 0 && <span className="ml-2 text-amber-500">retry:{log.retryCount}</span>}
                            </div>
                        </div>
                        {log.status === 'error' && log.retryCount < 3 && (
                            <button onClick={() => handleRetry(log.id)}
                                className="shrink-0 p-1.5 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200 transition-all">
                                <RotateCcw size={12}/>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {total > 20 && (
                <div className="flex justify-center gap-2 mt-3">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 text-[10px] font-black rounded-lg bg-slate-100 disabled:opacity-40">前へ</button>
                    <span className="text-[10px] text-slate-400 self-center">{page} / {Math.ceil(total / 20)}</span>
                    <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 text-[10px] font-black rounded-lg bg-slate-100 disabled:opacity-40">次へ</button>
                </div>
            )}
        </GlassCard>
    );
}
