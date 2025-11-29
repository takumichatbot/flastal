'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ModerationProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true); 
  const router = useRouter();
  
  const { user, isAuthenticated, loading, logout } = useAuth();

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

    const fetchProjects = async () => {
      setLoadingData(true); 
      try {
        // ★★★ 修正箇所: トークン取得キーを 'authToken' に、ヘッダーを追加 ★★★
        const token = localStorage.getItem('authToken');
        
        const res = await fetch(`${API_URL}/api/admin/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('プロジェクト一覧の取得に失敗しました。');

        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch projects', error);
        toast.error(error.message);
        setProjects([]);
      } finally {
        setLoadingData(false); 
      }
    };
    fetchProjects();
    
  }, [isAuthenticated, user, router, loading]); 

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
          <h1 className="text-3xl font-bold text-gray-900">プロジェクト審査</h1>
          <button onClick={() => {
              logout(); 
              router.push('/login'); 
            }} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
              ログアウト
          </button>
        </div>

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
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg shadow-sm hover:bg-sky-600 transition-colors"
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
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            プロジェクト審査
          </Link>
        </nav>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 mb-4">チャットを監視したいプロジェクトを選択してください。</p>
          {loadingData ? (
            <p className="text-gray-500 text-center">プロジェクトを読み込み中...</p>
          ) : projects.length === 0 ? (
            <p className="text-gray-500 text-center">プロジェクトが見つかりません。</p>
          ) : (
            <div className="space-y-3">
              {projects.map(project => (
                  project && project.id && project.planner ? (
                  <Link key={project.id} href={`/admin/moderation/${project.id}`} legacyBehavior>
                      <a className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 cursor-pointer transition-colors">
                      <h2 className="font-semibold text-lg text-sky-600 truncate">{project.title || 'タイトルなし'}</h2>
                      <p className="text-sm text-gray-500">企画者: {project.planner.handleName || '不明'}</p>
                      <p className="text-xs text-gray-400 mt-1">状態: {project.status || '不明'}</p>
                      </a>
                  </Link>
                  ) : null
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}