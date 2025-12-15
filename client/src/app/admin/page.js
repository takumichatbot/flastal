// src/app/admin/page.js
'use client';
import { useState, useEffect, useCallback } from 'react'; // useCallback をインポート
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { FiMessageSquare, FiAlertTriangle, FiRefreshCw, FiDollarSign, FiAward, FiMapPin, FiCalendar } from 'react-icons/fi'; // 新しいアイコンを追加

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminPage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  const [commissions, setCommissions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [chatReportCount, setChatReportCount] = useState(0); 
  // ★★★ 新規追加: 審査待ちアカウントの件数 ★★★
  const [pendingCounts, setPendingCounts] = useState({
      florists: 0,
      venues: 0,
      organizers: 0,
  });

  const totalPendingAccounts = pendingCounts.florists + pendingCounts.venues + pendingCounts.organizers;

  const fetchAdminData = useCallback(async () => { 
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // データ並列取得
      const [commissionsRes, reportsRes, floristRes, venueRes, organizerRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/commissions`, { headers }),
          fetch(`${API_URL}/api/admin/chat-reports`, { headers }),
          // ★★★ 審査待ちアカウントのリストを取得 ★★★
          fetch(`${API_URL}/api/admin/florists/pending`, { headers }), 
          fetch(`${API_URL}/api/admin/venues/pending`, { headers }), 
          fetch(`${API_URL}/api/admin/organizers/pending`, { headers }), 
      ]);
      
      if (!commissionsRes.ok) throw new Error('手数料履歴の取得に失敗しました');
      
      const commissionData = await commissionsRes.json();
      const reportData = reportsRes.ok ? await reportsRes.json() : []; 
      
      const florists = floristRes.ok ? await floristRes.json() : [];
      const venues = venueRes.ok ? await venueRes.json() : [];
      const organizers = organizerRes.ok ? await organizerRes.json() : [];

      setCommissions(Array.isArray(commissionData) ? commissionData : []);
      setChatReportCount(Array.isArray(reportData) ? reportData.length : 0); 
      
      // ★★★ 審査待ち件数の更新 ★★★
      setPendingCounts({
          florists: Array.isArray(florists) ? florists.length : 0,
          venues: Array.isArray(venues) ? venues.length : 0,
          organizers: Array.isArray(organizers) ? organizers.length : 0,
      });

    } catch (error) {
      toast.error(error.message);
      setCommissions([]);
      setChatReportCount(0);
      setPendingCounts({ florists: 0, venues: 0, organizers: 0 });
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }

    if (!user || user.role !== 'ADMIN') {
      toast.error('管理者権限がありません。');
      router.push('/mypage');
      return;
    }

    fetchAdminData();

  }, [isAuthenticated, user, router, loading, fetchAdminData]);

  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-700">管理者権限を確認中...</p>
      </div>
    );
  }

  // --- データ集計ロジック ---
  const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const transactionCount = commissions.length;
  const sortedCommissions = [...commissions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recentCommissions = sortedCommissions;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans text-slate-600">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- ヘッダーエリア --- */}
        <div className="flex items-center justify-between w-full">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">管理者ダッシュボード</h1>
                <p className="text-sm text-slate-500 mt-1">FLASTALの運営状況を確認できます</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => {
                        // データを再フェッチ
                        fetchAdminData();
                    }}
                    className="text-sm bg-white border border-slate-300 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1"
                    disabled={loadingData}
                >
                    <FiRefreshCw className={loadingData ? "animate-spin" : ""}/>
                    更新
                </button>
                <button 
                    onClick={() => {
                        logout();
                        router.push('/login');
                    }}
                    className="text-sm bg-white border border-slate-300 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    ログアウト
                </button>
            </div>
        </div>

        {/* --- ナビゲーション (ボタンスタイル) --- */}
        <nav className="flex gap-3 sm:gap-4 flex-wrap">
          <Link 
            href="/admin" 
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg shadow hover:bg-sky-600 transition-colors"
          >
            ダッシュボード
          </Link>
          {/* ★★★ ナビゲーションを審査ページに統一 ★★★ */}
          <Link 
            href="/admin/approval" // ★ 共通の審査ページにリンク
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow transition-colors flex items-center ${totalPendingAccounts > 0 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-500 hover:bg-slate-600'}`}
          >
            <FiClock className="mr-1"/> アカウント審査 
            {totalPendingAccounts > 0 && <span className="ml-2 bg-white text-orange-600 px-2 rounded-full font-bold">{totalPendingAccounts}</span>}
          </Link>
          
          <Link 
            href="/admin/reports"
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow transition-colors flex items-center ${chatReportCount > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-500 hover:bg-slate-600'}`}
          >
            <FiMessageSquare className="mr-1"/> チャット通報 
            {chatReportCount > 0 && <span className="ml-2 bg-white text-red-600 px-2 rounded-full font-bold">{chatReportCount}</span>}
          </Link>
          
          <Link 
            href="/admin/project-approval"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            プロジェクト審査
          </Link>
          <Link 
            href="/admin/venues"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center"
          >
            🏢 会場DB管理
          </Link>
        </nav>

        {/* --- KPIカードエリア (4カラム構成) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1: 総手数料収益 */}
            <div className="block bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <h3 className="text-sm font-medium text-slate-500 flex items-center"><FiDollarSign className="mr-1"/> 総手数料収益</h3>
                <p className="text-3xl font-bold text-sky-600 mt-2">
                    {totalCommission.toLocaleString()}<span className="text-lg font-medium ml-1">pt</span>
                </p>
                <p className="text-sm mt-2 text-slate-500">これまでの累計収益</p>
            </div>

            {/* KPI 2: 取引成立数 */}
            <div className="block bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <h3 className="text-sm font-medium text-slate-500">取引成立数 (累計)</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{transactionCount}</p>
                <p className="text-sm mt-2 text-slate-500">手数料が発生した回数</p>
            </div>

            {/* KPI 3: アカウント審査待ち件数 (新規追加) */}
            <Link 
                href="/admin/approval"
                className={`block p-6 rounded-xl shadow-md border border-slate-100 transition-shadow hover:ring-2 ${totalPendingAccounts > 0 ? 'bg-orange-50 hover:ring-orange-200' : 'bg-white hover:ring-sky-200'}`}
            >
                <h3 className={`text-sm font-medium flex items-center ${totalPendingAccounts > 0 ? 'text-orange-500' : 'text-slate-500'}`}>
                    <FiAward className="mr-1"/> アカウント審査待ち
                </h3>
                <p className={`text-3xl font-bold mt-2 ${totalPendingAccounts > 0 ? 'text-orange-600 animate-pulse' : 'text-slate-800'}`}>
                    {totalPendingAccounts}
                </p>
                <p className="text-sm mt-2 text-slate-500">{totalPendingAccounts > 0 ? 'プロアカウントを承認してください' : '現在、問題なし'}</p>
            </Link>

            {/* KPI 4: チャット通報件数 (位置変更) */}
            <Link 
                href="/admin/reports"
                className={`block p-6 rounded-xl shadow-md border border-slate-100 transition-shadow hover:ring-2 ${chatReportCount > 0 ? 'bg-red-50 hover:ring-red-200' : 'bg-white hover:ring-sky-200'}`}
            >
                <h3 className={`text-sm font-medium flex items-center ${chatReportCount > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                    <FiMessageSquare className="mr-1"/> 未処理の通報
                </h3>
                <p className={`text-3xl font-bold mt-2 ${chatReportCount > 0 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                    {chatReportCount}
                </p>
                <p className="text-sm mt-2 text-slate-500">{chatReportCount > 0 ? '早急に対応が必要です' : '現在、問題なし'}</p>
            </Link>
        </div>

        {/* --- メインコンテンツエリア --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 左側カラム (2/3幅): 手数料履歴リスト */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800">最近の手数料発生履歴</h2>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
                            Live
                        </span>
                    </div>
                    
                    <div className="space-y-0">
                        {loadingData ? (
                            <p className="p-4 text-center text-slate-500">読み込み中...</p>
                        ) : recentCommissions.length === 0 ? (
                            <p className="p-4 text-center text-slate-500">履歴はありません。</p>
                        ) : (
                            recentCommissions.map((c) => (
                                c && c.id && c.project ? (
                                    <div key={c.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                                                <FiDollarSign className="text-lg"/>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{c.project.title || '不明な企画'}</p>
                                                <p className="text-xs text-slate-500">
                                                    {c.createdAt ? new Date(c.createdAt).toLocaleString('ja-JP') : '不明'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">+{c.amount?.toLocaleString() || 0} pt</p>
                                            <p className="text-xs text-slate-400">手数料</p>
                                        </div>
                                    </div>
                                ) : null
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 右側カラム (1/3幅): クイックリンク・ステータス */}
            <div className="space-y-8">
                
                {/* 管理者アクション（クイックリンク） */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">💡 管理者アクション</h3>
                    <div className="space-y-4">
                         <Link href="/admin/approval" className="flex items-center p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                            <span className="text-2xl mr-3">🕒</span>
                            <div>
                                <h4 className="font-semibold text-slate-700 text-sm">アカウント審査 ({totalPendingAccounts})</h4>
                                <p className="text-xs text-slate-500">お花屋さん/会場/主催者の承認</p>
                            </div>
                         </Link>
                         <Link href="/admin/project-approval" className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <span className="text-2xl mr-3">📋</span>
                            <div>
                                <h4 className="font-semibold text-slate-700 text-sm">プロジェクト審査</h4>
                                <p className="text-xs text-slate-500">企画内容の確認・承認</p>
                            </div>
                         </Link>
                         <Link href="/admin/payouts" className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <span className="text-2xl mr-3">💰</span>
                            <div>
                                <h4 className="font-semibold text-slate-700 text-sm">出金管理</h4>
                                <p className="text-xs text-slate-500">お花屋さんへの出金処理</p>
                            </div>
                         </Link>
                         <Link href="/admin/venues" className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <span className="text-2xl mr-3">🏢</span>
                            <div>
                                <h4 className="font-semibold text-slate-700 text-sm">会場DB管理</h4>
                                <p className="text-xs text-slate-500">レギュレーション情報の管理</p>
                            </div>
                         </Link>
                    </div>
                </div>

                {/* システムステータス */}
                <div className="bg-sky-50 p-6 rounded-xl border border-sky-100">
                    <h3 className="font-bold text-lg mb-2 text-sky-800">システムステータス</h3>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm text-sky-700 font-medium">正常稼働中</span>
                    </div>
                    <p className="text-xs text-sky-600">
                        API接続: 良好<br/>
                        最終更新: {new Date().toLocaleString('ja-JP')}
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}