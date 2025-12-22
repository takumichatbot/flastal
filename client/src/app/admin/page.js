'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { 
    FiMessageSquare, FiAlertTriangle, FiRefreshCw, FiDollarSign, 
    FiAward, FiMapPin, FiCalendar, FiClock, FiSettings, FiEdit, 
    FiMail, FiActivity, FiTrendingUp, FiUserCheck, FiCheckCircle
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminPage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  const [commissions, setCommissions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [chatReportCount, setChatReportCount] = useState(0); 
  const [pendingCounts, setPendingCounts] = useState({
      florists: 0,
      venues: 0,
      organizers: 0,
      projects: 0, // プロジェクト審査待ちも追加
  });

  // データ取得
  const fetchAdminData = useCallback(async () => { 
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [commissionsRes, reportsRes, floristRes, venueRes, organizerRes, projectRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/commissions`, { headers }),
          fetch(`${API_URL}/api/admin/chat-reports`, { headers }),
          fetch(`${API_URL}/api/admin/florists/pending`, { headers }), 
          fetch(`${API_URL}/api/admin/venues/pending`, { headers }), 
          fetch(`${API_URL}/api/admin/organizers/pending`, { headers }), 
          fetch(`${API_URL}/api/admin/projects/pending`, { headers }), // プロジェクトも取得
      ]);
      
      const commissionData = commissionsRes.ok ? await commissionsRes.json() : [];
      const reportData = reportsRes.ok ? await reportsRes.json() : []; 
      const florists = floristRes.ok ? await floristRes.json() : [];
      const venues = venueRes.ok ? await venueRes.json() : [];
      const organizers = organizerRes.ok ? await organizerRes.json() : [];
      const projects = projectRes.ok ? await projectRes.json() : [];

      setCommissions(Array.isArray(commissionData) ? commissionData : []);
      setChatReportCount(Array.isArray(reportData) ? reportData.length : 0); 
      
      setPendingCounts({
          florists: Array.isArray(florists) ? florists.length : 0,
          venues: Array.isArray(venues) ? venues.length : 0,
          organizers: Array.isArray(organizers) ? organizers.length : 0,
          projects: Array.isArray(projects) ? projects.length : 0,
      });

    } catch (error) {
      console.error(error);
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

  // --- 集計ロジック ---
  const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPendingAccounts = pendingCounts.florists + pendingCounts.venues + pendingCounts.organizers;
  
  // 直近5件の取引
  const recentCommissions = useMemo(() => {
      return [...commissions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
  }, [commissions]);

  // 簡易グラフ用データ生成 (過去6ヶ月分のダミーデータ生成ロジック例)
  // ※実際はバックエンドで集計して返すのがベストですが、ここではフロントでモック表示します
  const chartData = [35, 45, 30, 60, 75, 90]; // 高さを%で表現

  if (loading || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center"><FiRefreshCw className="animate-spin text-3xl text-gray-400"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-slate-600">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- ヘッダー --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                    <FiActivity className="text-sky-500"/> 管理者ダッシュボード
                </h1>
                <p className="text-sm text-slate-500 mt-1">FLASTALプラットフォームの稼働状況とタスク管理</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={fetchAdminData}
                    disabled={loadingData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <FiRefreshCw className={loadingData ? "animate-spin" : ""}/> 更新
                </button>
                <button 
                    onClick={() => { logout(); router.push('/login'); }}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors shadow-sm"
                >
                    ログアウト
                </button>
            </div>
        </div>

        {/* --- KPIカード (Grid) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
                label="総手数料収益" 
                value={`¥${totalCommission.toLocaleString()}`} 
                subValue="前月比 +12.5% (mock)" 
                icon={<FiDollarSign size={24}/>} 
                color="sky"
            />
            <KpiCard 
                label="取引成立数" 
                value={`${commissions.length}件`} 
                subValue="累計トランザクション" 
                icon={<FiCheckCircle size={24}/>} 
                color="green"
            />
            <KpiCard 
                label="審査待ちアカウント" 
                value={`${totalPendingAccounts}件`} 
                subValue="早急な対応が必要です" 
                icon={<FiUserCheck size={24}/>} 
                color="orange"
                isAlert={totalPendingAccounts > 0}
            />
            <KpiCard 
                label="未処理の通報" 
                value={`${chatReportCount}件`} 
                subValue="チャット・企画の違反報告" 
                icon={<FiAlertTriangle size={24}/>} 
                color="red"
                isAlert={chatReportCount > 0}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- 左カラム (メイン): 売上推移 & 取引履歴 --- */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. 売上推移グラフ (CSS Only Chart) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <FiTrendingUp className="text-sky-500"/> 売上推移 (過去6ヶ月)
                        </h2>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Monthly</span>
                    </div>
                    
                    {/* 簡易棒グラフエリア */}
                    <div className="h-48 flex items-end justify-between gap-4 px-2">
                        {chartData.map((height, idx) => (
                            <div key={idx} className="w-full flex flex-col justify-end group cursor-pointer">
                                <div className="relative w-full bg-sky-100 rounded-t-md hover:bg-sky-200 transition-all duration-500" style={{ height: `${height}%` }}>
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        ¥{(height * 10000).toLocaleString()}
                                    </div>
                                </div>
                                <span className="text-xs text-center text-slate-400 mt-2">{idx + 1}月</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. 最近の収益履歴 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <FiDollarSign className="text-green-500"/> 最近の収益発生
                    </h2>
                    <div className="divide-y divide-slate-50">
                        {recentCommissions.length === 0 ? (
                            <p className="py-8 text-center text-slate-400">データがありません</p>
                        ) : (
                            recentCommissions.map((c) => (
                                <div key={c.id} className="py-4 flex items-center justify-between hover:bg-slate-50 transition-colors px-2 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs">
                                            PAY
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
                                                {c.project?.title || '不明なプロジェクト'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">+{c.amount?.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400">FEE</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                        <Link href="/admin/payouts" className="text-sm text-sky-600 font-bold hover:underline">
                            すべての履歴を見る &rarr;
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- 右カラム (サイドバー): アクション & リンク --- */}
            <div className="space-y-6">
                
                {/* To-Do リスト (緊急タスク) */}
                <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-orange-400">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <FiActivity className="mr-2 text-orange-500"/> 要対応アクション
                    </h3>
                    <div className="space-y-3">
                        <TodoItem 
                            label="アカウント審査待ち" 
                            count={totalPendingAccounts} 
                            href="/admin/approval" 
                            color="orange"
                        />
                        <TodoItem 
                            label="プロジェクト審査待ち" 
                            count={pendingCounts.projects} 
                            href="/admin/project-approval" 
                            color="sky"
                        />
                        <TodoItem 
                            label="未処理の通報" 
                            count={chatReportCount} 
                            href="/admin/reports" 
                            color="red"
                        />
                    </div>
                    {totalPendingAccounts === 0 && pendingCounts.projects === 0 && chatReportCount === 0 && (
                        <div className="mt-4 text-center text-xs text-green-600 bg-green-50 p-2 rounded">
                            現在、緊急のタスクはありません 🎉
                        </div>
                    )}
                </div>

                {/* クイックリンク集 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Menu</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <QuickLink href="/admin/approval" icon={<FiUserCheck/>} label="アカウント審査管理" />
                        <QuickLink href="/admin/project-approval" icon={<FiAward/>} label="プロジェクト審査" />
                        <QuickLink href="/admin/contact" icon={<FiMail/>} label="個別チャット連絡" />
                        <QuickLink href="/admin/payouts" icon={<FiDollarSign/>} label="出金申請の管理" />
                        <div className="my-2 border-t border-slate-100"></div>
                        <QuickLink href="/admin/florists" icon={<FiEdit/>} label="花屋手数料設定" />
                        <QuickLink href="/admin/venues" icon={<FiMapPin/>} label="会場DB管理" />
                        <QuickLink href="/admin/settings" icon={<FiSettings/>} label="システム全体設定" />
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}

// --- サブコンポーネント ---

// KPIカード
function KpiCard({ label, value, subValue, icon, color, isAlert }) {
    const colors = {
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        red: 'bg-red-50 text-red-600 border-red-100',
    };
    
    return (
        <div className={`p-5 rounded-2xl border bg-white shadow-sm flex items-start justify-between ${isAlert ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-2xl font-extrabold text-slate-800">{value}</h3>
                <p className={`text-xs mt-1 font-medium ${isAlert ? 'text-red-500' : 'text-slate-400'}`}>
                    {subValue}
                </p>
            </div>
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                {icon}
            </div>
        </div>
    );
}

// To-Doアイテム
function TodoItem({ label, count, href, color }) {
    if (count === 0) return null;
    
    const colors = {
        orange: 'bg-orange-100 text-orange-700',
        red: 'bg-red-100 text-red-700',
        sky: 'bg-sky-100 text-sky-700',
    };

    return (
        <Link href={href} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[color]}`}>
                {count}件
            </span>
        </Link>
    );
}

// クイックリンクボタン
function QuickLink({ href, icon, label }) {
    return (
        <Link href={href} className="flex items-center gap-3 p-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-all font-medium text-sm">
            <span className="text-lg opacity-70">{icon}</span>
            {label}
        </Link>
    );
}