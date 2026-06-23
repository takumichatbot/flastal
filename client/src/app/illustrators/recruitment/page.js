'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Calendar, MapPin, ArrowRight, Info, Search, Loader2,
  PenTool, Sparkles, X, Coins, Send, ChevronLeft
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function ApplicationModal({ event, onClose, onSuccess }) {
  const { authenticatedFetch } = useAuth();
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
      const res = await authenticatedFetch(`${API_URL}/api/illustrators/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, proposedAmount: parseInt(proposedAmount), message }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || '立候補の送信に失敗しました'); }
      toast.success('立候補が完了しました！', { id: toastId, duration: 6000 });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm p-4 z-[100] flex items-end sm:items-center justify-center">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <PenTool size={16} className="text-amber-500" /> この募集に立候補する
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Target Event</p>
            <p className="font-black text-slate-800 text-sm">{event.title}</p>
          </div>

          <form id="appForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">希望金額 (pt)</label>
              <div className="relative">
                <Coins size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                <input type="number" min="100" required value={proposedAmount} onChange={e => setProposedAmount(e.target.value)}
                  placeholder="例: 5000"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-200" />
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-1 ml-0.5">基本料金や作業量に合わせて入力してください。</p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">提案メッセージ・アピール</label>
              <textarea required value={message} onChange={e => setMessage(e.target.value)} rows="4"
                placeholder="例: はじめまして！条件を拝見し、私の得意な可愛い系の絵柄がぴったりだと思い立候補しました。"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-200 resize-none" />
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 shrink-0">
          <button type="submit" form="appForm"
            disabled={isSubmitting || !proposedAmount || !message.trim()}
            className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {isSubmitting ? '処理中...' : '立候補を送信する'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RecruitmentContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchRecruitments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/events/public?illustratorOnly=true`);
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      console.error(e);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecruitments(); }, [fetchRecruitments]);

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.illustratorRequirements || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApply = (event) => {
    if (!user) { toast.error('立候補するにはログインが必要です'); return router.push('/illustrators/login'); }
    if (user.role !== 'ILLUSTRATOR') { toast.error('クリエイターとして登録したユーザーのみ立候補できます。'); return; }
    setSelectedEvent(event);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5] font-sans">

      {/* ── Fixed Header ── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-14 flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 shrink-0">
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2 mr-auto">
              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                <Star size={14} className="text-amber-500 fill-amber-500" />
              </div>
              <span className="font-black text-slate-800 text-sm">クリエイター公募掲示板</span>
            </div>

            {/* Search */}
            <div className="relative w-48 sm:w-64 shrink-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="イベント名で検索..."
                className="w-full pl-8 pr-3 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-5">

        {/* Subtitle */}
        <div className="mb-5 flex items-center gap-2">
          <PenTool size={13} className="text-amber-500" />
          <p className="text-xs font-bold text-slate-500">フラスタのパネルイラストを描いてくれるクリエイターを主催者が探しています🎨</p>
        </div>

        {/* Count */}
        <p className="text-[11px] font-bold text-slate-400 mb-4 px-1">
          {loading ? '読み込み中...' : `${filtered.length}件の募集`}
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-amber-500 mb-3" size={32} />
            <p className="text-xs font-bold text-slate-400">募集中イベントを探しています...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white rounded-full border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
              <Star size={28} className="text-slate-200" />
            </div>
            <p className="font-black text-slate-700 text-base mb-1.5">募集中のイベントはありません</p>
            <p className="text-xs font-bold text-slate-400">
              {searchTerm ? '別のキーワードで検索してみてください' : '現在、イラストレーターを募集しているイベントはありません。'}
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                className="mt-4 px-5 py-2.5 bg-slate-900 text-white font-black rounded-full text-xs">
                検索をクリア
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((event, i) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <div className="group bg-white rounded-[1.75rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-amber-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">

                    {/* Image */}
                    <div className="h-44 bg-slate-100 relative overflow-hidden shrink-0">
                      {event.imageUrls?.[0] ? (
                        <Image src={event.imageUrls[0]} alt={event.title} fill sizes="(max-width:640px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500">
                          <Star size={36} className="text-white opacity-40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full border border-amber-400">
                          <Sparkles size={9} /> 絵師募集中
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-black text-slate-800 text-sm leading-tight line-clamp-2 mb-3 group-hover:text-amber-500 transition-colors">
                        {event.title}
                      </h3>

                      {/* Requirements */}
                      <div className="bg-amber-50 rounded-xl p-3 mb-3 border border-amber-100 flex-grow">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Info size={9} /> 募集条件
                        </p>
                        <p className="text-xs text-amber-900/70 line-clamp-3 leading-relaxed font-medium">
                          {event.illustratorRequirements || '詳細ページをご確認ください。'}
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-col gap-1.5 mb-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <Calendar size={11} className="text-sky-400 shrink-0" />
                          {new Date(event.eventDate).toLocaleDateString('ja-JP')}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <MapPin size={11} className="text-emerald-400 shrink-0" />
                          <span className="truncate">{event.venue?.venueName || '会場未定'}</span>
                        </div>
                      </div>

                      <div className="mt-auto space-y-2">
                        <button onClick={() => handleApply(event)}
                          className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xs rounded-xl shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                          <PenTool size={13} /> この募集に立候補する
                        </button>
                        <Link href={`/events/${event.id}`}
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-50 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-100 transition-all border border-slate-100">
                          イベント詳細を見る <ArrowRight size={12} />
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

      <AnimatePresence>
        {selectedEvent && (
          <ApplicationModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onSuccess={fetchRecruitments}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function IllustratorRecruitmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    }>
      <RecruitmentContent />
    </Suspense>
  );
}
