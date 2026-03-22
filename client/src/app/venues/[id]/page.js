"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

// 修正後 (User, Camera を追加):
import { 
  MapPin, Info, AlertTriangle, CheckCircle2, 
  XCircle, ArrowRight, Edit3, Settings, Calendar, Truck, ExternalLink, Image as ImageIcon, Loader2, User, Camera
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-20"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.1, 0.4, 0.1], scale: [1, 2, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(56,189,248,0.05)] rounded-[2.5rem] p-6 md:p-8", className)}>
    {children}
  </div>
);

export default function VenueDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwner = isAuthenticated && user && (user.id === id || user.role === 'ADMIN');

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/venues/${id}`)
      .then(res => res.json())
      .then(data => { setVenue(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-sky-50/50"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;
  }

  if (!venue) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-slate-300"><AlertTriangle size={40}/></div>
            <p className="text-xl font-black text-slate-800 mb-4">会場が見つかりません</p>
            <Link href="/" className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-full shadow-lg hover:bg-slate-800 transition-all">トップページへ戻る</Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 to-sky-50/50 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      {/* 会場専用管理バー */}
      {isOwner && (
        <div className="bg-amber-50/90 backdrop-blur-md border-b border-amber-200 py-3 sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center text-amber-800 font-black text-xs uppercase tracking-widest gap-2">
              <Settings size={14}/> 会場管理モード
            </div>
            <div className="flex gap-2">
              <Link href={`/venues/dashboard/${id}/edit`} className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-full text-xs font-black hover:bg-amber-50 transition-colors flex items-center gap-1.5 shadow-sm">
                <Edit3 size={14}/> 情報を編集
              </Link>
              <Link href="/mypage" className="bg-amber-500 text-white px-4 py-2 rounded-full text-xs font-black hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-md">
                <Calendar size={14}/> 搬入予定を確認
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        
        {/* ヘッダーエリア */}
        <GlassCard className="!p-0 overflow-hidden mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-sky-500 opacity-95 z-0"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 z-0"></div>
          
          <div className="relative z-10 p-8 md:p-12 text-white flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <span className={cn("inline-flex items-center gap-1.5 mb-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/20 backdrop-blur-md", venue.isStandAllowed === false ? 'bg-rose-500/90 text-white' : 'bg-emerald-500/90 text-white')}>
                {venue.isStandAllowed === false ? <><XCircle size={14}/> フラスタ禁止の可能性あり</> : <><CheckCircle2 size={14}/> フラスタ受入実績あり</>}
              </span>
              <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter drop-shadow-md">{venue.venueName}</h1>
              <p className="text-sky-100 flex items-center font-bold text-sm">
                <MapPin className="mr-2 shrink-0" size={16}/> {venue.address}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
               <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.venueName + ' ' + venue.address)}`} target="_blank" rel="noopener noreferrer"
                 className="bg-white text-indigo-600 px-6 py-3.5 rounded-full font-black text-sm shadow-xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
               >
                 Googleマップで見る <ExternalLink size={16}/>
               </a>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 左カラム: レギュレーション情報 */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard>
              <h2 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <Info className="text-indigo-500" size={20}/> レギュレーション情報
              </h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">スタンド花</p>
                  <div className="flex items-center gap-2 mb-2">
                      {venue.isStandAllowed === false ? (
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 flex items-center gap-1 uppercase tracking-widest"><XCircle size={12}/> 受入不可</span>
                      ) : (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1 uppercase tracking-widest"><CheckCircle2 size={12}/> 受入可 (要確認)</span>
                      )}
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap font-medium leading-relaxed">
                      {typeof venue.standRegulation === 'string' ? venue.standRegulation : (venue.standRegulation?.text || "特記事項なし")}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">楽屋花 (籠花)</p>
                  <div className="flex items-center gap-2 mb-2">
                      {venue.isBowlAllowed === false ? (
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 flex items-center gap-1 uppercase tracking-widest"><XCircle size={12}/> 受入不可</span>
                      ) : (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1 uppercase tracking-widest"><CheckCircle2 size={12}/> 受入可 (要確認)</span>
                      )}
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap font-medium leading-relaxed">
                      {typeof venue.bowlRegulation === 'string' ? venue.bowlRegulation : (venue.bowlRegulation?.text || "特記事項なし")}
                  </p>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">回収について</p>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {venue.retrievalRequired ? <><AlertTriangle size={16} className="text-amber-500"/> 回収必須 (お花屋さんに伝えてください)</> : 'イベント主催者の指示に従う'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-amber-50/80 backdrop-blur-sm text-amber-800 text-xs font-bold rounded-2xl border border-amber-200 flex gap-3 leading-relaxed">
                <AlertTriangle className="shrink-0 mt-0.5 text-amber-500" size={16}/>
                <p>情報は過去の実績に基づくものです。必ず公演ごとの公式アナウンスを優先して確認してください。</p>
              </div>
            </GlassCard>

            {/* 会場以外のユーザー向けアクション */}
            {!isOwner ? (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 md:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <div className="relative z-10">
                      <h3 className="font-black text-xl mb-2 tracking-tighter">この会場で企画を立てる</h3>
                      <p className="text-indigo-100 text-xs font-bold mb-6">会場情報が自動入力されて便利です✨</p>
                      <Link href={`/projects/create?venueId=${venue.id}`} className="block w-full bg-white text-indigo-600 text-center py-4 rounded-full font-black hover:bg-indigo-50 transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 active:scale-95">
                          企画を作成する <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                      </Link>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
              </div>
            ) : (
              <GlassCard className="!bg-indigo-50/50 !border-indigo-100">
                  <h3 className="font-black text-indigo-900 mb-3 flex items-center gap-2 text-lg">
                    <Truck className="text-indigo-500" size={20}/> 物流・搬入設定
                  </h3>
                  <p className="text-xs text-indigo-700/80 mb-6 font-bold leading-relaxed">お花屋さん向けに搬入口の場所や搬入可能時間を詳しく登録できます。</p>
                  <Link href={`/venues/${id}/logistics`} className="block w-full bg-white border border-indigo-200 text-indigo-600 text-center py-3.5 rounded-full font-black hover:bg-indigo-600 hover:text-white transition-all text-sm shadow-sm">
                    搬入ルールを編集
                  </Link>
              </GlassCard>
            )}
          </div>

          {/* 右カラム: 実績ギャラリー */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard>
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={24}/>
                  この会場の過去の実績 <span className="text-sm font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{venue.projects?.length || 0}件</span>
                </h2>
                
                {venue.projects && venue.projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {venue.projects.map(project => (
                      <Link key={project.id} href={`/projects/${project.id}`} className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:border-sky-200 transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
                        <div className="h-40 md:h-48 bg-slate-100 relative overflow-hidden shrink-0 border-b border-slate-50">
                          {project.imageUrl ? (
                            <img src={project.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={project.title}/>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><ImageIcon size={32}/></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            {project.planner?.iconUrl ? (
                                <img src={project.planner.iconUrl} alt="" className="w-6 h-6 rounded-full border border-white/50 object-cover" />
                            ) : (
                                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/50"><User size={12} className="text-white"/></div>
                            )}
                            <p className="text-white text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] shadow-sm">{project.planner?.handleName || 'Planner'}</p>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-black text-slate-800 text-sm mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                            {project.title}
                          </h3>
                          <div className="mt-auto pt-3 border-t border-slate-50">
                              <p className="text-[10px] font-bold text-slate-400 truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0"></span> {project.flowerTypes || 'お花指定なし'}
                              </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 p-12 rounded-[2rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-300 shadow-sm border border-slate-100 rotate-3"><Camera size={28}/></div>
                    <p className="font-black text-slate-700 mb-2">実績はまだありません</p>
                    <p className="text-xs font-bold text-slate-400">あなたが最初の企画者になりませんか？🌸</p>
                  </div>
                )}
            </GlassCard>
          </div>

        </div>
      </div>
    </div>
  );
}