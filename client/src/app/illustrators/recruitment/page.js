'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { 
  FiStar, FiCalendar, FiMapPin, FiArrowRight, FiInfo, FiSearch, FiFilter, FiLoader, FiImage 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function IllustratorRecruitmentContent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecruitments = useCallback(async () => {
    setLoading(true);
    try {
      // 募集中のイベントだけを取得するエンドポイント（後ほどバックエンドでフィルタリング対応）
      const res = await fetch(`${API_URL}/api/events/public?illustratorOnly=true`);
      if (!res.ok) throw new Error('募集情報の取得に失敗しました');
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      console.error(e);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecruitments();
  }, [fetchRecruitments]);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.illustratorRequirements && e.illustratorRequirements.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダーセクション */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-rose-600 p-2 rounded-lg text-white shadow-lg shadow-rose-100">
                <FiStar size={24} className="fill-white"/>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">イラストレーター公募一覧</h1>
            </div>
            <p className="text-gray-500 font-bold ml-1">
              フラワースタンドのパネルイラストを描いてくれる「神絵師」を主催者が探しています。
            </p>
          </div>

          <div className="w-full md:w-80">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="イベント名・条件で検索..." 
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* リスト表示 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiLoader className="animate-spin text-rose-500 mb-4" size={40} />
            <p className="text-gray-400 font-bold">募集中イベントを探しています...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-200">
            <FiStar size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">No Recruitment Found</h3>
            <p className="text-gray-400 mt-2">現在、イラストレーターを募集しているイベントはありません。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <div key={event.id} className="group bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
                
                {/* 画像エリア */}
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {event.imageUrls && event.imageUrls.length > 0 ? (
                    <img src={event.imageUrls[0]} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-400 to-pink-500">
                      <FiStar size={40} className="text-white opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                      <FiStar size={10} className="fill-white"/> 募集中
                    </span>
                  </div>
                </div>

                {/* コンテンツ */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-4 group-hover:text-rose-600 transition-colors">
                    {event.title}
                  </h3>

                  <div className="bg-rose-50 rounded-xl p-4 mb-4 border border-rose-100 flex-grow">
                    <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <FiInfo /> 募集条件
                    </p>
                    <p className="text-sm text-rose-800 line-clamp-3 leading-relaxed">
                      {event.illustratorRequirements || '条件の詳細は詳細ページをご確認ください。'}
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-xs text-gray-500 font-bold">
                      <FiCalendar className="mr-2 text-rose-400" />
                      {new Date(event.eventDate).toLocaleDateString('ja-JP')}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 font-bold">
                      <FiMapPin className="mr-2 text-rose-400" />
                      {event.venue?.venueName || '会場未定'}
                    </div>
                  </div>

                  <Link 
                    href={`/events/${event.id}`}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-rose-600 transition-all shadow-lg active:scale-95"
                  >
                    募集詳細を見る <FiArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IllustratorRecruitmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin text-rose-500" size={40}/></div>}>
      <IllustratorRecruitmentContent />
    </Suspense>
  );
}