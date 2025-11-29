"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ステータス表示用のヘルパー関数
const getStatusBadge = (status) => {
  switch (status) {
    case 'PENDING_APPROVAL': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">審査中</span>;
    case 'FUNDRAISING': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">募集中</span>;
    case 'SUCCESSFUL': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-300">達成</span>;
    case 'COMPLETED': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">完了</span>;
    case 'CANCELED': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">中止</span>;
    case 'REJECTED': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-300">却下</span>;
    default: return null;
  }
};

export default function MyPageContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true); 

  const fetchMyData = useCallback(async () => {
    if (!user || !user.id) return; 
    setLoadingData(true);
    try {
      const [createdRes, pledgedRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${user.id}/created-projects`),
        fetch(`${API_URL}/api/users/${user.id}/pledged-projects`)
      ]);

      if (!createdRes.ok) {
          const errorData = await createdRes.json().catch(() => ({})); 
          throw new Error(`作成した企画の取得失敗: ${errorData.message || createdRes.statusText}`);
      }
      if (!pledgedRes.ok) {
          const errorData = await pledgedRes.json().catch(() => ({}));
          throw new Error(`支援した企画の取得失敗: ${errorData.message || pledgedRes.statusText}`);
      }

      const createdData = await createdRes.json();
      const pledgedData = await pledgedRes.json();
      setCreatedProjects(Array.isArray(createdData) ? createdData : []); 
      setPledgedProjects(Array.isArray(pledgedData) ? pledgedData : []); 

    } catch (error) {
      console.error("マイページデータの取得に失敗しました:", error);
      toast.error(error.message || "データの取得に失敗しました。"); 
      setCreatedProjects([]); 
      setPledgedProjects([]);
    } finally {
      setLoadingData(false);
    }
  }, [user]); 

  useEffect(() => {
    if (authLoading) return; 
    if (!user) {
      router.push('/login'); 
      return;
    }
    fetchMyData(); 
  }, [user, authLoading, router, fetchMyData]); 

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sky-50">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // タブの内容を描画する関数
  const renderTabContent = () => {
    if (loadingData && activeTab !== 'profile') {
        return <p className="text-gray-600 text-center py-4">企画データを読み込み中...</p>;
    }

    switch (activeTab) {
      case 'created':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">作成した企画</h2>
            {createdProjects.length > 0 ? createdProjects.map(p => (
              <div key={p.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50 shadow-sm">
                <div className="flex-grow mb-2 sm:mb-0 sm:mr-4">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getStatusBadge(p.status)}
                    {p.status !== 'REJECTED' && p.status !== 'PENDING_APPROVAL' ? (
                       <Link href={`/projects/${p.id}`} legacyBehavior>
                           <a className="font-semibold text-sky-600 hover:underline truncate">{p.title}</a>
                       </Link>
                    ) : (
                       <span className="font-semibold text-gray-700 truncate">{p.title}</span>
                    )}
                  </div>
                  {(p.status === 'FUNDRAISING' || p.status === 'SUCCESSFUL' || p.status === 'COMPLETED') && (
                    <p className="text-sm text-gray-500 mt-1">
                      {p.collectedAmount?.toLocaleString() ?? 0} pt / {p.targetAmount?.toLocaleString() ?? 0} pt
                    </p>
                  )}
                  {p.status === 'REJECTED' && (
                     <p className="text-sm text-red-600 mt-1">
                        この企画は承認されませんでした。
                     </p>
                  )}
                   {p.status === 'PENDING_APPROVAL' && (
                     <p className="text-sm text-yellow-700 mt-1">
                        運営による審査中です。承認されると公開されます。
                     </p>
                  )}
                </div>
              </div>
            )) : <p className="text-gray-600 text-center py-4">まだ作成した企画はありません。</p>}
          </div>
        );
      case 'pledged':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">支援した企画</h2>
            {pledgedProjects.length > 0 ? pledgedProjects.map(pledge => (
              pledge && pledge.project ? (
                <div key={pledge.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                  <p className="text-gray-800">
                    <Link href={`/projects/${pledge.project.id}`} legacyBehavior><a className="font-semibold text-sky-600 hover:underline">{pledge.project.title}</a></Link>に <span className="font-bold text-sky-600">{pledge.amount?.toLocaleString() ?? 0} pt</span> 支援しました
                  </p>
                   <p className="text-xs text-gray-400 mt-1 text-right">
                       {new Date(pledge.createdAt).toLocaleString('ja-JP')}
                   </p>
                </div>
               ) : null 
            )) : <p className="text-gray-600 text-center py-4">まだ支援した企画はありません。</p>}
          </div>
        );
      case 'profile':
      default:
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">プロフィール情報</h2>
              <Link href="/mypage/edit">
                <span className="px-4 py-2 text-sm font-semibold text-sky-600 bg-sky-100 rounded-lg hover:bg-sky-200 transition-colors">
                  プロフィールを編集
                </span>
              </Link>
            </div>

            <div className="flex flex-col items-center mb-8 border-b pb-6">
              {user.iconUrl ? (
                <img src={user.iconUrl} alt="icon" className="h-24 w-24 rounded-full object-cover mb-4" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>
                </div>
              )}
              <span className="font-semibold text-2xl text-gray-900">{user.handleName}</span>
            </div>
            
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <span className="text-gray-600 mb-1 sm:mb-0">保有ポイント:</span>
                <span className="font-bold text-2xl text-sky-600">{(user.points || 0).toLocaleString()} pt</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <span className="text-gray-600 mb-1 sm:mb-0">メールアドレス:</span>
                <span className="font-semibold text-lg text-gray-900">{user.email}</span>
              </div>
            </div>

            <div className="mt-10 p-6 bg-sky-50 rounded-lg shadow-inner">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">あなたの紹介コード</h3>
              <p className="text-sm text-gray-600 mb-4">
                友達がこのコードを使って登録し、初めてポイントを購入すると、あなたに 500 pt が付与されます！
              </p>
              <div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow-sm border border-sky-100">
                <input
                    type="text"
                    readOnly
                    value={user.referralCode}
                    className="flex-grow font-mono text-lg text-sky-700 tracking-wider bg-transparent border-none focus:ring-0 p-0"
                    aria-label="紹介コード"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.referralCode);
                    toast.success('紹介コードをコピーしました！');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors bg-sky-500 hover:bg-sky-600 flex-shrink-0"
                  aria-label="紹介コードをコピー"
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
          
          {/* ▼▼▼ 追加: 管理者専用メニューブロック ▼▼▼ */}
          {user && user.role === 'ADMIN' && (
            <div className="mb-8 p-6 bg-slate-800 rounded-xl text-white shadow-lg border border-slate-700">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    管理者メニュー
                  </h2>
                  <p className="text-slate-300 text-sm mt-1">
                    企画の承認審査、手数料の確認、ユーザー管理はこちらから行えます。
                  </p>
                </div>
                <Link 
                  href="/admin" 
                  className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-md text-center inline-block"
                >
                  管理画面へ移動する
                </Link>
              </div>
            </div>
          )}
          {/* ▲▲▲ 追加ここまで ▲▲▲ */}

          <h1 className="text-3xl font-bold text-gray-900 mb-8">マイページ</h1>

          <div className="mb-6 border-b border-gray-300">
            <nav className="-mb-px flex space-x-6 overflow-x-auto">
              <button onClick={() => setActiveTab('profile')} className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'profile' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>プロフィール</button>
              <button onClick={() => setActiveTab('created')} className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'created' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>作成した企画</button>
              <button onClick={() => setActiveTab('pledged')} className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'pledged' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>支援した企画</button>
            </nav>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  );
}