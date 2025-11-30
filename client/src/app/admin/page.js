'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminPage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  const [commissions, setCommissions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

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

    const fetchCommissions = async () => {
      setLoadingData(true);
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/api/admin/commissions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) throw new Error('手数料履歴の取得に失敗しました');
        const data = await res.json();
        setCommissions(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error.message);
        setCommissions([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchCommissions();

  }, [isAuthenticated, user, router, loading]);

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
          <Link 
            href="/admin/payouts" 
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            出金管理
          </Link>
          <Link 
            href="/admin/moderation"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            チャット監視
          </Link>
          <Link 
            href="/admin/florist-approval"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            お花屋さん審査
          </Link>
          <Link 
            href="/admin/project-approval"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            プロジェクト審査
          </Link>
          
          {/* ★★★ 追加: 会場データベースへのリンク ★★★ */}
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
                <h3 className="text-sm font-medium text-slate-500">総手数料収益</h3>
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

            {/* KPI 3: ダミー/拡張用 */}
            <div className="block bg-white p-6 rounded-xl shadow-md border border-slate-100 bg-opacity-60">
                <h3 className="text-sm font-medium text-slate-500">今月の売上 (未実装)</h3>
                <p className="text-3xl font-bold text-slate-400 mt-2">-</p>
                <p className="text-sm mt-2 text-slate-400">前月比: --%</p>
            </div>

            {/* KPI 4: ダミー/拡張用 */}
            <div className="block bg-white p-6 rounded-xl shadow-md border border-slate-100 bg-opacity-60">
                <h3 className="text-sm font-medium text-slate-500">ユーザー数 (未実装)</h3>
                <p className="text-3xl font-bold text-slate-400 mt-2">-</p>
                <p className="text-sm mt-2 text-slate-400">直近24時間のアクセス</p>
            </div>
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
                                                <span className="font-bold text-lg">¥</span>
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
                
                {/* 管理者メモ */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">💡 管理者アクション</h3>
                    <div className="space-y-4">
                         <Link href="/admin/florist-approval" className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <span className="text-2xl mr-3">🏪</span>
                            <div>
                                <h4 className="font-semibold text-slate-700 text-sm">お花屋さん審査</h4>
                                <p className="text-xs text-slate-500">新規登録の承認/拒否</p>
                            </div>
                         </Link>
                         <Link href="/admin/project-approval" className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <span className="text-2xl mr-3">📋</span>
                            <div>
                                <h4 className="font-semibold text-slate-700 text-sm">プロジェクト審査</h4>
                                <p className="text-xs text-slate-500">企画内容の確認</p>
                            </div>
                         </Link>
                         
                         {/* ★★★ 追加: こちらにもリンクを追加 ★★★ */}
                         <Link href="/admin/venues" className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <span className="text-2xl mr-3">🏢</span>
                            <div>
                                <h4 className="font-semibold text-slate-700 text-sm">会場データベース</h4>
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