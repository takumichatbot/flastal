'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StarRating from '../components/StarRating'; // ★ 以前作成した星評価コンポーネントを再利用

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ★★★ お花屋さんカードの部品をここに定義 ★★★
function FloristCard({ florist }) {
  return (
    <Link href={`/florists/${florist.id}`}>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className="bg-gradient-to-br from-pink-100 to-rose-200 h-32 flex items-center justify-center">
          {/* 将来的にここにお花屋さんのロゴやイメージ画像を表示 */}
          <span className="text-4xl">💐</span>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors mb-2">{florist.shopName}</h3>
          <p className="text-sm text-gray-600 mb-4">担当者: {florist.contactName}</p>
          <div className="mt-auto flex items-center gap-2">
            {florist.reviewCount > 0 ? (
              <>
                <StarRating rating={florist.averageRating} />
                <span className="text-xs text-gray-500">({florist.reviewCount}件)</span>
              </>
            ) : (
              <span className="text-xs text-gray-500">レビューはまだありません</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ★★★ お花屋さん一覧ページの本体 ★★★
export default function FloristsPage() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlorists = async () => {
      try {
        const response = await fetch(`${API_URL}/api/florists`);
        if (!response.ok) throw new Error('データの取得に失敗しました。');
        const data = await response.json();
        setFlorists(data);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchFlorists();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <main>
        <div className="relative w-full bg-pink-50">
           <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
             <h1 className="text-3xl font-bold text-gray-900">お花屋さんを探す</h1>
             <p className="mt-2 text-gray-600">あなたの想いを形にしてくれる、素敵なお花屋さんを見つけましょう。</p>
           </div>
        </div>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {loading ? <p className="text-center">読み込み中...</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {florists.map((florist) => (
                <FloristCard key={florist.id} florist={florist} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}