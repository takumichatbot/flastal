"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // 変更なし
import { useRouter } from 'next/navigation'; // 変更なし
import Link from 'next/link';
// import ReviewModal from '../components/ReviewModal'; // ReviewModalはまだないのでコメントアウト

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com'; // ★ URLを修正

export default function MyPage() {
  const { user, loading: authLoading, logout } = useAuth(); // 変更なし
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [reviewingProject, setReviewingProject] = useState(null); // ReviewModalがないためコメントアウト

  const fetchMyData = async () => {
    if (!user) return; // 変更なし
    setLoading(true);
    
    // ★★★ 修正ここから ★★★
    // 'accessToken' は不要。 user.id を使います。
    // APIエンドポイントを修正します。
    try {
      const [createdRes, pledgedRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${user.id}/created-projects`), // 'me' -> user.id, token削除
        fetch(`${API_URL}/api/users/${user.id}/pledged-projects`) // 'me' -> user.id, token削除
      ]);
      // ★★★ 修正ここまで ★★★

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
  }, [user, authLoading, router]); // 変更なし

  // 読み込み中の表示
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sky-50">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }
  
  // タブの内容を描画する関数
  const renderTabContent = () => {
    if (loading) return <p className="text-gray-600">企画データを読み込み中...</p>;

    switch (activeTab) {
      case 'created':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">作成した企画</h2>
            {createdProjects.length > 0 ? createdProjects.map(p => (
              <div key={p.id} className="border rounded-lg p-4 flex justify-between items-center bg-gray-50">
                <div>
                  <Link href={`/projects/${p.id}`}><span className="font-semibold text-sky-600 hover:underline">{p.title}</span></Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {p.collectedAmount.toLocaleString()} pt / {p.targetAmount.toLocaleString()} pt
                  </p>
                </div>
                {/* ★ レビュー機能は一旦コメントアウト
                {p.status === 'SUCCESSFUL' && !p.review && (
                  <button onClick={() => setReviewingProject(p)} className="px-3 py-1 text-sm font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600">
                    レビューを投稿
                  </button>
                )}
                {p.review && (
                  <span className="text-sm font-semibold text-gray-400">レビュー投稿済み</span>
                )}
                */}
              </div>
            )) : <p className="text-gray-600">まだ作成した企画はありません。</p>}
          </div>
        );
      case 'pledged':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">支援した企画</h2>
            {pledgedProjects.length > 0 ? pledgedProjects.map(pledge => ( // 変数名を p から pledge に変更
              <div key={pledge.id} className="border rounded-lg p-4 bg-gray-50">
                <p className="text-gray-800">
                  <Link href={`/projects/${pledge.project.id}`}><strong className="text-sky-600 hover:underline">{pledge.project.title}</strong></Link>に <span className="font-bold text-sky-600">{pledge.amount.toLocaleString()} pt</span> 支援しました
                </p>
              </div>
            )) : <p className="text-gray-600">まだ支援した企画はありません。</p>}
          </div>
        );
      case 'profile':
      default:
        // プロフィールタブのデザインを少しリッチにします
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">プロフィール情報</h2>
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b pb-4">
                <span className="text-gray-600">ハンドルネーム:</span>
                <span className="font-semibold text-lg text-gray-900">{user.handleName}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-4">
                <span className="text-gray-600">保有ポイント:</span>
                <span className="font-bold text-2xl text-sky-600">{user.points.toLocaleString()} pt</span>
              </div>
              <div className="flex justify-between items-center border-b pb-4">
                <span className="text-gray-600">メールアドレス:</span>
                <span className="font-semibold text-lg text-gray-900">{user.email}</span>
              </div>
            </div>
            <div className="mt-10 p-6 bg-sky-50 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">あなたの紹介コード</h3>
              <p className="text-sm text-gray-600 mb-4">
                友達がこのコードを使って登録し、初めてポイントを購入すると、あなたに 500 pt が付与されます！
              </p>
              <div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow-inner">
                <span className="flex-grow font-mono text-lg text-sky-700 tracking-wider">{user.referralCode}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(user.referralCode);
                    toast.success('紹介コードをコピーしました！'); // alertをtoastに変更
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
      <div className="min-h-screen bg-sky-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* ログアウトボタンをヘッダーに移動（ヘッダー側で実装済みのため削除） */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">マイページ</h1>
          
          <div className="mb-6 border-b border-gray-300">
            <nav className="-mb-px flex space-x-6">
              <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>プロフィール</button>
              <button onClick={() => setActiveTab('created')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'created' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>作成した企画</button>
              <button onClick={() => setActiveTab('pledged')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pledged' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>支援した企画</button>
            </nav>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {/* {reviewingProject && (
        <ReviewModal
          project={reviewingProject}
          user={user}
          onClose={() => setReviewingProject(null)}
          onReviewSubmitted={() => {
            fetchMyData(); // データ再読み込み
            setReviewingProject(null); // モーダルを閉じる
          }}
        />
      )}
      */}
    </>
  );
}