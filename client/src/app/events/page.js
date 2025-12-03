"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
// アイコン
import { FiCalendar, FiMapPin, FiSearch, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function EventsListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 検索フィルタリング
  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.venue && e.venue.venueName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダーエリア */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-16 px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">📅 公式イベント一覧</h1>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
            開催予定のライブやイベントから、フラスタ企画を探したり作成したりできます。<br/>
            公式のレギュレーション情報もこちらから確認できます。
          </p>
          
          {/* 検索バー */}
          <div className="relative max-w-lg mx-auto">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"/>
            <input 
                type="text"
                placeholder="イベント名や会場名で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* リストエリア */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20 text-gray-500">
             <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
             イベント情報を読み込み中...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-500 font-bold mb-2">現在、登録されているイベントはありません。</p>
            <p className="text-sm text-gray-400">お探しのイベントが見つからない場合は、企画作成時に手動で入力できます。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {filteredEvents.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full">
                {/* サムネイル (グラデーション) */}
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center relative">
                    <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                        {new Date(event.eventDate).toLocaleDateString()}
                    </div>
                    <span className="text-4xl filter drop-shadow-lg">🎤</span>
                    
                    {/* フラスタOK/NGバッジ */}
                    <div className="absolute bottom-4 right-4">
                        {event.isStandAllowed ? (
                             <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center">
                                <FiCheckCircle className="mr-1"/> フラスタOK
                             </span>
                        ) : (
                             <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center">
                                <FiAlertTriangle className="mr-1"/> 受付不可
                             </span>
                        )}
                    </div>
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <div className="mb-2">
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                        {event.organizer?.name || '公式'}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
                    {event.title}
                  </h3>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                        <FiCalendar className="mr-2 text-indigo-400 shrink-0"/>
                        <span>
                            {new Date(event.eventDate).toLocaleString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' })}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <FiMapPin className="mr-2 text-indigo-400 shrink-0"/>
                        <span className="truncate">{event.venue ? event.venue.venueName : '会場未定'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}