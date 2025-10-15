'use client';

import { useState } from 'react';

// ★ 1. APIの接続先をPythonバックエンドに変更
const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

// ★ offerは不要になったので削除
export default function ReviewModal({ project, user, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // formのsubmitイベントを受け取るように変更
    setIsSubmitting(true);

    // ★ 2. 認証情報(トークン)を取得
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('認証エラー。再度ログインしてください。');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ★ 認証情報をヘッダーに追加
        },
        body: JSON.stringify({
          rating: rating,
          comment: comment,
          project_id: project.id, // ★ 3. PythonのAPIに合わせてキーを修正
          // floristIdは不要なので削除
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'レビュー投稿に失敗しました。');
      }
      alert('レビューを投稿しました！ありがとうございました。');
      onReviewSubmitted();
      onClose();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">レビューを投稿</h2>
        <p className="text-gray-600 mb-6">企画「{project.title}」の評価をお願いします。</p>
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">評価 (5段階)</label>
            <div className="flex justify-center text-4xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="comment" className="block text-lg font-semibold text-gray-700">コメント (任意)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              className="w-full mt-2 p-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-0 transition"
              placeholder="企画の感想や、お花屋さんへの感謝の言葉など"
            ></textarea>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-5 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">閉じる</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2 font-bold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-gray-400">
            {isSubmitting ? '送信中...' : '投稿する'}
          </button>
        </div>
      </form>
    </div>
  );
}