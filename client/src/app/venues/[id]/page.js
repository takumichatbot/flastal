"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiMapPin, FiInfo, FiAlertTriangle, FiCheckCircle, FiChevronRight } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueDetailPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/venues/${id}`)
      .then(res => res.json())
      .then(data => {
        setVenue(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  if (!venue) return <div className="min-h-screen flex items-center justify-center">会場が見つかりません</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダーエリア */}
      <div className="bg-slate-900 text-white py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className={`inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold ${venue.isStandAllowed === false ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {venue.isStandAllowed === false ? '🚫 フラスタ禁止の可能性あり' : '✅ フラスタ受入実績あり'}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{venue.venueName}</h1>
              <p className="text-slate-300 flex items-center">
                <FiMapPin className="mr-2"/> {venue.address}
              </p>
            </div>
            <div>
               <a 
                 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.venueName + ' ' + venue.address)}`} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-bold transition-colors border border-white/20"
               >
                 Googleマップで見る
               </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左カラム: レギュレーション情報 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center">
              <FiInfo className="mr-2 text-indigo-500"/> レギュレーション情報
            </h2>
            
            <div className="space-y-4 text-sm">
              <div className="border-b pb-3">
                <p className="text-gray-500 text-xs mb-1">スタンド花</p>
                <p className="font-bold">
                  {venue.isStandAllowed === false ? '受入不可' : '受入可 (要確認)'}
                </p>
                {venue.standRegulation && <p className="mt-1 text-gray-600 bg-gray-50 p-2 rounded">{venue.standRegulation}</p>}
              </div>

              <div className="border-b pb-3">
                <p className="text-gray-500 text-xs mb-1">楽屋花 (アレンジメント)</p>
                <p className="font-bold">
                  {venue.isBowlAllowed === false ? '受入不可' : '受入可 (要確認)'}
                </p>
                {venue.bowlRegulation && <p className="mt-1 text-gray-600 bg-gray-50 p-2 rounded">{venue.bowlRegulation}</p>}
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">回収について</p>
                <p className="font-bold">
                  {venue.retrievalRequired ? '回収必須' : 'イベントによる'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200 flex gap-2">
              <FiAlertTriangle className="shrink-0 text-lg"/>
              <p>情報は過去の実績に基づくものです。必ず公演ごとの公式アナウンスを確認してください。</p>
            </div>
          </div>

          {/* アクション */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="font-bold text-lg mb-2">この会場で企画を立てる</h3>
            <p className="text-indigo-100 text-sm mb-4">会場情報が自動入力されます。</p>
            <Link href={`/projects/create?venueId=${venue.id}`} className="block w-full bg-white text-indigo-600 text-center py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors">
              企画を作成する
            </Link>
          </div>
        </div>

        {/* 右カラム: 実績ギャラリー */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <FiCheckCircle className="mr-2 text-green-500"/>
            この会場の過去の実績 ({venue.projects?.length || 0}件)
          </h2>

          {venue.projects?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {venue.projects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {project.imageUrl ? (
                      <img src={project.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={project.title}/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                      <p className="text-white text-xs font-bold truncate">{project.planner?.handleName}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {project.flowerTypes || 'お花指定なし'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
              <p>この会場での登録実績はまだありません。</p>
              <p className="text-sm mt-2">あなたが最初の企画者になりませんか？</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}