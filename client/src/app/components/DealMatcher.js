"use client";
import { useState, useEffect } from 'react';
import { FiGift, FiArrowRight, FiX, FiTag } from 'react-icons/fi';
import Link from 'next/link';

export default function DealMatcher({ keywords }) {
  const [matches, setMatches] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keywords || keywords.length < 2) {
        setMatches([]);
        return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deals/search?keyword=${encodeURIComponent(keywords)}`);
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
          if (data.length > 0) setIsVisible(true);
        }
      } catch (e) { 
          console.error(e); 
      } finally {
          setLoading(false);
      }
    };
    
    // 1秒間のデバウンス
    const timer = setTimeout(search, 1000);
    return () => clearTimeout(timer);
  }, [keywords]);

  if (!isVisible || matches.length === 0) return null;

  return (
    <div className="animate-slideUp mt-6 relative overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-5 shadow-lg ring-1 ring-rose-100">
      
      {/* 背景装飾 */}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-rose-500">
          <FiGift size={80} />
      </div>

      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
            <span className="bg-rose-500 text-white p-1.5 rounded-lg shadow-sm">
                <FiTag className="text-lg" />
            </span>
            <div>
                <h4 className="font-bold text-rose-800 text-sm md:text-base">
                    「{keywords}」に関連するお得なオファー
                </h4>
                <p className="text-[10px] text-rose-600 font-medium">
                    お花屋さんの在庫ロス削減キャンペーンなどがヒットしました
                </p>
            </div>
        </div>
        <button 
            onClick={() => setIsVisible(false)}
            className="text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-full p-1 transition-colors"
        >
            <FiX size={18} />
        </button>
      </div>
      
      {/* リスト */}
      <div className="space-y-3 relative z-10">
        {matches.map((deal) => (
          <div key={deal.id} className="group bg-white rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row overflow-hidden">
            
            {/* 左側: 割引率 */}
            <div className="bg-rose-500 text-white p-3 flex flex-col items-center justify-center min-w-[80px] sm:min-w-[100px]">
                <span className="text-xs font-bold opacity-90">OFF</span>
                <span className="text-2xl font-black leading-none">{deal.discount}%</span>
            </div>

            {/* 右側: 情報 & ボタン */}
            <div className="p-3 flex-grow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold text-gray-400 mb-0.5">{deal.floristName}</p>
                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{deal.message}</p>
                </div>
                
                <Link 
                  href={`/florists?dealId=${deal.id}`} 
                  target="_blank"
                  className="w-full sm:w-auto text-center text-xs bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-1 group-hover:scale-105 transform duration-200"
                >
                  詳細を見る <FiArrowRight />
                </Link>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
            animation: slideUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}