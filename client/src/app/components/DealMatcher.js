"use client";
import { useState, useEffect } from 'react';
import { FiGift, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

export default function DealMatcher({ keywords }) {
  const [matches, setMatches] = useState([]);

  // キーワードが変わるたびに検索 (デバウンス処理は省略)
  useEffect(() => {
    if (!keywords || keywords.length < 2) return;

    const search = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deals/search?keyword=${encodeURIComponent(keywords)}`);
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        }
      } catch (e) { console.error(e); }
    };
    
    // 1秒待ってから検索（連打防止）
    const timer = setTimeout(search, 1000);
    return () => clearTimeout(timer);
  }, [keywords]);

  if (matches.length === 0) return null;

  return (
    <div className="animate-fadeIn mt-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-red-500 text-white p-1.5 rounded-full">
          <FiGift className="text-lg" />
        </div>
        <h4 className="font-bold text-red-700">お得なマッチングが見つかりました！</h4>
      </div>
      
      <div className="space-y-3">
        {matches.map(deal => (
          <div key={deal.id} className="bg-white p-3 rounded-lg border border-red-100 flex justify-between items-center shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded">
                  {deal.discount}% OFF
                </span>
                <span className="font-bold text-gray-800">{deal.floristName}</span>
              </div>
              <p className="text-xs text-gray-600">{deal.message}</p>
            </div>
            <Link 
              href={`/florists`} 
              target="_blank"
              className="text-xs bg-red-500 text-white px-3 py-2 rounded-full font-bold hover:bg-red-600 flex items-center gap-1"
            >
              相談する <FiArrowRight />
            </Link>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-500 mt-2 text-right">
        ※「{keywords}」に関連する在庫ロスゼロ・キャンペーン
      </p>
    </div>
  );
}