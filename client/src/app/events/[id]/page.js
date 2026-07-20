// src/app/events/[id]/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ShareButtons from '@/app/components/ShareButtons';
import {
  Calendar, MapPin, Info, AlertTriangle, Plus,
  Cpu, User, CheckCircle2, X, ImageOff,
  ChevronLeft, ChevronRight, Volume2, Globe, Shield, Star, Mail, Pencil, ArrowLeft, Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function ProjectCard({ project }) {
  const progress = Math.min((project.collectedAmount / project.targetAmount) * 100, 100);

  return (
    <Link href={`/projects/${project.id}`} className="block bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-pink-200 transition-all overflow-hidden group">
      <div className="h-40 bg-slate-100 relative overflow-hidden">
        {project.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">No Image</div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
          {project.status === 'FUNDRAISING' ? '募集中' : project.status === 'SUCCESSFUL' ? '達成！' : project.status}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-pink-600 transition-colors">{project.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          {project.planner?.iconUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={project.planner.iconUrl} alt="planner" className="w-4 h-4 rounded-full object-cover" loading="lazy" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-slate-200 block shrink-0" />
          )}
          {project.planner?.handleName || '退会済みユーザー'}
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
          <div className="bg-pink-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-pink-500 font-bold">{progress.toFixed(0)}%</span>
          <span className="text-slate-400">あと {(project.targetAmount - project.collectedAmount).toLocaleString()} pt</span>
        </div>
      </div>
    </Link>
  );
}

