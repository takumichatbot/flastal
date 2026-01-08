'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; 
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiSearch, FiMapPin, FiCheckCircle, FiLoader, FiPlus, FiTrash2, FiShield, FiFilter } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

function VenuesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authenticatedFetch, isLoading: authLoading } = useAuth();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [prefecture, setPrefecture] = useState(searchParams.get('prefecture') || '');

  const fetchVenues = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const isAdmin = user?.role === 'ADMIN';
      const endpoint = isAdmin ? `${API_URL}/api/venues/admin` : `${API_URL}/api/venues`;
      const res = await authenticatedFetch(endpoint);
      
      if (res && res.ok) {
        const data = await res.json();
        setVenues(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('会場データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user, authenticatedFetch, authLoading]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (keyword.trim()) params.set('keyword', keyword);
    else params.delete('keyword');
    if (prefecture) params.set('prefecture', prefecture);
    else params.delete('prefecture');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('この会場情報を削除しますか？')) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/api/venues/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('削除しました');
        fetchVenues();
      }
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const filteredVenues = venues.filter(v => {
    const matchesKeyword = v.venueName.toLowerCase().includes(keyword.toLowerCase()) || 
                          (v.address && v.address.toLowerCase().includes(keyword.toLowerCase()));
    const matchesPrefecture = !prefecture || (v.address && v.address.includes(prefecture));
    return matchesKeyword && matchesPrefecture;
  });

  return (
    <div className="bg-slate-50 min-h-screen py-10 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">会場・施設を探す</h1>
            <p className="text-gray-500 text-sm">推しへ想いを届けるための全国の会場データベース</p>
          </div>
          <Link href="/venues/add">
            <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
              <FiPlus className="mr-2"/> 会場情報を教える
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-10">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">キーワード</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="会場名、建物名など..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">エリア</label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <select
                  value={prefecture}
                  onChange={(e) => setPrefecture(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none appearance-none cursor-pointer transition-all"
                >
                  <option value="">すべてのエリア</option>
                  {PREFECTURES.map(pref => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <FiFilter size={12} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <button 
                type="submit" 
                className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-md flex items-center justify-center"
              >
                検索
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-white rounded-2xl h-80 shadow-sm border border-gray-100 animate-pulse">
                     <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                     <div className="p-5 space-y-3">
                         <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                         <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                     </div>
                 </div>
             ))}
          </div>
        ) : filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVenues.map((venue) => (
              <Link key={venue.id} href={`/venues/${venue.id}`} className="group h-full block">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col relative">
                  <div className="relative h-44 bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center">
                    <span className="text-6xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-500">🏛️</span>
                    <div className="absolute top-3 right-3">
                        {venue.isOfficial ? (
                            <span className="bg-sky-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <FiShield size={10}/> OFFICIAL
                            </span>
                        ) : (
                            <span className="bg-white/90 backdrop-blur text-amber-500 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">USER SUBMITTED</span>
                        )}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2 mb-3 leading-snug">
                        {venue.venueName}
                    </h2>
                    <div className="space-y-2 mb-4">
                        <p className="text-xs text-gray-500 flex items-start">
                            <FiMapPin className="mr-1.5 text-indigo-400 shrink-0 mt-0.5"/> 
                            <span className="line-clamp-2">{venue.address || '所在地情報なし'}</span>
                        </p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {venue.isStandAllowed ? (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1"><FiCheckCircle/> 許可実績あり</span>
                            ) : (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">要詳細確認</span>
                            )}
                        </div>
                        {user?.role === 'ADMIN' && (
                            <button onClick={(e) => handleDelete(e, venue.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                <FiTrash2 size={14}/>
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center">
            <p className="text-gray-400 font-bold">該当する会場が見つかりませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><FiLoader className="animate-spin text-pink-500" /></div>}>
      <VenuesContent />
    </Suspense>
  );
}