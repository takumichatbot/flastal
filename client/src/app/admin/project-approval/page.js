'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // ★ ../../

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminProjectApprovalsPage() {
  const [projects, setProjects] = useState([]); // ★ projects に変更
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();
  
  const { user, isAuthenticated, loading, logout } = useAuth();

  // ★ 審査待ちプロジェクトを取得する関数
  const fetchPendingProjects = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/projects/pending`); // ★ APIパスを変更
      if (res.status === 401) throw new Error('管理者権限がありません。');
      if (!res.ok) throw new Error('審査待ち企画リストの取得に失敗しました。');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []); // ★ setProjects に変更
    } catch (error) {
      toast.error(error.message);
      setProjects([]); // ★ setProjects に変更
    } finally {
      setLoadingData(false);
    }
  };

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
    
    fetchPendingProjects(); // ★ 実行する関数を変更
    
  }, [isAuthenticated, user, router, loading]);

  // ★ プロジェクトのステータスを更新する関数
  const handleUpdateStatus = async (projectId, status) => {
    // ★ API (index.js 478行目) に合わせて、承認は 'FUNDRAISING'
    const actionText = status === 'FUNDRAISING' ? '承認' : '拒否';
    if (!window.confirm(`この企画を「${actionText}」しますか？`)) return;

    const promise = fetch(`${API_URL}/api/admin/projects/${projectId}/status`, { // ★ APIパスを変更
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }), // ★ status: 'FUNDRAISING' or 'REJECTED'
    }).then(async res => {
      if (res.status === 401) throw new Error('管理者権限がありません。');
      if (!res.ok) {
         let errorMsg = `処理に失敗しました`;
         try {
             const errData = await res.json();
             errorMsg = errData.message || errorMsg;
         } catch(e) { /* ignore */ }
         throw new Error(errorMsg);
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '処理中...',
      success: () => {
        setProjects(prev => prev.filter(p => p.id !== projectId)); // ★ setProjects
        return `企画を「${actionText}」しました。`;
      },
      error: (err) => err.message,
    });
  };

  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-700">管理者権限を確認中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">プロジェクト 登録審査</h1>
          <button onClick={() => {
              logout(); 
              router.push('/login'); 
            }} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
              ログアウト
          </button>
        </div>

        {/* ★ ナビゲーション (このページをアクティブに) */}
        <nav className="mb-6 flex gap-3 sm:gap-4 flex-wrap">
          <Link 
            href="/admin" 
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            ダッシュボード (収益)
          </Link>
          <Link 
            href="/admin/payouts" 
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            出金管理
          </Link>
          <Link 
            href="/admin/moderation"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            チャット監視
          </Link>
          <Link 
            href="/admin/florist-approval"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            お花屋さん審査
          </Link>
          <Link 
            href="/admin/project-approval"
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg shadow-sm hover:bg-sky-600 transition-colors"
          >
            プロジェクト審査
          </Link>
        </nav>

        {/* ★ 表示コンテンツを projects に変更 */}
        <div className="bg-white rounded-lg shadow-md p-6">
            {loadingData ? (
              <p className="text-gray-500 text-center">読み込み中...</p>
            ) : projects.length === 0 ? (
              <p className="text-gray-500 text-center">現在、審査待ちの企画はありません。</p>
            ) : (
            <div className="space-y-4">
                {projects.map(project => ( // ★ projects.map
                project && project.id ? (
                    <div key={project.id} className="border rounded-lg p-4 bg-gray-50">
                        <p className="text-xs text-gray-400">申請日時: {new Date(project.createdAt).toLocaleString('ja-JP')}</p>
                        <p><strong>企画タイトル:</strong> {project.title}</p>
                        <p><strong>企画者:</strong> {project.planner?.handleName || '不明'}</p>
                        <p><strong>目標金額:</strong> {project.targetAmount.toLocaleString()} pt</p>
                        <div className="mt-4 flex gap-4">
                        {/* ★ APIに合わせて status を 'FUNDRAISING' に */}
                        <button onClick={() => handleUpdateStatus(project.id, 'FUNDRAISING')} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">承認する</button>
                        <button onClick={() => handleUpdateStatus(project.id, 'REJECTED')} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600">拒否する</button>
                        </div>
                    </div>
                 ) : null
                ))}
            </div>
            )}
        </div>
      </div>
    </div>
  );
}