'use client';
import { useState, useEffect } from 'react';

// ★ API_URL corrected
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true); // Set loading true
      try {
        const res = await fetch(`${API_URL}/api/reviews/featured`);
        if (res.ok) {
          const data = await res.json();
          // Ensure data is an array
          setReviews(Array.isArray(data) ? data : []); 
        } else {
            console.error("Failed to fetch testimonials, status:", res.status);
            setReviews([]); // Set empty on error
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
         setReviews([]); // Set empty on error
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Show loading indicator
  if (loading) {
     return (
        <div className="bg-white py-24 sm:py-32">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    {/* Skeleton for title */}
                    <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto animate-pulse"></div>
                </div>
                 {/* Skeleton for reviews */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="text-center p-8 bg-slate-100 rounded-2xl shadow-sm space-y-4">
                            <div className="h-4 bg-slate-200 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 rounded w-5/6 mx-auto"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/3 mx-auto mt-6"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
     );
  }

  // Don't render the section if no reviews are available
  if (reviews.length === 0) {
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
            // Ensure review structure is correct (user.handleName, project.title)
            review && review.id && review.user && review.project ? (
              <div key={review.id} className="text-center p-8 bg-slate-50 rounded-2xl shadow-sm transition-shadow hover:shadow-md">
                <p className="text-gray-600 italic">「{review.comment || 'コメントなし'}」</p> 
                <p className="mt-6 font-semibold text-gray-800">- {review.user.handleName || '匿名'}さん</p>
                <p className="text-sm text-gray-500">（{review.project.title || '不明な企画'}）</p>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
}