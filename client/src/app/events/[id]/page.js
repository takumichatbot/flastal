'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
// アイコン
import { FiCalendar, FiMapPin, FiInfo, FiAlertTriangle, FiPlus, FiExternalLink, FiCpu, FiUser, FiCheckCircle, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 企画カードコンポーネント
function ProjectCard({ project }) {
  const progress = Math.min((project.collectedAmount / project.targetAmount) * 100, 100);
  
  return (
    <Link href={`/projects/${project.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-sky-300 transition-all overflow-hidden group">
      <div className="h-40 bg-gray-200 relative overflow-hidden">
        {project.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
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
            {project.planner?.iconUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={project.planner.iconUrl} alt="planner" className="w-4 h-4 rounded-full mr-1 object-cover"/>
            ) : <span className="w-4 h-4 rounded-full bg-gray-300 mr-1 block"></span>}
            {project.planner?.handleName || '退会済みユーザー'}
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

// 通報モーダル
function ReportModal({ eventId, onClose }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    if (!reason) return toast.error('理由を入力してください');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/events/${eventId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        toast.success('運営に通報しました');
        onClose();
      } else {
        toast.error('送信エラー');
      }
    } catch(e) { toast.error('送信エラー'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24}/></button>
        <h3 className="text-xl font-bold mb-2 text-red-600 flex items-center"><FiAlertTriangle className="mr-2"/> 問題を報告</h3>
        <p className="text-xs text-gray-500 mb-4">虚偽の情報や、既に中止・延期になったイベントなどを報告してください。</p>
        <textarea 
          className="w-full p-3 border rounded-lg bg-gray-50 text-sm h-24 focus:border-red-300 outline-none resize-none"
          placeholder="理由を入力..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 text-sm font-bold hover:bg-gray-100 rounded">キャンセル</button>
          <button onClick={handleReport} disabled={isSubmitting} className="px-4 py-2 bg-red-500 text-white rounded text-sm font-bold hover:bg-red-600 disabled:opacity-50">報告する</button>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (!res.ok) throw new Error('イベントが見つかりません');
        setEvent(await res.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div></div>;
  if (!event) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-gray-500"><p className="mb-4">イベントが見つかりませんでした。</p><Link href="/events" className="text-indigo-600 font-bold hover:underline">イベント一覧へ戻る</Link></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* ヘッダーセクション */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              {/* 情報ソースバッジ */}
              <div className="flex gap-2 mb-3">
                {event.organizer ? (
                   <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200">
                     公式: {event.organizer.name}
                   </span>
                ) : event.sourceType === 'AI' ? (
                   <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                     <FiCpu className="mr-1"/> AI自動収集
                   </span>
                ) : (
                   <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-200">
                     <FiUser className="mr-1"/> ユーザー投稿
                   </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{event.title}</h1>
              
              <div className="flex flex-wrap gap-y-2 gap-x-6 text-gray-600 mb-6 text-sm sm:text-base">
                <div className="flex items-center">
                  <FiCalendar className="w-5 h-5 mr-2 text-indigo-500 shrink-0"/>
                  <span className="font-medium">{new Date(event.eventDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="w-5 h-5 mr-2 text-indigo-500 shrink-0"/>
                  <span className="font-medium">{event.venue ? event.venue.venueName : '会場未定'}</span>
                </div>
                
                {/* 公式サイト or 情報元へのリンク */}
                {(event.organizer?.website || event.sourceUrl) && (
                  <a 
                    href={event.organizer?.website || event.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center text-indigo-600 hover:underline font-bold"
                  >
                    <FiExternalLink className="mr-1"/> {event.organizer ? '公式サイト' : '情報元を確認'}
                  </a>
                )}
              </div>

              {event.description && (
                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap max-w-2xl bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {event.description}
                </div>
              )}
              
              {/* 通報ボタン */}
              <div className="mt-4">
                <button 
                    onClick={() => isAuthenticated ? setShowReportModal(true) : toast.error('ログインが必要です')}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center transition-colors underline"
                >
                    <FiAlertTriangle className="mr-1"/> この情報を通報する
                </button>
              </div>
            </div>

            {/* アクションボタン (PC用) */}
            <div className="hidden md:block">
               {event.isStandAllowed ? (
                  <Link 
                    href={`/projects/create?eventId=${event.id}`}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                  >
                    <FiPlus className="w-5 h-5 mr-2"/>
                    このイベントで企画を立てる
                  </Link>
               ) : (
                 <div className="px-6 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl border border-gray-300 cursor-not-allowed text-center min-w-[200px]">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-400 mb-1">フラスタ受付</span>
                        <span className="flex items-center"><FiAlertTriangle className="mr-1"/> 不可 / 未確認</span>
                    </div>
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
          <div className={`p-6 rounded-xl border ${event.isStandAllowed ? 'bg-white border-gray-200 shadow-sm' : 'bg-yellow-50 border-yellow-200'}`}>
             <div className="flex items-start gap-4">
                {event.isStandAllowed ? (
                    <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0">
                        <FiCheckCircle className="w-6 h-6"/>
                    </div>
                ) : (
                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 shrink-0">
                        <FiAlertTriangle className="w-6 h-6"/>
                    </div>
                )}
                <div>
                    <h3 className={`font-bold text-lg mb-1 ${event.isStandAllowed ? 'text-green-800' : 'text-yellow-800'}`}>
                        {event.isStandAllowed ? 'スタンド花（フラスタ）の受け入れOK' : '受け入れ可否が確認できていません'}
                    </h3>
                    {event.regulationNote ? (
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap text-sm leading-relaxed">{event.regulationNote}</p>
                    ) : (
                        <p className="text-gray-500 mt-1 text-sm">
                            {event.isStandAllowed 
                                ? '特記事項はありません。会場の一般的なルールに従ってください。'
                                : '公式情報や会場のルールを必ずご確認ください。'
                            }
                        </p>
                    )}
                </div>
             </div>
          </div>
        </div>

        {/* 紐づく企画一覧 */}
        <div>
          <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-2">
            <h2 className="text-xl font-bold text-gray-800">
              開催中のフラスタ企画 <span className="ml-2 text-sm font-normal text-gray-500">{event.projects?.length || 0}件</span>
            </h2>
          </div>

          {event.projects && event.projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {event.projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-500 mb-4 font-medium">まだこのイベントの企画は立ち上がっていません。</p>
              {event.isStandAllowed && (
                  <Link 
                    href={`/projects/create?eventId=${event.id}`}
                    className="text-indigo-600 font-bold hover:underline inline-flex items-center"
                  >
                    あなたが最初の企画者になりませんか？ <FiPlus className="ml-1"/>
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
                href={`/projects/create?eventId=${event.id}`}
                className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-xl hover:scale-105 transition-transform active:scale-95"
            >
                <FiPlus className="w-7 h-7"/>
            </Link>
        )}
      </div>

      {/* モーダル表示 */}
      {showReportModal && <ReportModal eventId={event.id} onClose={() => setShowReportModal(false)} />}
    </div>
  );
}