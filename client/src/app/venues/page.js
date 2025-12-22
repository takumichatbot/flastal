'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext'; // パスは環境に合わせて調整
import { 
  FiMapPin, FiCheckCircle, FiXCircle, FiSearch, FiPlus, 
  FiAlertCircle, FiDatabase, FiTruck, FiX 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// スケルトンローディング用コンポーネント
const VenueSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col animate-pulse">
    <div className="h-32 bg-gray-200" />
    <div className="p-5 space-y-3 flex-1">
      <div className="flex justify-between">
         <div className="h-6 bg-gray-200 rounded w-2/3" />
         <div className="h-6 bg-gray-200 rounded w-10" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="pt-4 mt-auto flex gap-2">
         <div className="h-5 bg-gray-200 rounded w-16" />
         <div className="h-5 bg-gray-200 rounded w-16" />
      </div>
    </div>
  </div>
);

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  // 検索フィルタリング
  const filteredVenues = venues.filter(v => 
    (v.venueName && v.venueName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (v.address && v.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-gray-800">
      <main>
        {/* 1. ヒーローセクション */}
        <div className="relative bg-gradient-to-br from-teal-600 to-emerald-600 text-white overflow-hidden">
           {/* 背景装飾 */}
           <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
           <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>

           <div className="relative max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center z-10">
             <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 mb-6">
                <FiDatabase className="text-emerald-300"/>
                <span className="text-sm font-bold tracking-wider">VENUE DATABASE</span>
             </div>
             
             <h1 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
               搬入・レギュレーションを、<br className="sm:hidden" />もっと身近に。
             </h1>
             <p className="text-emerald-100 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
               全国のイベント会場のフラスタ受入状況や搬入情報を共有。<br/>
               過去の事例を確認して、安心して企画を立てましょう。
             </p>
             
             {/* 検索バー */}
             <div className="relative max-w-xl mx-auto mb-10">
                <div className="relative group">
                    <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-focus-within:text-emerald-500 transition-colors"/>
                    <input 
                        type="text"
                        placeholder="会場名や住所で検索 (例: 東京ドーム)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-12 py-4 rounded-2xl border-0 shadow-xl text-gray-800 placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <FiX size={18} />
                        </button>
                    )}
                </div>
             </div>

             {/* 登録アクション */}
             <div className="flex justify-center">
               {user ? (
                 <Link href="/venues/add">
                   <span className="inline-flex items-center px-8 py-3.5 text-sm font-bold rounded-full shadow-lg text-emerald-700 bg-white hover:bg-emerald-50 transition-all cursor-pointer transform hover:-translate-y-1 hover:shadow-xl">
                     <FiPlus className="mr-2 text-lg"/> 新しい会場情報を登録する
                   </span>
                 </Link>
               ) : (
                 <p className="text-sm text-emerald-100 bg-black/20 px-6 py-2 rounded-full inline-block backdrop-blur-sm">
                   会場情報の追加・編集には <Link href="/login" className="text-white font-bold hover:underline underline-offset-4">ログイン</Link> が必要です
                 </p>
               )}
             </div>
           </div>
        </div>

        {/* 2. リストエリア */}
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
            
          <div className="flex items-center justify-between mb-6 px-2">
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiMapPin className="text-emerald-500"/> 
                {loading ? '読み込み中...' : `登録会場一覧 (${filteredVenues.length})`}
             </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <VenueSkeleton key={i} />)}
            </div>
          ) : (
            filteredVenues.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiSearch className="text-3xl text-gray-300"/>
                    </div>
                    <p className="text-gray-500 mb-2 font-bold text-lg">条件に合う会場が見つかりませんでした。</p>
                    <p className="text-sm text-gray-400 mb-6">キーワードを変えて検索するか、新しい会場を登録してください。</p>
                    {user && (
                        <Link href="/venues/add" className="text-emerald-600 font-bold hover:underline underline-offset-4 flex items-center justify-center gap-1">
                            <FiPlus /> あなたが最初の情報を登録する
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
                {filteredVenues.map((venue) => (
                    <Link key={venue.id} href={`/venues/${venue.id}`} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col relative">
                        
                        {/* サムネイル（画像がないのでグラデーション + アイコン） */}
                        <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative overflow-hidden group-hover:from-emerald-50 group-hover:to-teal-50 transition-colors">
                            <span className="text-5xl opacity-20 group-hover:scale-110 transition-transform duration-500">🏟</span>
                            
                            {/* 公式バッジ */}
                            {venue.isOfficial && (
                                <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10 border border-white/20">
                                    OFFICIAL
                                </div>
                            )}

                            {/* ステータスバッジ (右上) */}
                            <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                {venue.isStandAllowed === false ? (
                                    <span className="bg-white/90 backdrop-blur text-red-600 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm flex items-center border border-red-100">
                                        <FiXCircle className="mr-1"/> スタンドNG
                                    </span>
                                ) : (
                                    <span className="bg-white/90 backdrop-blur text-emerald-600 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm flex items-center border border-emerald-100">
                                        <FiCheckCircle className="mr-1"/> スタンドOK
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors line-clamp-1 text-lg mb-1">
                                {venue.venueName}
                            </h3>
                            
                            <p className="text-xs text-gray-500 mb-4 flex items-center line-clamp-1">
                                <FiMapPin className="mr-1 shrink-0 text-gray-400"/> {venue.address || '住所情報なし'}
                            </p>
                            
                            <div className="mt-auto pt-3 border-t border-gray-50 flex flex-wrap gap-2">
                                {/* タグ情報 */}
                                {venue.retrievalRequired ? (
                                    <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 whitespace-nowrap font-bold flex items-center">
                                        <FiTruck className="mr-1"/> 回収必須
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">
                                        回収要確認
                                    </span>
                                )}

                                {venue.isBowlAllowed && (
                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 whitespace-nowrap font-bold">
                                        楽屋花OK
                                    </span>
                                )}
                                {!venue.isBowlAllowed && venue.isBowlAllowed !== null && (
                                     <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">
                                        楽屋花NG
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