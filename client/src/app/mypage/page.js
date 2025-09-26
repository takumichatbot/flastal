'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReviewModal from '../components/ReviewModal';

export default function MyPage() {
  const { user, userType } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reviewingProject, setReviewingProject] = useState(null);

  const fetchMyData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [createdRes, pledgedRes] = await Promise.all([
        fetch(`http://localhost:3001/api/users/${user.id}/created-projects`),
        fetch(`http://localhost:3001/api/users/${user.id}/pledged-projects`)
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
      alert("データの取得中にエラーが発生しました。"); // ★ ユーザーにエラーを通知
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userType === 'USER') {
      fetchMyData();
    } else if (!user) { // 読み込み中のちらつきを防ぐ
      // 認証情報が確定するまで何もしない
    } else {
      router.push('/login');
    }
  }, [user, userType, router]);
  
  const handleCopy = () => {
    if (user && user.referralCode) {
      const a = document.createElement('input');
      a.value = user.referralCode;
      document.body.appendChild(a);
      a.select();
      document.execCommand('copy');
      document.body.removeChild(a);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user || userType !== 'USER') {
    return <div className="text-center p-10">読み込み中、またはアクセス権がありません...</div>;
  }
  
  // ★★★ ここからがタブの中身を描画する、完全なコンポーネントです ★★★
  const renderTabContent = () => {
    if (loading) return <p className="text-gray-600">読み込み中...</p>;

    switch (activeTab) {
      case 'created':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">作成した企画</h2>
            {createdProjects.length > 0 ? createdProjects.map(p => (
              <div key={p.id} className="border rounded-lg p-4 flex justify-between items-center text-gray-800">
                <div>
                  <Link href={`/projects/${p.id}`}><span className="font-semibold text-sky-600 hover:underline">{p.title}</span></Link>
                  <p className={`text-xs mt-1 font-bold px-2 py-0.5 rounded-full inline-block ml-2 ${p.status === 'SUCCESSFUL' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {p.status === 'SUCCESSFUL' ? '成功' : '募集中'}
                  </p>
                </div>
                {p.status === 'SUCCESSFUL' && p.offer && !p.review && (
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
                  <Link href={`/projects/${p.project.id}`}><strong className="text-sky-600 hover:underline">{p.project.title}</strong></Link>に <span className="font-bold text-blue-600">{p.amount.toLocaleString()} pt</span> 支援しました
                </p>
              </div>
            )) : <p className="text-gray-600">まだ支援した企画はありません。</p>}
          </div>
        );
      case 'profile':
      default:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">プロフィール情報</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-gray-600">ハンドルネーム:</span><span className="font-semibold text-lg text-gray-900">{user.handleName}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-600">保有ポイント:</span><span className="font-bold text-lg text-blue-600">{user.points.toLocaleString()} pt</span></div>
            </div>
            <div className="border-t my-8"></div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">あなたの紹介コード</h2>
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <span className="flex-grow font-mono text-lg text-gray-800">{user.referralCode}</span>
                <button onClick={handleCopy} className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors ${copied ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}>
                  {copied ? 'コピーしました！' : 'コピー'}
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">マイページ</h1>
          
          <div className="mb-6 border-b">
            <nav className="-mb-px flex space-x-6">
              <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>プロフィール</button>
              <button onClick={() => setActiveTab('created')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'created' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>作成した企画</button>
              <button onClick={() => setActiveTab('pledged')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pledged' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>支援した企画</button>
            </nav>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {reviewingProject && (
        <ReviewModal
          project={reviewingProject}
          offer={reviewingProject.offer}
          user={user}
          onClose={() => setReviewingProject(null)}
          onReviewSubmitted={fetchMyData}
        />
      )}
    </>
  );
}