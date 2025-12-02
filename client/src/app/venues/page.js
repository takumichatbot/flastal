'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
// ★ アイコンを追加
import { FiMapPin, FiCheckCircle, FiXCircle, FiSearch, FiPlus } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // ★ 検索用state
  const { user } = useAuth();

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
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  // ★ 検索フィルタリング処理
  const filteredVenues = venues.filter(v => 
    (v.venueName && v.venueName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (v.address && v.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      <main>
        {/* ヘッダーエリア */}
        <div className="relative w-full bg-white border-b border-gray-200">
           <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
             <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">🏟 会場から探す</h1>
             <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
               過去の事例やレギュレーションを確認して、安心して企画を立てましょう。<br/>
               みんなでつくる、フラスタ搬入規定データベース。
             </p>
             
             {/* ★ 検索バー */}
             <div className="relative max-w-lg mx-auto mb-8">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"/>
                <input 
                    type="text"
                    placeholder="会場名や住所で検索 (例: 東京ドーム)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all text-gray-800"
                />
             </div>

             {/* 登録ボタン */}
             <div>
               {user ? (
                 <Link href="/venues/add">
                   <span className="inline-flex items-center px-6 py-3 text-sm font-bold rounded-full shadow-md text-white bg-green-600 hover:bg-green-700 transition-colors cursor-pointer hover:-translate-y-0.5 transform">
                     <FiPlus className="mr-2"/> 新しい会場情報を登録する
                   </span>
                 </Link>
               ) : (
                 <p className="text-xs text-gray-400 mt-4">
                   新しい会場を知っていますか？ <Link href="/login" className="text-green-600 hover:underline">ログイン</Link> して情報をシェアしましょう。
                 </p>
               )}
             </div>

           </div>
        </div>

        {/* リストエリア */}
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center text-gray-500 py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
                読み込み中...
            </div>
          ) : (
            filteredVenues.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4 font-bold">条件に合う会場が見つかりませんでした。</p>
                    {user && (
                        <Link href="/venues/add" className="text-green-600 hover:underline">
                            あなたが最初の情報を登録しませんか？
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
                {filteredVenues.map((venue) => (
                    <Link key={venue.id} href={`/venues/${venue.id}`} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col">
                        {/* サムネイル（画像がないのでグラデーション） */}
                        <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                            <span className="text-4xl opacity-50">🏟</span>
                            {/* 公式バッジ */}
                            {venue.isOfficial && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10">
                                    公式情報あり
                                </div>
                            )}
                        </div>

                        <div className="p-5 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-800 group-hover:text-sky-600 transition-colors line-clamp-2 text-lg">
                                    {venue.venueName}
                                </h3>
                                {/* OK/NG バッジ */}
                                {venue.isStandAllowed === false ? (
                                    <span className="shrink-0 bg-red-50 text-red-600 text-xs px-2 py-1 rounded font-bold flex items-center border border-red-100 ml-2">
                                        <FiXCircle className="mr-1"/> NG
                                    </span>
                                ) : (
                                    <span className="shrink-0 bg-green-50 text-green-600 text-xs px-2 py-1 rounded font-bold flex items-center border border-green-100 ml-2">
                                        <FiCheckCircle className="mr-1"/> OK
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 mb-4 flex items-center line-clamp-1">
                                <FiMapPin className="mr-1 shrink-0"/> {venue.address || '住所情報なし'}
                            </p>
                            
                            <div className="mt-auto pt-3 border-t border-gray-50 flex gap-2 overflow-hidden">
                                {venue.retrievalRequired && (
                                    <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 whitespace-nowrap">
                                        回収必須
                                    </span>
                                )}
                                {venue.isBowlAllowed && (
                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 whitespace-nowrap">
                                        楽屋花OK
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
                </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}