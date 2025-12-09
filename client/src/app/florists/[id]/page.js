'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast'; 
import { FiCamera, FiUser } from 'react-icons/fi'; // FiCamera, FiUser 追加

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★ オファー用のモーダルコンポーネント (既存ロジックは省略)
function OfferModal({ floristId, onClose }) { /* ... */ return null; }


// ★ メインのページコンポーネント
export default function FloristDetailPage({ params }) {
  const { id } = params;
  const { user } = useAuth(); 
  const [florist, setFlorist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // ★修正箇所 1: 投稿データを保持する state を追加
  const [appealPosts, setAppealPosts] = useState([]); 

  useEffect(() => {
    if (id) {
      const fetchFlorist = async () => {
        setLoading(true);
        try {
          // ★修正箇所 2: データの並列取得（フローリスト情報とアピール投稿）
          const [floristRes, postsRes] = await Promise.all([
            fetch(`${API_URL}/api/florists/${id}`),
            // 💡 お花屋さんIDをダミーのprojectIdとして投稿を取得
            fetch(`${API_URL}/api/projects/${id}/posts`), 
          ]);

          if (!floristRes.ok) throw new Error('お花屋さんが見つかりませんでした。');
          
          const floristData = await floristRes.json();
          const postsData = postsRes.ok ? await postsRes.json() : [];

           // Convert nulls to empty strings for display
          Object.keys(floristData).forEach(key => {
            if (key === 'portfolioImages' && floristData[key] === null) {
                floristData[key] = [];
            } else if (floristData[key] === null) {
                 floristData[key] = '';
            }
          });
          
          setFlorist(floristData);
          // ★修正箇所 3: FLORIST_APPEAL のみフィルタしてセット
          setAppealPosts(postsData.filter(p => p.postType === 'FLORIST_APPEAL')); 

        } catch (error) {
            console.error(error);
            toast.error(error.message); 
        } finally {
            setLoading(false);
        }
      };
      fetchFlorist();
    } else {
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

          {/* ★★★ ポートフォリオ画像ギャラリー ★★★ */}
          {florist.portfolioImages && florist.portfolioImages.length > 0 && (
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">制作事例</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {florist.portfolioImages.map((url, index) => (
                        <div key={index}>
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
                 {florist.businessHours && <p><span className="font-semibold w-24 inline-block align-top">営業時間:</span> <span className="whitespace-pre-wrap inline-block ml-2">{florist.businessHours}</span></p>}
             </div>
          </div>

          {florist.portfolio && (
            <div className="border-t pt-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">自己紹介・メッセージ</h2>
                <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{florist.portfolio}</p>
            </div>
          )}

          {/* ★★★ 修正箇所 4: 制作アピール投稿一覧の表示 ★★★ */}
          {appealPosts.length > 0 && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8 mt-8 border-t">
                <h2 className="text-2xl font-bold text-pink-800 mb-6 flex items-center">
                    <FiCamera className="mr-2"/> 制作アピール・裏側ギャラリー
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {appealPosts.map(post => (
                        <div key={post.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-hidden">
                            {/* 画像URLを content から抽出 (簡易版) */}
                            {post.content.match(/\[Image:\s*(.*?)\]/) && (
                                <div className="aspect-[4/3] bg-gray-200">
                                    <img 
                                        src={post.content.match(/\[Image:\s*(.*?)\]/)[1]} 
                                        alt="アピール写真" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            )}
                            <div className="p-0 mt-3">
                                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString('ja-JP')}</p>
                                {/* 画像URL部分を除去して表示 */}
                                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap line-clamp-4">
                                    {post.content.replace(/ \[Image:\s*.*?\]/, '')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          <div className="text-center border-t pt-8">
            {user ? ( 
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