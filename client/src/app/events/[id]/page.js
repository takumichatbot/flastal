'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiInfo, FiAlertTriangle, FiPlus, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 企画カードコンポーネント (簡易版)
function ProjectCard({ project }) {
  const progress = Math.min((project.collectedAmount / project.targetAmount) * 100, 100);
  
  return (
    <Link href={`/projects/${project.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-sky-300 transition-all overflow-hidden group">
      <div className="h-40 bg-gray-200 relative overflow-hidden">
        {project.imageUrl ? (
          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">No Image</div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-700">
          {project.status === 'FUNDRAISING' ? '募集中' : project.status === 'SUCCESSFUL' ? '達成！' : project.status}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 line-clamp-1 mb-2 group-hover:text-sky-600">{project.title}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            {project.planner.iconUrl ? (
                <img src={project.planner.iconUrl} className="w-4 h-4 rounded-full mr-1"/>
            ) : <span className="w-4 h-4 rounded-full bg-gray-300 mr-1 block"></span>}
            {project.planner.handleName}
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
          <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-sky-600 font-bold">{progress.toFixed(0)}%</span>
          <span className="text-gray-400">あと {(project.targetAmount - project.collectedAmount).toLocaleString()} pt</span>
        </div>
      </div>
    </Link>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (!res.ok) throw new Error('イベントが見つかりません');
        setEvent(await res.json());
      } catch (error) {
        console.error(error);
        // toast.error('イベント情報の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div></div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center text-gray-500">イベントが見つかりませんでした。</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダーセクション */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-3">
                {event.organizer.name} 公認
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{event.title}</h1>
              
              <div className="flex flex-wrap gap-y-2 gap-x-6 text-gray-600 mb-6">
                <div className="flex items-center">
                  <FiCalendar className="w-5 h-5 mr-2 text-indigo-500"/>
                  <span className="font-medium">{new Date(event.eventDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="w-5 h-5 mr-2 text-indigo-500"/>
                  <span className="font-medium">{event.venue ? event.venue.venueName : '会場未定'}</span>
                </div>
                {event.organizer.website && (
                  <a href={event.organizer.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 hover:underline text-sm">
                    <FiExternalLink className="mr-1"/> 公式サイト
                  </a>
                )}
              </div>

              {event.description && (
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap max-w-2xl">
                  {event.description}
                </p>
              )}
            </div>

            {/* アクションボタン (PC用) */}
            <div className="hidden md:block">
               {event.isStandAllowed ? (
                  <Link 
                    href="/create" // ★ 本来はクエリパラメータでイベントIDを渡して自動選択させると親切
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <FiPlus className="w-5 h-5 mr-2"/>
                    このイベントで企画を立てる
                  </Link>
               ) : (
                 <div className="px-6 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl border border-gray-300 cursor-not-allowed text-center">
                    フラスタ受付不可
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* レギュレーション情報 */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiInfo className="mr-2 text-indigo-600"/> フラスタ・レギュレーション
          </h2>
          <div className={`p-5 rounded-xl border ${event.isStandAllowed ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}`}>
             <div className="flex items-start gap-3">
                {event.isStandAllowed ? (
                    <div className="bg-green-100 p-2 rounded-full text-green-600 mt-1">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                ) : (
                    <div className="bg-red-100 p-2 rounded-full text-red-600 mt-1">
                        <FiAlertTriangle className="w-6 h-6"/>
                    </div>
                )}
                <div>
                    <h3 className={`font-bold text-lg ${event.isStandAllowed ? 'text-green-800' : 'text-red-800'}`}>
                        {event.isStandAllowed ? 'スタンド花（フラスタ）の受け入れOK' : 'スタンド花（フラスタ）は受け付けていません'}
                    </h3>
                    {event.regulationNote ? (
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap text-sm">{event.regulationNote}</p>
                    ) : (
                        <p className="text-gray-500 mt-1 text-sm">特記事項はありません。会場の一般的なルールに従ってください。</p>
                    )}
                </div>
             </div>
          </div>
        </div>

        {/* 紐づく企画一覧 */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              開催中のフラスタ企画 <span className="ml-2 text-sm font-normal text-gray-500">{event.projects.length}件</span>
            </h2>
          </div>

          {event.projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-500 mb-4">まだこのイベントの企画は立ち上がっていません。</p>
              {event.isStandAllowed && (
                  <Link href="/create" className="text-indigo-600 font-bold hover:underline">
                    あなたが最初の企画者になりませんか？
                  </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* スマホ用追従ボタン */}
      <div className="md:hidden fixed bottom-6 right-6 z-30">
        {event.isStandAllowed && (
            <Link 
                href="/create"
                className="flex items-center justify-center w-14 h-14 bg-pink-500 text-white rounded-full shadow-xl hover:bg-pink-600 transition-colors"
            >
                <FiPlus className="w-8 h-8"/>
            </Link>
        )}
      </div>
    </div>
  );
}