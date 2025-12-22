'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiStar, FiX, FiMessageSquare, FiUser, FiCheck } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa'; // 塗りつぶしの星用

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 評価のラベル定義
const RATING_LABELS = {
  1: '不満',
  2: '少し不満',
  3: '普通',
  4: '満足',
  5: '最高！'
};

// クイックタグ（タップでコメントに追加）
const QUICK_TAGS = [
  'お花がとても可愛かった！',
  '対応が丁寧でした',
  '期待以上の仕上がり',
  'またお願いしたいです',
  'レスポンスが早くて安心',
  '梱包が丁寧でした'
];

export default function ReviewModal({ project, user, onClose, onReviewSubmitted }) { 
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0); // ホバー中の星の状態
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // マウントアニメーション用
  useEffect(() => setMounted(true), []);

  // 担当フローリスト情報の取得（安全にアクセス）
  const florist = project?.offer?.florist || {};
  const floristName = florist.storeName || florist.handleName || '担当のお花屋さん';

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    if (!user) {
      toast.error('レビューを投稿するにはログインが必要です。');
      return;
    }

    const floristId = project?.offer?.floristId; 
    if (!floristId) {
        toast.error('レビュー対象のお花屋さんが特定できませんでした。');
        return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('レビューを送信中...');

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // セキュリティのためトークンも付与推奨
        },
        body: JSON.stringify({
          rating: rating,
          comment: comment,
          projectId: project.id,
          floristId: floristId,
          userId: user.id,
        }),
      });

      if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // 既に投稿済みの場合などのエラーハンドリング
          if (res.status === 409) throw new Error('この企画には既にレビューを投稿済みです。');
          throw new Error(data.message || 'レビュー投稿に失敗しました。');
      }

      toast.success('レビューを投稿しました！ありがとうございました。', { id: toastId });
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();

    } catch (error) {
      console.error(error);
      toast.error(error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // タグをクリックした時の処理
  const handleTagClick = (tag) => {
    if (!comment.includes(tag)) {
        setComment(prev => prev ? `${prev}\n${tag}` : tag);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景オーバーレイ */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className={`bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative z-10 transition-all duration-300 transform ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <FiMessageSquare /> レビューを書く
                </h2>
                <p className="text-pink-100 text-sm mt-1">企画「{project?.title}」の感想を教えてください</p>
            </div>
            <button 
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
            >
                <FiX size={20}/>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
            
            {/* 1. レビュー対象 */}
            <div className="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-lg">
                    {florist.iconUrl ? <img src={florist.iconUrl} className="w-full h-full rounded-full object-cover"/> : <FiUser />}
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold">担当フローリスト</p>
                    <p className="font-bold text-gray-800">{floristName}</p>
                </div>
            </div>

            {/* 2. スター評価 */}
            <div className="mb-8 text-center">
                <p className="text-sm font-bold text-gray-500 mb-2">満足度はいかがでしたか？</p>
                <div className="flex justify-center gap-2 text-4xl mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                    >
                        {/* ホバー中 または 確定済みなら色をつける */}
                        {(hoverRating || rating) >= star ? (
                            <FaStar className="text-yellow-400 drop-shadow-sm" />
                        ) : (
                            <FiStar className="text-gray-300" />
                        )}
                    </button>
                    ))}
                </div>
                <p className="text-pink-500 font-bold h-6 transition-all">
                    {RATING_LABELS[hoverRating || rating]}
                </p>
            </div>

            {/* 3. コメント入力 */}
            <div className="mb-6">
                <label htmlFor="comment" className="block text-sm font-bold text-gray-700 mb-2">コメント (任意)</label>
                
                {/* クイックタグ */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {QUICK_TAGS.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagClick(tag)}
                            className="text-xs border border-gray-200 bg-gray-50 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600 px-3 py-1.5 rounded-full transition-colors"
                        >
                            + {tag}
                        </button>
                    ))}
                </div>

                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all resize-none text-sm"
                    placeholder="お花がとても綺麗で感動しました！また機会があればお願いしたいです。"
                ></textarea>
            </div>

            {/* 4. アクションボタン */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                >
                    キャンセル
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="px-8 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>送信中...</>
                    ) : (
                        <><FiCheck /> 投稿する</>
                    )}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}