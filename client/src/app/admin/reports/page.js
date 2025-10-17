'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ★ 1. APIのURLをPythonバックエンドに統一
const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      // ★ 2. 認証トークンを取得・付与
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('管理者としてログインしていません。');

      const res = await fetch(`${API_URL}/api/admin/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('通報リストの読み込みに失敗しました。');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleMarkAsReviewed = async (reportId) => {
    if (!window.confirm("この通報を「対応済み」としてマークします。よろしいですか？")) return;

    try {
      // ★ 3. 認証トークンを取得・付与
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('管理者としてログインしていません。');

      const res = await fetch(`${API_URL}/api/admin/reports/${reportId}/review`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('ステータスの更新に失敗しました。');
      
      alert('ステータスを更新しました。');
      setReports(prevReports => prevReports.filter(r => r.id !== reportId));
    } catch (err) {
      alert(`エラー: ${err.message}`);
    }
  };
  
  const handleToggleVisibility = async (projectId, currentVisibility) => {
    const actionText = currentVisibility ? "非公開" : "公開";
    if (!window.confirm(`この企画を「${actionText}」にします。この操作は元に戻せます。よろしいですか？`)) return;

    try {
      // ★ 4. 認証トークンを取得・付与
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('管理者としてログインしていません。');

      const res = await fetch(`${API_URL}/api/admin/projects/${projectId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVisible: !currentVisibility }),
      });
      if (!res.ok) throw new Error('公開状態の更新に失敗しました。');
      
      alert(`企画を「${actionText}」にしました。`);
    } catch (err) {
      alert(`エラー: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">未対応の通報管理</h1>
        
        {reports.length === 0 ? (
          <p className="text-gray-500">現在、未対応の通報はありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                      <th scope="col" className="px-6 py-3">通報日時</th>
                      <th scope="col" className="px-6 py-3">対象企画</th>
                      <th scope="col" className="px-6 py-3">通報者</th>
                      <th scope="col" className="px-6 py-3">理由</th>
                      <th scope="col" className="px-6 py-3">詳細</th>
                      <th scope="col" className="px-6 py-3">アクション</th>
                  </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{new Date(report.createdAt).toLocaleString('ja-JP')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/projects/${report.project.id}`} target="_blank" rel="noopener noreferrer">
                        <span className="text-sky-600 hover:underline">{report.project.title}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">{report.reporter.handleName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">{report.reason}</span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-pre-wrap">{report.details || 'なし'}</td>
                    <td className="px-6 py-4 space-y-2 flex flex-col items-start">
                      <button
                        onClick={() => handleMarkAsReviewed(report.id)}
                        className="font-medium text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-xs"
                      >
                        対応済みにする
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(report.project.id, true)}
                        className="font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs"
                      >
                        企画を非公開にする
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}