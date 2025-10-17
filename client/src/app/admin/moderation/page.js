'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// ★ 1. APIのURLをPythonバックエンドに統一
const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function ModerationProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // ★ 2. 認証トークンを取得
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('管理者としてログインしていません。');

        // ★ 3. APIリクエストにトークンを付与
        const res = await fetch(`${API_URL}/api/admin/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('プロジェクト一覧の取得に失敗しました。');

        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects', error);
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <p className="p-8 text-center">プロジェクトを読み込み中...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">チャット監視</h1>
        <p className="text-gray-600 mb-4">監視したいプロジェクトを選択してください。</p>
        <div className="space-y-3">
          {projects.map(project => (
            <Link key={project.id} href={`/admin/moderation/${project.id}`}>
              <div className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 cursor-pointer">
                <h2 className="font-semibold text-lg text-sky-600">{project.title}</h2>
                <p className="text-sm text-gray-500">企画者: {project.planner.handleName}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}