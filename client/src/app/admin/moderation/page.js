'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast'; // Import toast
import { useRouter } from 'next/navigation'; // Import useRouter

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ModerationProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true); // Set loading true
      try {
        const token = localStorage.getItem('adminToken'); // Use admin token
        if (!token) throw new Error('管理者としてログインしていません。');

        const res = await fetch(`${API_URL}/api/admin/projects`, {
          headers: {
            // Assuming auth is needed
            // 'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('プロジェクト一覧の取得に失敗しました。');

        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch projects', error);
        toast.error(error.message); // Use toast
        if (error.message.includes('ログインしていません')) {
            router.push('/admin'); // Redirect if not authenticated
        }
        setProjects([]); // Clear data on error
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [router]); // Add router dependency

  if (loading) return <p className="p-8 text-center">プロジェクトを読み込み中...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">チャット監視</h1>
        <p className="text-gray-600 mb-4">監視したいプロジェクトを選択してください。</p>
        {projects.length === 0 ? (
            <p className="text-gray-500 text-center">プロジェクトが見つかりません。</p>
        ) : (
            <div className="space-y-3">
            {projects.map(project => (
                project && project.id && project.planner ? ( // Add checks
                <Link key={project.id} href={`/admin/moderation/${project.id}`} legacyBehavior>
                    <a className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 cursor-pointer transition-colors">
                    <h2 className="font-semibold text-lg text-sky-600 truncate">{project.title || 'タイトルなし'}</h2>
                    <p className="text-sm text-gray-500">企画者: {project.planner.handleName || '不明'}</p>
                     {/* Optionally show project status */}
                    <p className="text-xs text-gray-400 mt-1">状態: {project.status || '不明'}</p>
                    </a>
                </Link>
                ) : null
            ))}
            </div>
        )}
      </div>
    </div>
  );
}