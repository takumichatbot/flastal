'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ShareButtons from '@/app/components/ShareButtons';
import {
  Clock, CheckCircle2, User, X, Zap, AlertCircle, ChevronLeft,
  Coins, RefreshCw, PenTool, Sparkles, Image as ImageIcon,
  Send, Loader2, ZoomIn, ExternalLink, Share2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

// ── Offer Modal ─────────────────────────────────────────────────
function OfferModal({ illustratorId, illustratorName, basePrice, onClose, onOfferSuccess }) {
  const router = useRouter();
  const { user, authenticatedFetch } = useAuth();
  const [myProjects, setMyProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [offerAmount, setOfferAmount] = useState(basePrice || 5000);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!user) return;
    authenticatedFetch(`${API_URL}/api/users/${user.id}/created-projects`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const active = data.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELED');
        setMyProjects(active);
        if (active.length > 0) setSelectedProjectId(active[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingProjects(false));
  }, [user, authenticatedFetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return toast.error('依頼する企画を選択してください');
    if (!offerAmount || offerAmount < 100) return toast.error('正しい金額を入力してください');
    if (user.points < offerAmount) return toast.error('ポイントが不足しています');
    setIsSubmitting(true);
    const toastId = toast.loading('オファーを送信中...');
    try {
      const res = await authenticatedFetch(`${API_URL}/api/illustrators/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId, illustratorId, amount: parseInt(offerAmount), message }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'オファーの送信に失敗しました'); }
      toast.success('オファーを送信しました！', { id: toastId, duration: 6000 });
      onOfferSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message, { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm p-4 z-[100] flex items-end sm:items-center justify-center">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <PenTool size={16} className="text-amber-500" /> イラスト作成を依頼する
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shrink-0"><User size={18} /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Creator</p>
              <p className="font-black text-slate-800 text-sm">{illustratorName} さんへ</p>
            </div>
          </div>

          <form id="offerForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">対象の企画</label>
              {loadingProjects ? (
                <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> 読み込み中...
                </div>
              ) : myProjects.length > 0 ? (
                <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-200">
                  {myProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              ) : (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                  <p className="text-xs text-rose-600 font-bold mb-1">主催中の企画がありません</p>
                  <Link href="/projects/create" className="text-xs font-black text-rose-500 underline">新しく企画を作成する</Link>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">依頼金額 (pt)</label>
                <span className="text-[10px] text-slate-400 font-bold">所持: <b className="text-amber-500">{user?.points?.toLocaleString() || 0}pt</b></span>
              </div>
              <div className="relative">
                <Coins size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                <input type="number" min="100" required value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-200" />
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-1 ml-0.5 flex items-center gap-0.5">
                <AlertCircle size={9} /> 承認後、ポイントがシステムにキープされます。
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ご挨拶・要望</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows="3"
                placeholder="例: はじめまして！素敵な絵柄に惹かれてオファーさせていただきました。"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-200 resize-none" />
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 shrink-0 space-y-2">
          <button type="submit" form="offerForm"
            disabled={isSubmitting || !selectedProjectId || !offerAmount || user?.points < offerAmount}
            className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {isSubmitting ? '処理中...' : 'ポイントを使って依頼する'}
          </button>
          {user && user.points < offerAmount && (
            <Link href="/points" className="flex items-center justify-center gap-1 text-xs font-black text-amber-500 py-1">
              <Zap size={12} /> ポイントをチャージする
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Lightbox ────────────────────────────────────────────────────
function ImageLightbox({ url, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white">
        <X size={20} />
      </button>
      <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        src={url} alt="" className="max-w-full max-h-[88vh] object-contain rounded-2xl pointer-events-none" />
    </div>
  );
}

// ── Stat chip ───────────────────────────────────────────────────
function StatChip({ icon, label, value, color = 'amber' }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return (
    <div className={cn('flex items-center gap-2.5 px-4 py-3 rounded-2xl border', colors[color])}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</p>
        <p className="font-black text-sm leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────
function IllustratorDetailContent() {
  const { id } = useParams();
  const { user, isLoading: authLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');

  const [illustrator, setIllustrator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const fetchIllustrator = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/illustrators/${id}`);
      if (!res.ok) throw new Error(res.status === 404 ? 'クリエイターが見つかりませんでした。' : '情報の取得に失敗しました。');
      setIllustrator(await res.json());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchIllustrator(); }, [fetchIllustrator]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF8F5]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  if (!illustrator) {
    const isOwnProfile = user && (user.role === 'ILLUSTRATOR' || user.roles?.includes('ILLUSTRATOR')) && user.id === id;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-5">
          <AlertCircle size={36} className={isOwnProfile ? 'text-amber-400' : 'text-slate-300'} />
        </div>
        {isOwnProfile ? (
          <>
            <h2 className="text-lg font-black text-slate-800 mb-1">プロフィールが未設定です</h2>
            <p className="text-sm font-bold text-slate-400 mb-8">絵師プロフィールを作成して案件を受け付けましょう。</p>
            <button onClick={() => router.push('/illustrators/profile/edit')}
              className="px-6 py-3 bg-amber-500 text-white font-black rounded-full text-sm flex items-center gap-2">
              <PenTool size={16} /> プロフィールを作成する
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-black text-slate-800 mb-1">クリエイターが見つかりませんでした</h2>
            <p className="text-sm font-bold text-slate-400 mb-8">お探しのページは存在しないか、削除されました。</p>
            <button onClick={() => router.push('/illustrators')}
              className="px-6 py-3 bg-slate-900 text-white font-black rounded-full text-sm flex items-center gap-2">
              <ChevronLeft size={16} /> 一覧へ戻る
            </button>
          </>
        )}
      </div>
    );
  }

  const isMyProfile = user?.roles?.includes('ILLUSTRATOR') || user?.role === 'ILLUSTRATOR' && user?.id === illustrator.userId;
  const canOffer = !user || !(user?.roles?.includes('ILLUSTRATOR') || user?.role === 'ILLUSTRATOR');
  const displayName = illustrator.name || illustrator.user?.handleName || 'クリエイター';
  const iconSrc = illustrator.iconUrl || illustrator.user?.iconUrl;

  return (
    <>
      <div className="min-h-screen bg-[#FAF8F5] font-sans pb-28">

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 active:bg-slate-200">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              {iconSrc ? (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-100 shrink-0">
                  <Image src={iconSrc} alt="" width={28} height={28} className="object-cover" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <PenTool size={12} className="text-amber-400" />
                </div>
              )}
              <span className="font-black text-slate-800 text-sm truncate">{displayName}</span>
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0">
              {projectIdFromUrl && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  企画オファー選択中
                </span>
              )}
              {isMyProfile && (
                <Link href="/illustrators/profile/edit"
                  className="text-[11px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                  編集
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">

          {/* ── Hero card ── */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-5">
            {/* Banner gradient */}
            <div className="h-24 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 relative">
              {illustrator.portfolioUrls?.[0] && (
                <Image src={illustrator.portfolioUrls[0]} alt="" fill className="object-cover opacity-20 mix-blend-overlay" />
              )}
            </div>

            <div className="px-5 pb-5">
              {/* Avatar */}
              <div className="relative -mt-10 mb-4">
                <div className="w-20 h-20 rounded-[1.25rem] border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                  {iconSrc ? (
                    <Image src={iconSrc} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-50 flex items-center justify-center">
                      <User size={32} className="text-amber-200" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                      <PenTool size={9} /> Illustrator
                    </span>
                    {illustrator.isAcceptingRequests ? (
                      <span className="flex items-center gap-1 text-[9px] font-black text-white bg-emerald-500 px-2.5 py-1 rounded-full">
                        <Sparkles size={9} /> 受付中
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">停止中</span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-tight mb-1">{displayName}</h1>

                  {illustrator.socialLink && (
                    <a href={illustrator.socialLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-500 hover:text-sky-600 mb-3">
                      <ExternalLink size={11} /> {illustrator.socialLink.replace(/^https?:\/\//, '')}
                    </a>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {(illustrator.tags || []).map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100 font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Desktop CTA */}
                {canOffer && !isMyProfile && (
                  <button
                    onClick={() => { if (!user) return router.push('/login'); setIsModalOpen(true); }}
                    disabled={!illustrator.isAcceptingRequests}
                    className={cn(
                      'hidden sm:flex shrink-0 items-center gap-2 px-6 py-3.5 font-black text-white rounded-2xl shadow-lg transition-all text-sm',
                      illustrator.isAcceptingRequests
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:shadow-amber-200 hover:scale-105 active:scale-95'
                        : 'bg-slate-200 cursor-not-allowed'
                    )}>
                    <Zap size={16} />
                    {illustrator.isAcceptingRequests ? '依頼オファーを送る' : '受付停止中'}
                  </button>
                )}
              </div>

              {/* Share */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <Share2 size={12} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Share</span>
                <ShareButtons text={`フラスタのイラスト制作なら ${displayName} さんがおすすめ！🎨`} />
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <StatChip icon={<Coins size={16} />} label="基本料金" value={`${illustrator.basePrice?.toLocaleString() || '---'}pt〜`} color="amber" />
            <StatChip icon={<Clock size={16} />} label="基本納期" value={`約${illustrator.deliveryDays || '-'}日`} color="sky" />
            <StatChip icon={<RefreshCw size={16} />} label="リテイク" value={`${illustrator.retakeCount || 0}回`} color="emerald" />
          </div>

          {/* ── Main layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left: Bio */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">自己紹介</h2>
                <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                  {illustrator.bio || '自己紹介文はまだ設定されていません。'}
                </p>
              </div>
            </div>

            {/* Right: Portfolio */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <ImageIcon size={16} className="text-amber-500" /> ポートフォリオ
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400">{illustrator.portfolioUrls?.length || 0}枚</span>
                </div>

                {illustrator.portfolioUrls?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {illustrator.portfolioUrls.map((url, idx) => (
                      <div key={idx} onClick={() => setPreviewImageUrl(url)}
                        className="relative aspect-square rounded-2xl overflow-hidden group cursor-zoom-in bg-slate-100 border border-slate-100">
                        <Image src={url} alt={`Portfolio ${idx}`} fill sizes="(max-width:640px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn size={20} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                    <ImageIcon size={36} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-xs font-bold text-slate-400">ポートフォリオ画像がありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed mobile CTA ── */}
      {canOffer && !isMyProfile && (
        <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => { if (!user) return router.push('/login'); setIsModalOpen(true); }}
            disabled={!illustrator.isAcceptingRequests}
            className={cn(
              'w-full mt-3 py-4 font-black text-white rounded-2xl flex items-center justify-center gap-2 text-sm active:scale-95 transition-all',
              illustrator.isAcceptingRequests
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-xl shadow-amber-200'
                : 'bg-slate-200'
            )}>
            <Zap size={16} />
            {illustrator.isAcceptingRequests ? 'イラスト作成を依頼する' : '現在受付停止中'}
          </button>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <OfferModal
            illustratorId={illustrator.id}
            illustratorName={displayName}
            basePrice={illustrator.basePrice}
            onClose={() => setIsModalOpen(false)}
            onOfferSuccess={() => { setIsModalOpen(false); router.push('/mypage'); }}
          />
        )}
        {previewImageUrl && <ImageLightbox url={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
      </AnimatePresence>
    </>
  );
}

export default function IllustratorDetailClient() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#FAF8F5]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    }>
      <IllustratorDetailContent />
    </Suspense>
  );
}
