"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiMapPin, FiInfo, FiAlertTriangle, FiCheckCircle, 
  FiChevronRight, FiXCircle, FiArrowRight, FiEdit3, 
  FiSettings, FiCalendar, FiTruck 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  // 会場自身、または管理者であるかの判定
  const isOwner = isAuthenticated && user && (user.id === id || user.role === 'ADMIN');

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/venues/${id}`)
      .then(res => res.json())
      .then(data => {
        setVenue(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!venue) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <p className="text-xl font-bold text-gray-400 mb-4">会場が見つかりません</p>
            <Link href="/" className="text-indigo-600 hover:underline">トップページへ戻る</Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 会場専用管理バー (ログイン中かつ本人の場合のみ表示) */}
      {isOwner && (
        <div className="bg-amber-50 border-b border-amber-200 py-3">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center text-amber-800 font-bold text-sm">
              <FiSettings className="mr-2"/> 会場管理モードで表示中
            </div>
            <div className="flex gap-3">
              <Link href={`/venues/${id}/edit`} className="bg-white border border-amber-300 text-amber-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors flex items-center">
                <FiEdit3 className="mr-1"/> 情報を編集
              </Link>
              <Link href="/mypage" className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors flex items-center">
                <FiCalendar className="mr-1"/> 搬入予定を確認
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダーエリア */}
      <div className="bg-slate-900 text-white py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {/* フラスタ可否バッジ */}
              <span className={`inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit ${venue.isStandAllowed === false ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {venue.isStandAllowed === false ? <><FiXCircle className="mr-1"/> フラスタ禁止の可能性あり</> : <><FiCheckCircle className="mr-1"/> フラスタ受入実績あり</>}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{venue.venueName}</h1>
              <p className="text-slate-300 flex items-center">
                <FiMapPin className="mr-2"/> {venue.address}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
               <a 
                 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.venueName + ' ' + venue.address)}`} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-bold transition-colors border border-white/20 inline-flex items-center justify-center"
               >
                 Googleマップで見る <FiArrowRight className="ml-2"/>
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
              <div className="border-b border-gray-100 pb-3">
                <p className="text-gray-500 text-xs mb-1">スタンド花</p>
                <div className="flex items-center gap-2 mb-2">
                    {venue.isStandAllowed === false ? (
                        <span className="text-red-600 font-bold flex items-center"><FiXCircle className="mr-1"/> 受入不可</span>
                    ) : (
                        <span className="text-green-600 font-bold flex items-center"><FiCheckCircle className="mr-1"/> 受入可 (要確認)</span>
                    )}
                </div>
                <p className="text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap">
                    {typeof venue.standRegulation === 'string' ? venue.standRegulation : (venue.standRegulation?.text || "特記事項なし")}
                </p>
              </div>

              <div className="border-b border-gray-100 pb-3">
                <p className="text-gray-500 text-xs mb-1">楽屋花 (アレンジメント)</p>
                <div className="flex items-center gap-2 mb-2">
                    {venue.isBowlAllowed === false ? (
                        <span className="text-red-600 font-bold flex items-center"><FiXCircle className="mr-1"/> 受入不可</span>
                    ) : (
                        <span className="text-green-600 font-bold flex items-center"><FiCheckCircle className="mr-1"/> 受入可 (要確認)</span>
                    )}
                </div>
                <p className="text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap">
                    {typeof venue.bowlRegulation === 'string' ? venue.bowlRegulation : (venue.bowlRegulation?.text || "特記事項なし")}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">回収について</p>
                <p className="font-bold text-gray-800">
                  {venue.retrievalRequired ? '⚠️ 回収必須 (お花屋さんに伝えてください)' : 'イベント主催者の指示に従う'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200 flex gap-2">
              <FiAlertTriangle className="shrink-0 text-lg"/>
              <p>情報は過去の実績に基づくものです。必ず公演ごとの公式アナウンスを確認してください。</p>
            </div>
          </div>

          {/* 会場以外のユーザー向けアクション：自身の会場なら「物流情報」を出すなど */}
          {!isOwner ? (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-2">この会場で企画を立てる</h3>
                    <p className="text-indigo-100 text-sm mb-4">会場情報が自動入力されます。</p>
                    <Link href={`/projects/create?venueId=${venue.id}`} className="block w-full bg-white text-indigo-600 text-center py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-md">
                    企画を作成する
                    </Link>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <FiTruck className="mr-2 text-indigo-500"/> 物流・搬入設定
                </h3>
                <p className="text-xs text-gray-500 mb-4">お花屋さん向けに搬入口の場所や搬入可能時間を詳しく登録できます。</p>
                <Link href={`/venues/${id}/logistics`} className="block w-full bg-indigo-50 text-indigo-600 text-center py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors text-sm">
                  搬入ルールを編集
                </Link>
            </div>
          )}
        </div>

        {/* 右カラム: 実績ギャラリー */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <FiCheckCircle className="mr-2 text-green-500"/>
            この会場の過去の実績 ({venue.projects?.length || 0}件)
          </h2>
          
          {venue.projects && venue.projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {venue.projects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {project.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={project.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={project.title}/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">No Image</div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                      <p className="text-white text-xs font-bold truncate">{project.planner?.handleName || '匿名プランナー'}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">
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