'use client';

import { useState } from 'react';
import toast from 'react-hot-toast'; // Import toast

// ★ API_URL corrected
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★ user prop is needed for userId
export default function ReviewModal({ project, user, onClose, onReviewSubmitted }) { 
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsSubmitting(true);

    // ★★★ Corrected Authentication and Payload ★★★
    if (!user) { // Check if user is logged in
      toast.error('レビューを投稿するにはログインが必要です。');
      setIsSubmitting(false);
      return;
    }

    // Attempt to get floristId from the accepted offer within the project object
    // This assumes mypage/page.js fetches project data including the accepted offer
    const floristId = project?.offer?.floristId; 
    
    if (!floristId) {
        toast.error('レビュー対象のお花屋さんが見つかりません。企画に担当者が割り当てられているか確認してください。');
        setIsSubmitting(false);
        return;
    }


    const promise = fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Authorization header removed
      },
      body: JSON.stringify({
        rating: rating,
        comment: comment,
        projectId: project.id, // ★ Key corrected to camelCase
        floristId: floristId, // ★ Send derived floristId
        userId: user.id, // ★ Add userId from user prop
      }),
    }).then(async (res) => { // Added async for potential error parsing
        if (!res.ok) {
            let errorMsg = 'レビュー投稿に失敗しました。';
            try {
                const data = await res.json();
                errorMsg = data.message || errorMsg; // Use backend message if available
            } catch(e) { /* Ignore parsing error */ }
            // Handle specific "already reviewed" error
            if (res.status === 409) { 
               errorMsg = 'この企画には既にレビューを投稿済みです。';
            }
            throw new Error(errorMsg);
        }
        return res.json(); // Return success data
    });

    toast.promise(promise, {
        loading: '投稿中...',
        success: () => {
            onReviewSubmitted(); // Notify parent to refresh data
            onClose(); // Close the modal
            return 'レビューを投稿しました！ありがとうございました。';
        },
        error: (err) => err.message, // Display specific error message
        finally: () => {
            setIsSubmitting(false);
        }
    });
  };

  // --- JSX (Rating display logic improved) ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">レビューを投稿</h2>
        {/* Ensure project title exists */}
        <p className="text-gray-600 mb-6">企画「{project?.title || '不明な企画'}」の評価をお願いします。</p> 
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2 text-center">評価</label>
            <div className="flex justify-center text-4xl cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => {/* Optional: Add hover effect */}}
                  onMouseLeave={() => {/* Optional: Remove hover effect */}}
                  className={`transition-colors duration-150 ${rating >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                  aria-label={`Rate ${star} stars`}
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