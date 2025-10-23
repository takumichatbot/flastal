'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★ 会場カードのコンポーネント
function VenueCard({ venue }) {
  // 会場の詳細ページへのリンクは将来的に実装
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100">
      <div className="bg-gradient-to-br from-green-100 to-emerald-200 h-32 flex items-center justify-center">
        {/* 会場アイコンやイメージ */}
        <span className="text-4xl">🏢</span>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors mb-2">{venue.venueName}</h3>
        {/* 将来的に住所などを表示しても良い */}
        {/* <p className="text-sm text-gray-500">{venue.address || '住所未登録'}</p> */}
         {/* 規定表示へのリンク (モーダル表示など) */}
         {venue.regulations && (
            <button
                onClick={() => toast(venue.regulations, { duration: 10000 })} // toastで規定を表示（簡易的）
                className="mt-auto text-sm text-sky-600 hover:underline pt-2 text-left"
            >
                フラスタ規定を見る
            </button>
         )}
      </div>
    </div>
  );
}

// ★ 会場一覧ページの本体
export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/venues`);
        if (!response.ok) throw new Error('会場データの取得に失敗しました。');
        const data = await response.json();
        setVenues(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error(error.message);
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <main>
        {/* ヘッダーセクション */}
        <div className="relative w-full bg-green-50">
           <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
             <h1 className="text-3xl font-bold text-gray-900">会場一覧</h1>
             <p className="mt-2 text-gray-600">フラワースタンドの搬入規定などを確認できます。</p>
           </div>
        </div>
        {/* 会場グリッドセクション */}
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {loading ? <p className="text-center text-gray-600">会場を読み込んでいます...</p> : (
            venues.length === 0 ? (
                <p className="text-center text-gray-600">現在登録されている会場はありません。</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {venues.map((venue) => (
                    venue && venue.id ? <VenueCard key={venue.id} venue={venue} /> : null
                ))}
                </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}