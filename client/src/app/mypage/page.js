"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReviewModal from '../components/ReviewModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'http://127.0.0.1:8000';

export default function MyPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingProject, setReviewingProject] = useState(null);

  const fetchMyData = async () => {
    if (!user) return; // ユーザーが確定してからフェッチ
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    try {
      const [createdRes, pledgedRes] = await Promise.all([
        fetch(`${API_URL}/api/users/me/created-projects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/users/me/pledged-projects`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (!createdRes.ok || !pledgedRes.ok) {
        throw new Error('データの取得に失敗しました。');
      }
      const createdData = await createdRes.json();
      const pledgedData = await pledgedRes.json();
      setCreatedProjects(createdData);
      setPledgedProjects(pledgedData);
    } catch (error) {
      console.error("データの取得に失敗しました", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchMyData();
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="text-center p-10 bg-sky-50 min-h-screen">読み込み中...</div>;
  }
  
  const renderTabContent = () => {
    if (loading) return <p className="text-gray-600">企画データを読み込み中...</p>;

    switch (activeTab) {
      case 'created':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">作成した企画</h2>
            {createdProjects.length > 0 ? createdProjects.map(p => (
              <div key={p.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <Link href={`/projects/${p.id}`}><span className="font-semibold text-sky-600 hover:underline">{p.title}</span></Link>
                </div>
                {p.status === 'SUCCESSFUL' && !p.review && (
                  <button onClick={() => setReviewingProject(p)} className="px-3 py-1 text-sm font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600">
                    レビューを投稿
                  </button>
                )}
                {p.review && (
                  <span className="text-sm font-semibold text-gray-400">レビュー投稿済み</span>
                )}
              </div>
            )) : <p className="text-gray-600">まだ作成した企画はありません。</p>}
          </div>
        );
      case 'pledged':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">支援した企画</h2>
            {pledgedProjects.length > 0 ? pledgedProjects.map(p => (
              <div key={p.id} className="border rounded-lg p-4">
                <p className="text-gray-800">
                  <Link href={`/projects/${p.project.id}`}><strong className="text-sky-600 hover:underline">{p.project.title}</strong></Link>に <span className="font-bold text-sky-600">{p.amount.toLocaleString()} pt</span> 支援しました
                </p>
              </div>
            )) : <p className="text-gray-600">まだ支援した企画はありません。</p>}
          </div>
        );
      case 'profile':
      default:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">プロフィール情報</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-gray-600">ハンドルネーム:</span><span className="font-semibold text-lg text-gray-900">{user.handleName}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-600">保有ポイント:</span><span className="font-bold text-lg text-sky-600">{user.points.toLocaleString()} pt</span></div>
            </div>
            <div className="border-t my-8"></div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">あなたの紹介コード</h2>
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <span className="flex-grow font-mono text-lg text-gray-800">{user.referralCode}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(user.referralCode);
                    alert('紹介コードをコピーしました！');
                  }} 
                  className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors bg-sky-500 hover:bg-sky-600"
                >
                  コピー
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-sky-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
            <button onClick={logout} className="text-sm text-gray-600 hover:text-red-500">ログアウト</button>
          </div>
          <div className="mb-6 border-b">
            <nav className="-mb-px flex space-x-6">
              <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>プロフィール</button>
              <button onClick={() => setActiveTab('created')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'created' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>作成した企画</button>
              <button onClick={() => setActiveTab('pledged')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pledged' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>支援した企画</button>
            </nav>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {reviewingProject && (
        <ReviewModal
          project={reviewingProject}
          user={user}
          onClose={() => setReviewingProject(null)}
          onReviewSubmitted={fetchMyData}
        />
      )}
    </>
  );
}