'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';


export default function ReviewModal({ project, offer, user, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ★ 送信中の状態を管理

  const handleSubmit = async () => {
    setIsSubmitting(true); // ★ 送信開始
    try {
      // ★★★ ここが修正箇所です！宛先をバックエンドサーバーに修正 ★★★
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          projectId: project.id,
          floristId: offer.floristId,
          userId: user.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'レビュー投稿に失敗しました。');
      }
      alert('レビューを投稿しました！ありがとうございました。');
      onReviewSubmitted();
      onClose();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false); // ★ 送信完了
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-2">レビューを投稿</h2>
        <p className="text-gray-600 mb-6">企画「{project.title}」の評価をお願いします。</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">評価</label>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="text-3xl transition-transform transform hover:scale-125">
                  <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">コメント（任意）</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="4" className="w-full mt-1 p-2 text-gray-900 border border-gray-300 rounded-md"></textarea>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">閉じる</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-slate-400">
            {isSubmitting ? '送信中...' : '投稿する'}
          </button>
        </div>
      </div>
    </div>
  );
}