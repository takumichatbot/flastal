'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // ★ AuthContextをインポート
import Link from 'next/link'; // ★ Linkをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ★ オファー用のモーダルコンポーネント (useAuthフックを使うように修正)
function OfferModal({ floristId, onClose }) {
  const { user, userType } = useAuth(); // ★ ログイン中のユーザー情報を取得
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  // モーダルが開かれたときに、ログインユーザーの企画リストを自動で取得する
  useEffect(() => {
    if (user && userType === 'USER') {
      const fetchUserProjects = async () => {
        setLoadingProjects(true);
        try {
          const res = await fetch(`${API_URL}/api/users/${user.id}/projects`);
          if (!res.ok) throw new Error('企画の取得に失敗しました。');
          const data = await res.json();
          setProjects(data);
          if (data.length === 0) {
            alert('オファーに出せる企画がありません。\n新しい企画を作成してください。');
          }
        } catch (error) {
          alert(error.message);
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchUserProjects();
    }
  }, [user, userType]);
  
  // オファーを送信する処理
  const handleOfferSubmit = async () => {
    if (!selectedProjectId) {
      alert('オファーする企画を選択してください。');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          floristId: floristId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert('オファーを送信しました！');
      onClose(); // モーダルを閉じる
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">企画をオファーする</h2>
        <div className="space-y-4">
          {loadingProjects ? <p>あなたの企画を読み込み中...</p> : (
            <div>
              <label className="block text-sm font-medium text-gray-700">オファーする企画を選択</label>
              <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md">
                <option value="">-- 企画を選んでください --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">キャンセル</button>
          <button onClick={handleOfferSubmit} className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:opacity-50" disabled={loadingProjects || projects.length === 0}>オファーを送信</button>
        </div>
      </div>
    </div>
  );
}


// ★ メインのページコンポーネント
export default function FloristDetailPage({ params }) {
  const { id } = params;
  const { user, userType } = useAuth(); // ★ ログイン情報を取得
  const [florist, setFlorist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchFlorist = async () => {
        try {
          const response = await fetch(`${API_URL}/api/florists/${id}`);
          if (!response.ok) throw new Error('お花屋さんが見つかりませんでした。');
          const data = await response.json();
          setFlorist(data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
      };
      fetchFlorist();
    }
  }, [id]);

  if (loading) return <div className="text-center mt-10">読み込み中...</div>;
  if (!florist) return <div className="text-center mt-10">お花屋さんが見つかりませんでした。</div>;

  return (
    <>
      <div className="min-h-screen bg-pink-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-pink-800 mb-2">{florist.shopName}</h1>
          <p className="text-lg text-gray-600 mb-6">担当者: {florist.contactName}</p>
          <div className="border-t my-6"></div>
          <div className="space-y-4">
            <p><span className="font-semibold">メール:</span> {florist.email}</p>
            {/* ... (他のプロフィール情報は変更なし) ... */}
          </div>
          <div className="border-t my-6"></div>
          
          {/* ★★★ ログイン状態に応じて表示を切り替える ★★★ */}
          <div className="text-center">
            {user && userType === 'USER' ? (
              <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105">
                このお花屋さんに企画をオファーする
              </button>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-700">企画をオファーするには、ファンとしてログインしてください。</p>
                <Link href="/login">
                  <span className="mt-2 inline-block text-blue-500 hover:underline">ログインページへ</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isModalOpen && <OfferModal floristId={id} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
