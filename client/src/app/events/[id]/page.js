'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
// アイコンのインポートを修正
import { 
  FiCalendar, FiMapPin, FiInfo, FiAlertTriangle, FiPlus, 
  FiExternalLink, FiCpu, FiUser, FiCheckCircle, FiX, FiImage,
  FiChevronLeft, FiChevronRight, FiVolume2, FiGlobe, FiTwitter, FiInstagram, FiShield, FiStar, FiMail, FiEdit3
} from 'react-icons/fi';
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
  
  // スライダー用のステート
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (!res.ok) throw new Error('イベントが見つかりません');
        const data = await res.json();
        setEvent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  // スライダー操作
  const nextImage = () => {
    if (!event?.imageUrls) return;
    setCurrentImageIndex((prev) => (prev + 1) % event.imageUrls.length);
  };

  const prevImage = () => {
    if (!event?.imageUrls) return;
    setCurrentImageIndex((prev) => (prev - 1 + event.imageUrls.length) % event.imageUrls.length);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div></div>;
  if (!event) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-gray-500"><p className="mb-4">イベントが見つかりませんでした。</p><Link href="/events" className="text-indigo-600 font-bold hover:underline">イベント一覧へ戻る</Link></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* 主催者からの告知セクション */}
      {event.announcement && (
        <div className="bg-indigo-600 text-white py-4 px-4 shadow-lg sticky top-0 z-40">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
             <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full shrink-0 shadow-inner">
                <FiVolume2 className="animate-bounce" size={18}/>
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <FiShield size={12}/> Official Announcement
                </span>
             </div>
             <p className="text-sm md:text-base font-black tracking-tight leading-relaxed">
               {event.announcement}
             </p>
          </div>
        </div>
      )}

      {/* ヘッダーセクション */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row gap-10">
            
            {/* 左: 画像スライダー (PCでは固定幅) */}
            <div className="w-full md:w-80 shrink-0">
               <div className="aspect-[3/4] rounded-2xl bg-slate-100 overflow-hidden shadow-xl border border-slate-200 relative group">
                  {event.imageUrls && event.imageUrls.length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={event.imageUrls[currentImageIndex]} 
                        alt={`${event.title} - ${currentImageIndex + 1}`} 
                        className="w-full h-full object-cover transition-opacity duration-500" 
                      />
                      
                      {/* スライダーナビゲーション */}
                      {event.imageUrls.length > 1 && (
                        <>
                          <button 
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <FiChevronLeft size={20} />
                          </button>
                          <button 
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <FiChevronRight size={20} />
                          </button>
                          
                          {/* インジケーター */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {event.imageUrls.map((_, idx) => (
                              <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <FiImage size={64} className="mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
                    </div>
                  )}
               </div>
            </div>

            {/* 右: テキスト情報 */}
            <div className="flex-1">
              <div className="flex gap-2 mb-3">
                {event.organizer ? (
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black border border-indigo-200">
                     <FiShield size={12}/>
                     公式主催者: {event.organizer.name}
                   </div>
                ) : event.sourceType === 'AI' ? (
                   <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                     <FiCpu className="mr-1"/> AI自動収集
                   </span>
                ) : (
                   <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-200">
                     <FiUser className="mr-1"/> ユーザー投稿
                   </span>
                )}

                {/* 神絵師募集中ラベル */}
                {event.isIllustratorRecruiting && (
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-black animate-pulse shadow-sm shadow-rose-100">
                     <FiStar size={12} className="fill-white"/> 神絵師募集中！
                   </div>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{event.title}</h1>
              
              <div className="flex flex-wrap gap-y-2 gap-x-6 text-gray-600 mb-6 text-sm sm:text-base border-b border-slate-50 pb-6">
                <div className="flex items-center">
                  <FiCalendar className="w-5 h-5 mr-2 text-indigo-500 shrink-0"/>
                  <span className="font-medium">{new Date(event.eventDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="w-5 h-5 mr-2 text-indigo-500 shrink-0"/>
                  <span className="font-medium">{event.venue ? event.venue.venueName : '会場未定'}</span>
                </div>
              </div>

              {/* SNS・公式サイトボタン群 */}
              <div className="flex flex-wrap gap-3 mb-8">
                {event.officialWebsite && (
                  <a href={event.officialWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md">
                    <FiGlobe size={18} /> 公式サイト
                  </a>
                )}
                {event.twitterUrl && (
                  <a href={event.twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-50 text-sky-600 rounded-xl text-sm font-bold hover:bg-sky-100 transition-all border border-sky-100">
                    <FiTwitter size={18} /> X (Twitter)
                  </a>
                )}
                {event.instagramUrl && (
                  <a href={event.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all border border-rose-100">
                    <FiInstagram size={18} /> Instagram
                  </a>
                )}
              </div>

              {/* イラスト公募セクション */}
              {event.isIllustratorRecruiting && (
                <div className="mb-8 bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 text-rose-100 opacity-50 rotate-12">
                        <FiStar size={100} className="fill-rose-100" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-rose-800 font-black mb-3 flex items-center gap-2">
                            <FiEdit3 size={20}/> このイベントのイラストレーターを募集中！
                        </h3>
                        <p className="text-rose-700 text-sm whitespace-pre-wrap leading-relaxed mb-5">
                            {event.illustratorRequirements || '募集条件の詳細は主催者にお問い合わせください。'}
                        </p>
                        <div className="flex gap-3">
                            <a 
                                href={event.twitterUrl || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-black hover:bg-rose-700 transition-all shadow-md active:scale-95"
                            >
                                <FiMail /> 主催者に連絡・応募する
                            </a>
                        </div>
                    </div>
                </div>
              )}

              {event.description && (
                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap max-w-2xl bg-gray-50/50 p-5 rounded-2xl border border-slate-100">
                  {event.description}
                </div>
              )}
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <button 
                    onClick={() => isAuthenticated ? setShowReportModal(true) : toast.error('ログインが必要です')}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center transition-colors underline"
                >
                    <FiAlertTriangle className="mr-1"/> この情報を通報する
                </button>

                <div className="hidden md:block">
                  {event.isStandAllowed ? (
                      <Link 
                        href={`/projects/create?eventId=${event.id}`}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95"
                      >
                        <FiPlus className="w-5 h-5 mr-2"/>
                        企画を立てる
                      </Link>
                  ) : (
                    <div className="px-6 py-3 bg-gray-100 text-gray-400 font-bold rounded-xl border border-gray-200 cursor-not-allowed text-center min-w-[200px]">
                        <span className="text-xs">フラスタ受付 不可/未確認</span>
                    </div>
                  )}
                </div>
              </div>
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
          <div className={`p-6 rounded-2xl border-2 ${event.isStandAllowed ? 'bg-white border-green-50 shadow-sm' : 'bg-yellow-50 border-yellow-100'}`}>
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

        <div>
          <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-black text-gray-900">
              開催中のフラスタ企画 <span className="ml-2 text-sm font-normal text-gray-400 bg-slate-100 px-3 py-1 rounded-full">{event.projects?.length || 0}件</span>
            </h2>
          </div>

          {event.projects && event.projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
              {event.projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-100 p-16 text-center">
              <p className="text-gray-400 mb-4 font-bold">まだこのイベントの企画は立ち上がっていません。</p>
              {event.isStandAllowed && (
                  <Link 
                    href={`/projects/create?eventId=${event.id}`}
                    className="text-indigo-600 font-black text-sm hover:underline inline-flex items-center"
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
                className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-2xl hover:scale-105 transition-transform active:scale-95"
            >
                <FiPlus size={32}/>
            </Link>
        )}
      </div>

      {/* モーダル表示 */}
      {showReportModal && <ReportModal eventId={event.id} onClose={() => setShowReportModal(false)} />}
    </div>
  );
}