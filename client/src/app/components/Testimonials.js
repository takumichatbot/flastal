'use client';
import { useState, useEffect } from 'react';

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/reviews/featured');
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // 表示するレビューがない場合は、このセクション自体を表示しない
  if (loading || reviews.length === 0) {
    return null;
  }

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">実際に想いを届けた主催者の声</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="text-center p-8 bg-slate-50 rounded-2xl shadow-sm">
              <p className="text-gray-600 italic">「{review.comment}」</p>
              <p className="mt-6 font-semibold text-gray-800">- {review.user.handleName}さん</p>
              <p className="text-sm text-gray-500">（{review.project.title}）</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}