'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiMessageCircle, FiStar, FiUser, FiArrowRight } from 'react-icons/fi';
import { FaQuoteLeft } from 'react-icons/fa'; // 引用符用

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 星評価を表示するサブコンポーネント
const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-1 text-yellow-400 mb-3">
      {[...Array(5)].map((_, i) => (
        <FiStar 
          key={i} 
          className={i < rating ? "fill-current" : "text-gray-200 fill-gray-200"} 
        />
      ))}
    </div>
  );
};

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/reviews/featured`);
        if (res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data) ? data : []); 
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // ローディング表示 (スケルトン)
  if (loading) {
     return (
        <div className="bg-slate-50 py-24 sm:py-32">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16 space-y-4">
                    <div className="h-8 bg-slate-200 rounded-full w-64 mx-auto animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded w-96 mx-auto animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-64">
                            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                            <div className="space-y-2 mb-6">
                                <div className="h-3 bg-slate-200 rounded w-full"></div>
                                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                                <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                            </div>
                            <div className="flex items-center gap-3 mt-auto">
                                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
     );
  }

  // レビューがない場合は非表示
  if (reviews.length === 0) return null;

  return (
    <section className="bg-slate-50 py-24 sm:py-32 relative overflow-hidden">
      
      {/* 背景装飾 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-pink-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-sky-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="text-pink-500 font-bold tracking-wider uppercase text-sm">Voices</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            実際に想いを届けた<br className="md:hidden"/>主催者の声
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            FLASTALを利用して、推しにフラワースタンドを贈った方々の感想です。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => {
            if (!review || !review.id || !review.user || !review.project) return null;

            return (
              <div 
                key={review.id} 
                className="flex flex-col h-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group"
              >
                {/* 引用アイコン */}
                <div className="absolute top-6 right-6 text-slate-100 group-hover:text-pink-50 transition-colors">
                    <FaQuoteLeft size={40} />
                </div>

                {/* 評価スター */}
                <StarRating rating={review.rating || 5} />

                {/* コメント本文 */}
                <blockquote className="flex-grow">
                  <p className="text-slate-600 leading-relaxed relative z-10 text-sm">
                    {review.comment || '（コメントなし）'}
                  </p>
                </blockquote>

                {/* ユーザー情報 & 企画リンク */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                        {review.user.iconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={review.user.iconUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <FiUser />
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{review.user.handleName || '匿名ユーザー'}</p>
                            <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()} 投稿</p>
                        </div>
                    </div>

                    <Link 
                        href={`/projects/${review.project.id}`}
                        className="inline-flex items-center text-xs font-bold text-sky-500 hover:text-sky-600 hover:underline transition-colors group/link"
                    >
                        企画: {review.project.title}
                        <FiArrowRight className="ml-1 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}