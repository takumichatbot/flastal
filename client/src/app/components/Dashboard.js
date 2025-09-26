'use client';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  
  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchMyData = async () => {
        setLoading(true);
        try {
          const [createdRes, pledgedRes] = await Promise.all([
            fetch(`http://localhost:3001/api/users/${user.id}/created-projects`),
            fetch(`http://localhost:3001/api/users/${user.id}/pledged-projects`)
          ]);
          const createdData = await createdRes.json();
          const pledgedData = await pledgedRes.json();
          setCreatedProjects(createdData.slice(0, 5));
          setPledgedProjects(pledgedData.slice(0, 5));
        } catch (error) {
          console.error("ダッシュボードのデータ取得に失敗", error);
        } finally {
          setLoading(false);
        }
      };
      fetchMyData();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  // ★★★ 「あなたの活動」リストのアイテム部分を部品化 ★★★
  const ActivityItem = ({ href, text }) => (
    <li>
      <Link href={href}>
        <span className="block p-3 rounded-lg hover:bg-slate-100/80 transition-colors text-slate-700 font-medium cursor-pointer">
          {text}
        </span>
      </Link>
    </li>
  );

  return (
    <div className="w-full bg-slate-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 左側カラム：メインコンテンツ */}
          <div className="lg:col-span-2 space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">ようこそ、{user.handleName}さん！</h1>
              <p className="mt-2 text-gray-600">今日も「推し」への愛を形にしましょう。</p>
            </div>
            
            {/* ★★★ ここからが新しい「あなたの活動」セクションです ★★★ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 作成した企画カード */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-sky-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-sky-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1V14H6c-.6 0-1 .4-1 1s.4 1 1 1h1.2l-1.6 4.7c-.2.6.1 1.3.7 1.5.6.2 1.3-.1 1.5-.7L9 16h6c.6 0 1-.4 1-1s-.4-1-1-1h-1.2l1.6-4.7c.2-.6-.1-1.3-.7-1.5-.2 0-.4-.1-.6-.1H13V3.6c0-.4-.2-.8-.5-1.1-.3-.3-.7-.5-1.1-.5Z"/></svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">最近作成した企画</h2>
                </div>
                {loading ? <p className="text-sm text-gray-500 p-2">読み込み中...</p> : (
                  createdProjects.length > 0 ? (
                    <ul className="space-y-1">
                      {createdProjects.map(p => <ActivityItem key={p.id} href={`/projects/${p.id}`} text={p.title} />)}
                    </ul>
                  ) : <p className="text-sm text-gray-500 p-2">まだ作成した企画はありません。</p>
                )}
              </div>
              
              {/* 支援した企画カード */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                 <div className="flex items-center gap-3 mb-4">
                  <div className="bg-pink-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-pink-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">最近支援した企画</h2>
                </div>
                {loading ? <p className="text-sm text-gray-500 p-2">読み込み中...</p> : (
                  pledgedProjects.length > 0 ? (
                    <ul className="space-y-1">
                      {pledgedProjects.map(p => <ActivityItem key={p.id} href={`/projects/${p.project.id}`} text={p.project.title} />)}
                    </ul>
                  ) : <p className="text-sm text-gray-500 p-2">まだ支援した企画はありません。</p>
                )}
              </div>
            </div>
          </div>

          {/* 右側カラム：サイドバー (変更なし) */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h3 className="font-semibold text-gray-800 mb-4">クイックアクション</h3>
              <div className="flex flex-col gap-4">
                <Link href="/projects/create" className="w-full px-6 py-3 font-bold text-white bg-sky-500 rounded-lg shadow hover:bg-sky-600 transition-colors">
                  💡 企画を作成する
                </Link>
                <Link href="/projects" className="w-full px-6 py-3 font-bold text-sky-600 bg-sky-100 rounded-lg hover:bg-sky-200 transition-colors">
                  💖 企画を探す
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-sky-400 to-indigo-500 text-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm opacity-80">保有ポイント</p>
              <p className="text-4xl font-bold my-2">{user.points.toLocaleString()} pt</p>
              <Link href="/points">
                <span className="mt-2 block text-center w-full bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm font-semibold">
                  ポイントを購入する
                </span>
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
               <Link href="/mypage">
                  <span className="font-semibold text-slate-700 hover:text-sky-600">
                    マイページで全履歴を見る →
                  </span>
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}