function VenueEditModal({ event, onClose, onUpdate }) {
  const [venueName, setVenueName] = useState(event.venue?.venueName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!venueName.trim()) return toast.error('会場名を入力してください');
    setIsSubmitting(true);
    const toastId = toast.loading('更新中...');
    try {
      const token = window.__flastalToken;
      const res = await fetch(`${API_URL}/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ venueName }),
      });
      if (res.ok) {
        toast.success('会場情報を更新しました', { id: toastId });
        onUpdate();
        onClose();
      } else {
        throw new Error('更新エラー');
      }
    } catch {
      toast.error('更新に失敗しました', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={22} /></button>
        <h3 className="text-xl font-black mb-2 text-slate-800 flex items-center gap-2"><MapPin className="text-pink-500" size={20} /> 会場の変更</h3>
        <p className="text-xs font-bold text-slate-500 mb-4 leading-relaxed">新しい会場名を入力してください。<br />登録がない場合は自動でシステムに追加されます。</p>
        <form onSubmit={handleSubmit}>
          <input
            className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold text-[16px] focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-50 outline-none transition-all"
            placeholder="会場名を入力 (例: 幕張メッセ)"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-xl transition-colors">キャンセル</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-black shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">変更を保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

function LiveStreamEmbed({ youtubeUrl, twitcastingUrl }) {
  const ytId = extractYouTubeId(youtubeUrl);
  if (ytId) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }
  if (twitcastingUrl) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
        <iframe src={twitcastingUrl} allowFullScreen className="absolute inset-0 w-full h-full" />
      </div>
    );
  }
  return null;
}

function ReportModal({ eventId, onClose }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    if (!reason) return toast.error('理由を入力してください');
    setIsSubmitting(true);
    try {
      const token = window.__flastalToken;
      const res = await fetch(`${API_URL}/api/events/${eventId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        toast.success('運営に通報しました');
        onClose();
      } else {
        toast.error('送信エラー');
      }
    } catch { toast.error('送信エラー'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={22} /></button>
        <h3 className="text-xl font-bold mb-2 text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> 問題を報告</h3>
        <p className="text-xs text-slate-500 mb-4">虚偽の情報や、既に中止・延期になったイベントなどを報告してください。</p>
        <textarea
          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-[16px] h-24 focus:border-red-300 outline-none resize-none"
          placeholder="理由を入力..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-lg">キャンセル</button>
          <button onClick={handleReport} disabled={isSubmitting} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-50">報告する</button>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showVenueEditModal, setShowVenueEditModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`);
      if (!res.ok) throw new Error('イベントが見つかりません');
      setEvent(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) fetchEvent(); }, [id, fetchEvent]);

  const isOwner = user && (user.role === 'ADMIN' || user.id === event?.creator?.id || user.id === event?.organizer?.id);

  const isLiveNow = (() => {
    if (!event) return false;
    const now = new Date();
    const start = event.startDate ? new Date(event.startDate) : null;
    const end = event.endDate ? new Date(event.endDate) : null;
    if (!start || !end) return false;
    return start <= now && now <= end;
  })();

  const nextImage = () => {
    if (!event?.imageUrls) return;
    setCurrentImageIndex((prev) => (prev + 1) % event.imageUrls.length);
  };
  const prevImage = () => {
    if (!event?.imageUrls) return;
    setCurrentImageIndex((prev) => (prev - 1 + event.imageUrls.length) % event.imageUrls.length);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400" />
    </div>
  );
  if (!event) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
      <p className="mb-4">イベントが見つかりませんでした。</p>
      <Link href="/events" className="text-pink-500 font-bold hover:underline">イベント一覧へ戻る</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-32">

      {/* フローティング戻るボタン */}
      <button
        onClick={() => router.back()}
        className="fixed left-4 z-40 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-100 active:scale-90 transition-transform"
        style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
        aria-label="戻る"
      >
        <ArrowLeft size={18} className="text-slate-700" />
      </button>

      {/* ヒーロー: 全幅画像 + グラデーションオーバーレイ */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-slate-900">
        {event.imageUrls && event.imageUrls.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrls[currentImageIndex]}
              alt={`${event.title} - ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            {event.imageUrls.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all active:scale-90">
                  <ChevronLeft size={22} />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all active:scale-90">
                  <ChevronRight size={22} />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {event.imageUrls.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-900 to-rose-900">
            <ImageOff size={56} className="text-white/30 mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/30">No Image</span>
          </div>
        )}

        {/* グラデーションオーバーレイ + タイトル + バッジ */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 pointer-events-none">
          <div className="flex flex-wrap gap-2 mb-3">
            {isLiveNow && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/95 backdrop-blur-sm text-white rounded-full text-[10px] font-black border border-white/20 animate-pulse shadow-lg shadow-red-900/40">
                <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
                LIVE配信中
              </span>
            )}
            {event.organizer ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/90 backdrop-blur-sm text-white rounded-full text-[10px] font-black border border-white/20">
                <Shield size={10} /> 公式主催者: {event.organizer.name}
              </span>
            ) : event.sourceType === 'AI' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-[10px] font-black border border-white/20">
                <Cpu size={10} /> AI自動収集
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-[10px] font-black border border-white/20">
                <User size={10} /> ユーザー投稿
              </span>
            )}
            {event.isIllustratorRecruiting && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600/90 backdrop-blur-sm text-white rounded-full text-[10px] font-black animate-pulse">
                <Star size={10} className="fill-white" /> 神絵師募集中！
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-lg">
            {event.title}
          </h1>
        </div>
      </div>

      {/* ライブ配信埋め込み */}
      {(event.youtubeUrl || event.twitcastingUrl) && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {isLiveNow && (
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-black shadow-md shadow-red-300/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white inline-block" />
                LIVE配信中
              </span>
              <span className="text-xs text-slate-500 font-bold">現在このイベントは配信中です</span>
            </div>
          )}
          <LiveStreamEmbed youtubeUrl={event.youtubeUrl} twitcastingUrl={event.twitcastingUrl} />
        </div>
      )}

      {/* 主催者アナウンスバナー */}
      {event.announcement && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-4 px-4 shadow-md"
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full shrink-0 shadow-inner">
              <Volume2 className="animate-pulse" size={15} />
              <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Shield size={10} /> Official
              </span>
            </div>
            <p className="text-sm font-black tracking-tight leading-relaxed">
              {event.announcement}
            </p>
          </div>
        </motion.div>
      )}

      {/* インフォ・CTA カード群 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* 日時 / 会場 ガラスカード */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row gap-4"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center shrink-0">
              <Calendar className="text-pink-500" size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
              <p className="text-sm font-bold text-slate-800">
                {new Date(event.eventDate).toLocaleString('ja-JP', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  weekday: 'short', hour: '2-digit', minute: '2-digit',
                  timeZone: 'Asia/Tokyo',
                })}
              </p>
            </div>
          </div>
          <div className="w-px bg-slate-100 hidden sm:block" />
          <div className="flex items-center gap-3 flex-1 group relative">
            <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center shrink-0">
              <MapPin className="text-pink-500" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Venue</p>
              <p className="text-sm font-bold text-slate-800 truncate">{event.venue ? event.venue.venueName : '会場未定'}</p>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowVenueEditModal(true)}
                className="ml-1 p-2 bg-slate-100 text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                title="会場を変更する"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* SNS・公式サイト + シェアボタン */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Links & Share</p>
          <div className="flex flex-wrap gap-2">
            {event.officialWebsite && (
              <a href={event.officialWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-sm active:scale-95">
                <Globe size={14} /> 公式サイト
              </a>
            )}
            {event.twitterUrl && (
              <a href={event.twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200 active:scale-95" aria-label="X (Twitter)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                X (Twitter)
              </a>
            )}
            {event.instagramUrl && (
              <a href={event.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all border border-rose-100 active:scale-95" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" /></svg>
                Instagram
              </a>
            )}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <Share2 size={13} className="text-slate-400" />
              <ShareButtons text={`${event.title} にフラスタを贈りませんか？イベント詳細はこちら🌸`} />
            </div>
          </div>
        </motion.div>

        {/* イラスト公募セクション */}
        {event.isIllustratorRecruiting && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 shadow-sm relative overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 text-rose-100 opacity-50 rotate-12">
              <Star size={100} className="fill-rose-100" />
            </div>
            <div className="relative z-10">
              <h3 className="text-rose-800 font-black mb-3 flex items-center gap-2">
                <Pencil size={17} /> このイベントのイラストレーターを募集中！
              </h3>
              <p className="text-rose-700 text-sm whitespace-pre-wrap leading-relaxed mb-5">
                {event.illustratorRequirements || '募集条件の詳細は主催者にお問い合わせください。'}
              </p>
              <a
                href={event.twitterUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-black hover:bg-rose-700 transition-all shadow-md active:scale-95"
              >
                <Mail size={15} /> 主催者に連絡・応募する
              </a>
            </div>
          </motion.div>
        )}

        {/* イベント説明 */}
        {event.description && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">About</p>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </motion.div>
        )}

        {/* レギュレーション */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-2"
        >
          <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2 px-1">
            <Info className="text-pink-500" size={18} /> フラスタ・レギュレーション
          </h2>
          <div className={`p-5 rounded-[2rem] border-2 ${event.isStandAllowed ? 'bg-white border-emerald-50 shadow-sm' : 'bg-amber-50 border-amber-100'}`}>
            <div className="flex items-start gap-4">
              {event.isStandAllowed ? (
                <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 shrink-0">
                  <CheckCircle2 size={20} />
                </div>
              ) : (
                <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 shrink-0">
                  <AlertTriangle size={20} />
                </div>
              )}
              <div>
                <h3 className={`font-bold text-base mb-1 ${event.isStandAllowed ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {event.isStandAllowed ? 'スタンド花（フラスタ）の受け入れOK' : '受け入れ可否が確認できていません'}
                </h3>
                {event.regulationNote ? (
                  <p className="text-slate-700 mt-2 whitespace-pre-wrap text-sm leading-relaxed">{event.regulationNote}</p>
                ) : (
                  <p className="text-slate-500 mt-1 text-sm">
                    {event.isStandAllowed
                      ? '特記事項はありません。会場の一般的なルールに従ってください。'
                      : '公式情報や会場のルールを必ずご確認ください。'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 企画一覧 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-3 px-1">
            <h2 className="text-xl font-black text-slate-900">
              開催中のフラスタ企画
              <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{event.projects?.length || 0}件</span>
            </h2>
          </div>

          {event.projects && event.projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-100 p-12 text-center">
              <p className="text-slate-400 mb-4 font-bold">まだこのイベントの企画は立ち上がっていません。</p>
              {event.isStandAllowed && (
                <Link href={`/projects/create?eventId=${event.id}`} className="text-pink-500 font-black text-sm hover:underline inline-flex items-center gap-1">
                  あなたが最初の企画者になりませんか？ <Plus size={14} />
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* 通報リンク */}
        <div className="pt-2 pb-4 flex justify-center">
          <button
            onClick={() => isAuthenticated ? setShowReportModal(true) : toast.error('ログインが必要です')}
            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle size={12} /> この情報を通報する
          </button>
        </div>
      </div>

      {/* 受付不可バッジ (モバイル) */}
      {!event.isStandAllowed && (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 md:hidden z-30">
          <div className="w-full px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-2xl text-xs text-center flex items-center justify-center gap-2 shadow-lg">
            <AlertTriangle size={13} /> フラスタ受付 不可/未確認
          </div>
        </div>
      )}

      {/* 受付OK: 大きなCTAボタン (全デバイス) */}
      {event.isStandAllowed && (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-30 max-w-lg mx-auto">
          <Link
            href={`/projects/create?eventId=${event.id}`}
            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-[1.5rem] shadow-2xl shadow-pink-300/40 active:scale-95 transition-transform text-base"
          >
            <Plus size={22} /> 企画を立てる
          </Link>
        </div>
      )}

      {showReportModal && <ReportModal eventId={event.id} onClose={() => setShowReportModal(false)} />}
      {showVenueEditModal && <VenueEditModal event={event} onClose={() => setShowVenueEditModal(false)} onUpdate={fetchEvent} />}
    </div>
  );
}
