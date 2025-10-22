'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminProjectApprovalsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [isAuthenticated, setIsAuthenticated] = useState(false); // 本番では管理者認証を実装

  // 審査待ちの企画を取得する関数
  const fetchPendingProjects = async () => {
    setLoading(true);
    try {
      // 本番では管理者トークンでの認証が必要
      // const token = localStorage.getItem('adminToken');
      // if (!token) throw new Error('管理者としてログインしていません。');
      // const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_URL}/api/admin/projects/pending`/*, { headers }*/);
      if (!res.ok) throw new Error('審査待ち企画の取得に失敗しました。');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ここに管理者認証チェックを入れる
    // if (!adminLoggedIn) router.push('/admin/login');
    fetchPendingProjects();
  }, []);

  // 企画のステータスを更新する関数
  const handleUpdateStatus = async (projectId, status) => {
    const actionText = status === 'FUNDRAISING' ? '承認' : '却下';
    if (!window.confirm(`この企画を「${actionText}」しますか？`)) return;

    // 本番では管理者トークンでの認証が必要
    // const token = localStorage.getItem('adminToken');
    // if (!token) return toast.error('管理者としてログインしていません。');
    // const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const promise = fetch(`${API_URL}/api/admin/projects/${projectId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' } /* headers */,
      body: JSON.stringify({ status }),
    }).then(async res => { // async追加
      if (!res.ok) {
         let errorMsg = `処理に失敗しました`;
         try { // エラーレスポンスのパース試行
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
        setProjects(prev => prev.filter(p => p.id !== projectId));
        return `企画を「${actionText}」しました。`;
      },
      error: (err) => err.message,
    });
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
            <Link href="/admin" className="text-sky-600 hover:underline text-sm">
                &larr; 管理者ダッシュボードに戻る
            </Link>
             <h1 className="text-2xl font-bold text-gray-800 mt-2">企画の承認・審査</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {projects.length === 0 ? (
            <p className="text-gray-500 text-center">現在、審査待ちの企画はありません。</p>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                 project && project.id && project.planner ? ( // データの存在確認
                    <div key={project.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                        <p className="text-xs text-gray-400">申請日時: {new Date(project.createdAt).toLocaleString('ja-JP')}</p>
                        <h2 className="font-semibold text-lg text-gray-800 mt-1">{project.title || 'タイトルなし'}</h2>
                        <p className="text-sm text-gray-600">企画者: {project.planner.handleName || '不明'}</p>
                        <p className="text-xs text-gray-500">目標: {project.targetAmount?.toLocaleString() || 0} pt</p>
                        <p className="text-xs text-gray-500">公開設定: {project.visibility === 'PUBLIC' ? '全体公開' : '限定公開'}</p>
                        </div>
                        {/* プレビューボタンは企画ページへのリンク */}
                        <Link href={`/projects/${project.id}`} target="_blank" className="text-sm text-sky-600 hover:underline whitespace-nowrap bg-white px-3 py-1 rounded border border-sky-200">
                            プレビュー
                        </Link>
                    </div>
                    {/* 説明文を折りたたみ表示 (任意) */}
                    {/* <details className="mt-2 text-sm text-gray-600">
                        <summary className="cursor-pointer text-xs text-gray-500">詳細を表示</summary>
                        <p className="mt-1 whitespace-pre-wrap bg-white p-2 border rounded">{project.description || '詳細なし'}</p>
                    </details> */}
                    <div className="mt-4 border-t pt-4 flex flex-wrap gap-4">
                        <button onClick={() => handleUpdateStatus(project.id, 'FUNDRAISING')} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors text-sm">承認する</button>
                        <button onClick={() => handleUpdateStatus(project.id, 'REJECTED')} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-sm">却下する</button>
                    </div>
                    </div>
                 ) : null // 不正なデータは表示しない
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}