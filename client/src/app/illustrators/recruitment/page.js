'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-react に統一
import { 
  Star, Calendar, MapPin, ArrowRight, Info, Search, Loader2, PenTool, Sparkles, X, Coins, Send
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ===========================================
// 🎨 UI COMPONENTS
// ===========================================
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-4 h-4 bg-amber-300 rounded-full mix-blend-multiply filter blur-[2px] opacity-20"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -150], x: [null, (Math.random() - 0.5) * 80], opacity: [0.1, 0.5, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

// ===========================================
// 🪄 Application Modal (立候補モーダル)
// ===========================================
function ApplicationModal({ event, onClose, onSuccess }) {
  const { user, authenticatedFetch } = useAuth();
  const [proposedAmount, setProposedAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposedAmount || proposedAmount < 100) return toast.error('希望金額を正しく入力してください');
    if (!message.trim()) return toast.error('提案メッセージを入力してください');

    setIsSubmitting(true);
    const toastId = toast.loading('立候補を送信中...');

    try {
      // ※ バックエンドの立候補用APIを叩く想定
      const res = await authenticatedFetch(`${API_URL}/api/illustrators/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              eventId: event.id, 
              proposedAmount: parseInt(proposedAmount),
              message 
          }),
      });

      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || '立候補の送信に失敗しました');
      }

      toast.success('立候補が完了しました！🎉\n企画者からの連絡をお待ちください。', { id: toastId, duration: 6000 });
      onSuccess();
      onClose();
    } catch (error) {
        toast.error(error.message, { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm p-4 z-[100] flex items-center justify-center">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><PenTool className="text-amber-500"/> この募集に立候補する</h3>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto bg-slate-50/50">
                <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Event</p>
                     <p className="font-black text-slate-800 text-sm">{event.title}</p>
                </div>

                <form id="applicationForm" onSubmit={handleSubmit} className="space-y-5">
                    {/* 金額 */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">希望金額 (pt)</label>
                        <div className="relative">
                            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={18}/>
                            <input 
                                type="number" min="100" required value={proposedAmount} onChange={(e) => setProposedAmount(e.target.value)} placeholder="例: 5000"
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none text-lg font-black text-slate-800 transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1.5 ml-1">※あなたの基本料金や作業量に合わせて入力してください。</p>
                    </div>

                    {/* メッセージ */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">提案メッセージ・アピール</label>
                        <textarea 
                            required value={message} onChange={(e) => setMessage(e.target.value)} rows="5" 
                            placeholder="例: はじめまして！条件を拝見し、私の得意な可愛い系の絵柄がぴったりだと思い立候補しました。ポートフォリオの1枚目のようなテイストで制作可能です。"
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none text-sm font-bold text-slate-800 transition-all resize-none"
                        ></textarea>
                    </div>
                </form>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <button 
                    type="submit" form="applicationForm" 
                    disabled={isSubmitting || !proposedAmount || !message.trim()} 
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                    {isSubmitting ? '処理中...' : '立候補を送信する'}
                </button>
            </div>
        </motion.div>
    </div>
  );
}

// ===========================================
// MAIN CONTENT
// ===========================================
function IllustratorRecruitmentContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // モーダル管理
  const [selectedEventForApp, setSelectedEventForApp] = useState(null);

  const fetchRecruitments = useCallback(async () => {
    setLoading(true);
    try {
      // 募集中のイベントだけを取得する想定
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

  const handleApplyClick = (event) => {
      if (!user) {
          toast.error('立候補するにはログインが必要です');
          router.push('/illustrators/login');
          return;
      }
      if (user.role !== 'ILLUSTRATOR') {
          toast.error('立候補はクリエイター(絵師)として登録したユーザーのみ可能です。');
          return;
      }
      setSelectedEventForApp(event);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 min-h-screen py-10 md:py-16 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ヘッダーセクション */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6 text-center md:text-left">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-[1.5rem] shadow-sm border border-amber-100 mb-4 text-amber-500 -rotate-3">
                <Star size={32} className="fill-amber-500 animate-pulse" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">クリエイター公募掲示板</h1>
            <p className="text-slate-500 font-bold text-sm md:text-base">フラスタのパネルイラストを描いてくれる「神絵師」を主催者が探しています🎨</p>
          </div>

          <div className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="イベント名・条件で検索..." 
                className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-300 shadow-sm transition-all font-bold text-slate-700"
              />
            </div>
          </div>
        </motion.div>

        {/* リスト表示 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
            <p className="text-slate-400 font-bold">募集中イベントを探しています...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-[3rem] p-20 text-center border border-white shadow-sm">
            <Star size={48} className="text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">No Recruitment Found</h3>
            <p className="text-slate-400 mt-2 font-bold">現在、イラストレーターを募集しているイベントはありません。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence>
              {filteredEvents.map((event, i) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="h-full">
                  <div className="group bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgba(245,158,11,0.05)] border border-white overflow-hidden hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(245,158,11,0.15)] hover:border-amber-200 transition-all duration-500 flex flex-col h-full">
                    
                    {/* 画像エリア */}
                    <div className="h-48 bg-slate-100 relative overflow-hidden shrink-0">
                      {event.imageUrls && event.imageUrls.length > 0 ? (
                        <img src={event.imageUrls[0]} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500">
                          <Star size={40} className="text-white opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 border border-amber-400">
                          <Sparkles size={12}/> 絵師募集中
                        </span>
                      </div>
                    </div>

                    {/* コンテンツ */}
                    <div className="p-6 flex flex-col flex-grow relative">
                      <h3 className="font-bold text-lg md:text-xl text-slate-800 line-clamp-2 mb-4 group-hover:text-amber-600 transition-colors leading-snug">
                        {event.title}
                      </h3>

                      <div className="bg-amber-50/50 rounded-[1.5rem] p-4 mb-5 border border-amber-100 flex-grow relative">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Info size={12}/> 募集条件・詳細
                        </p>
                        <p className="text-xs md:text-sm text-amber-900/80 line-clamp-4 leading-relaxed font-medium">
                          {event.illustratorRequirements || '条件の詳細は詳細ページをご確認ください。'}
                        </p>
                      </div>

                      <div className="space-y-2.5 mb-6">
                        <div className="flex items-center text-xs text-slate-500 font-bold bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <Calendar size={14} className="mr-2 text-sky-400 shrink-0" />
                          {new Date(event.eventDate).toLocaleDateString('ja-JP')}
                        </div>
                        <div className="flex items-center text-xs text-slate-500 font-bold bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <MapPin size={14} className="mr-2 text-emerald-400 shrink-0" />
                          <span className="truncate">{event.venue?.venueName || '会場未定'}</span>
                        </div>
                      </div>

                      <div className="mt-auto space-y-2">
                          <button 
                            onClick={() => handleApplyClick(event)}
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95"
                          >
                            <PenTool size={16}/> この募集に立候補する
                          </button>
                          <Link 
                            href={`/events/${event.id}`}
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-50 text-slate-600 font-black rounded-xl hover:bg-slate-100 transition-all shadow-sm active:scale-95 text-sm"
                          >
                            イベントの詳細を見る <ArrowRight size={16}/>
                          </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 立候補モーダル */}
      <AnimatePresence>
          {selectedEventForApp && (
              <ApplicationModal 
                  event={selectedEventForApp} 
                  onClose={() => setSelectedEventForApp(null)} 
                  onSuccess={fetchRecruitments}
              />
          )}
      </AnimatePresence>
    </div>
  );
}

export default function IllustratorRecruitmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-amber-50/50"><Loader2 className="animate-spin text-amber-500" size={40}/></div>}>
      <IllustratorRecruitmentContent />
    </Suspense>
  );
}