'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext'; // ★ 認証情報を取得

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function VenueCard({ venue }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 relative">
      {/* ★ 公式バッジ */}
      {venue.isOfficial && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow z-10">
          公式
        </div>
      )}
      
      <div className="bg-gradient-to-br from-green-100 to-emerald-200 h-32 flex items-center justify-center">
        <span className="text-4xl">🏢</span>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors mb-2">{venue.venueName}</h3>
        <p className="text-sm text-gray-500 mb-2 truncate">{venue.address || '住所情報なし'}</p>
        
         {venue.regulations ? (
            <button
                onClick={() => toast(venue.regulations, { duration: 6000, icon: '📝' })} 
                className="mt-auto text-sm text-sky-600 hover:underline pt-2 text-left"
            >
                フラスタ規定を見る
            </button>
         ) : (
            <p className="mt-auto text-xs text-gray-400 pt-2">規定情報なし</p>
         )}
      </div>
    </div>
  );
}

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // ★ ログインユーザー確認用

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
        // toast.error(error.message); // 初回読み込みエラーはうるさいのでコンソールのみでも可
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
        <div className="relative w-full bg-green-50">
           <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
             <h1 className="text-3xl font-bold text-gray-900">会場一覧</h1>
             <p className="mt-2 text-gray-600">みんなで共有する、フラワースタンドの搬入規定データベース。</p>
             
             {/* ★ 登録ボタンを追加 */}
             <div className="mt-6">
               {user ? (
                 <Link href="/venues/add">
                   <span className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors cursor-pointer">
                     ➕ 新しい会場を登録する
                   </span>
                 </Link>
               ) : (
                 <p className="text-sm text-gray-500 mt-4">
                   会場情報を登録するには <Link href="/login" className="text-green-600 hover:underline">ログイン</Link> してください。
                 </p>
               )}
             </div>

           </div>
        </div>

        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {loading ? <p className="text-center text-gray-600">会場を読み込んでいます...</p> : (
            venues.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">現在登録されている会場はありません。</p>
                    {user && (
                        <Link href="/venues/add" className="text-green-600 hover:underline">
                            最初の会場を登録してみませんか？
                        </Link>
                    )}
                </div>
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