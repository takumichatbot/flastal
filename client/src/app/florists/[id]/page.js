'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast'; // toast をインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★ オファー用のモーダルコンポーネント (修正版)
function OfferModal({ floristId, onClose }) {
  const { user } = useAuth(); // userTypeは不要
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    // user が存在する場合のみ企画を取得
    if (user && user.id) {
      const fetchUserProjects = async () => {
        setLoadingProjects(true);
        try {
          // ★★★ 1. 新しいAPIエンドポイントを呼び出す ★★★
          const res = await fetch(`${API_URL}/api/users/${user.id}/offerable-projects`);

          if (!res.ok) throw new Error('オファー可能な企画の取得に失敗しました。');
          const data = await res.json();

          // データが配列であることを確認
          const validProjects = Array.isArray(data) ? data : [];
          setProjects(validProjects);

          if (validProjects.length === 0) {
            // alertの代わりにtoastを使う
            toast.error('現在オファーに出せる企画がありません。');
          }
        } catch (error) {
          toast.error(error.message);
          setProjects([]); // エラー時は空にする
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchUserProjects();
    } else {
      setLoadingProjects(false); // ログインしていない場合はローディング終了
    }
  }, [user]);

  const handleOfferSubmit = async () => {
    if (!selectedProjectId) {
      toast.error('オファーする企画を選択してください。');
      return;
    }

    // ★★★ 2. toast.promiseを使ってAPIを呼び出す ★★★
    const promise = fetch(`${API_URL}/api/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: selectedProjectId,
        floristId: floristId,
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'オファーの送信に失敗しました。');
      return data;
    });

    toast.promise(promise, {
      loading: 'オファーを送信中...',
      success: () => {
        onClose();
        return 'オファーを送信しました！お花屋さんからの連絡をお待ちください。';
      },
      error: (err) => err.message, // 「既にオファー済みです」などのエラーも表示
    });
  };

  // --- JSX ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">企画をオファーする</h2>
        <div className="space-y-4">
          {loadingProjects ? <p className="text-gray-600">あなたの企画を読み込み中...</p> :
           projects.length === 0 ? <p className="text-red-600">オファー可能な企画がありません。</p> : (
            <div>
              <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-1">オファーする企画を選択</label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
                required
              >
                <option value="">-- 企画を選択 --</option>
                {/* projectデータが存在することを確認 */}
                {projects.map(p => p && p.id && p.title ? <option key={p.id} value={p.id}>{p.title} ({p.status === 'FUNDRAISING' ? '募集中' : '達成済'})</option> : null)}
              </select>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">キャンセル</button>
          <button
            onClick={handleOfferSubmit}
            className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loadingProjects || projects.length === 0 || !selectedProjectId}
          >
            オファーを送信
          </button>
        </div>
      </div>
    </div>
  );
}


// ★ メインのページコンポーネント
export default function FloristDetailPage({ params }) {
  const { id } = params;
  const { user } = useAuth(); // ログイン情報を取得
  const [florist, setFlorist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchFlorist = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/florists/${id}`);
          if (!response.ok) throw new Error('お花屋さんが見つかりませんでした。');
          const data = await response.json();
           // Convert nulls to empty strings for display
          Object.keys(data).forEach(key => {
            // portfolioImages は配列なので null -> [] にする
            if (key === 'portfolioImages' && data[key] === null) {
                data[key] = [];
            } else if (data[key] === null) {
                 data[key] = '';
            }
          });
          setFlorist(data);
        } catch (error) {
            console.error(error);
            toast.error(error.message); // Show error to user
        } finally {
            setLoading(false);
        }
      };
      fetchFlorist();
    } else {
        // id がない場合はローディングを終了し、エラー表示
        setLoading(false);
        toast.error("お花屋さんのIDが見つかりません。");
    }
  }, [id]);

   if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-pink-50">
              <p>読み込み中...</p>
          </div>
      );
  }
  if (!florist) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-pink-50">
              <p className="text-red-600">お花屋さんが見つかりませんでした。</p>
          </div>
      );
  }

  // Calculate average rating and count (if reviews exist)
  const reviews = florist.reviews || [];
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;

  return (
    <>
      <div className="min-h-screen bg-pink-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          {/* Display platformName (public name) */}
          <h1 className="text-4xl font-bold text-pink-800 mb-2">{florist.platformName}</h1>
          <p className="text-lg text-gray-600 mb-6">担当者: {florist.contactName}</p>

          {/* Display Rating */}
           <div className="flex items-center gap-2 mb-6">
            {reviewCount > 0 ? (
              <>
                {/* Assuming StarRating component exists */}
                {/* <StarRating rating={averageRating} /> */}
                <span className="font-semibold text-yellow-500">{averageRating.toFixed(1)} ★</span>
                <span className="text-sm text-gray-500">({reviewCount}件のレビュー)</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">レビューはまだありません</span>
            )}
          </div>

          {/* ★★★【新規】ポートフォリオ画像ギャラリー ★★★ */}
          {florist.portfolioImages && florist.portfolioImages.length > 0 && (
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">制作事例</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {florist.portfolioImages.map((url, index) => (
                        <div key={index}>
                            {/* 画像クリックで拡大表示する機能を追加しても良い */}
                            <img src={url} alt={`制作事例 ${index+1}`} className="w-full h-48 object-cover rounded-lg shadow-md aspect-square" />
                        </div>
                    ))}
                </div>
            </div>
          )}

          <div className="border-t pt-6 mb-6">
             <h2 className="text-xl font-semibold text-gray-700 mb-4">店舗情報</h2>
             <div className="space-y-3 text-gray-800">
                {florist.address && <p><span className="font-semibold w-24 inline-block">住所:</span> {florist.address}</p>}
                {florist.phoneNumber && <p><span className="font-semibold w-24 inline-block">電話番号:</span> {florist.phoneNumber}</p>}
                {florist.website &&
                    <p><span className="font-semibold w-24 inline-block">Webサイト:</span>
                        <a href={florist.website.startsWith('http') ? florist.website : `https://${florist.website}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline ml-2 break-all">
                            {florist.website}
                        </a>
                    </p>
                }
                 {/* ★★★【新規】営業時間 ★★★ */}
                {florist.businessHours && <p><span className="font-semibold w-24 inline-block align-top">営業時間:</span> <span className="whitespace-pre-wrap inline-block ml-2">{florist.businessHours}</span></p>}
             </div>
          </div>

          {florist.portfolio && (
            <div className="border-t pt-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">自己紹介・メッセージ</h2>
                <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{florist.portfolio}</p>
            </div>
          )}

          <div className="text-center border-t pt-8">
            {user ? ( // Check if ANY user is logged in
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 shadow-md"
              >
                このお花屋さんに企画をオファーする
              </button>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg inline-block">
                <p className="text-gray-700">企画をオファーするには、ログインしてください。</p>
                <Link href="/login">
                  <span className="mt-2 inline-block text-blue-500 hover:underline font-semibold">ログインページへ</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8 mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">レビュー ({reviewCount}件)</h2>
                <div className="space-y-6">
                    {reviews.map(review => (
                        review && review.id && review.user && review.project ? ( // Add checks
                            <div key={review.id} className="border-b pb-4 last:border-b-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-700">{review.user.handleName || '匿名'}</span>
                                    <span className="font-semibold text-yellow-500">{review.rating} ★</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">
                                    企画名: <Link href={`/projects/${review.project.id}`}><span className="text-sky-600 hover:underline">{review.project.title || '不明な企画'}</span></Link>
                                </p>
                                {review.comment && <p className="text-gray-800 bg-gray-50 p-3 rounded">{review.comment}</p>}
                                <p className="text-xs text-gray-400 text-right mt-1">{new Date(review.createdAt).toLocaleDateString('ja-JP')}</p>
                            </div>
                         ) : null
                    ))}
                </div>
            </div>
        )}

      </div>

      {isModalOpen && <OfferModal floristId={id} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}