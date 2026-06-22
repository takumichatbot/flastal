'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, ImageIcon, MessageCircle, User, PenTool, Send, Loader2, Building2, Target, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { AppCard, JpText } from './shared.js';
import VideoEmbed from '@/app/components/VideoEmbed';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function SponsorsSection({ projectId }) {
  const [sponsors, setSponsors] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/api/projects/${projectId}/sponsors`)
      .then(r => r.ok ? r.json() : []).then(setSponsors);
  }, [projectId]);
  if (sponsors.length === 0) return null;
  return (
    <AppCard>
      <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
        <Building2 size={15} className="text-slate-400" /> 企業スポンサー
      </h3>
      <div className="flex flex-wrap gap-3">
        {sponsors.map(s => (
          <a key={s.id} href={s.websiteUrl || '#'} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 hover:shadow-sm transition-shadow">
            {s.logoUrl && <Image src={s.logoUrl} alt={s.companyName} width={28} height={28} className="rounded object-contain" />}
            <span className="text-xs font-black text-slate-700">{s.companyName}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase">{s.tier}</span>
          </a>
        ))}
      </div>
    </AppCard>
  );
}

function StretchGoalsSection({ project, isPlanner }) {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ targetAmount: '', title: '', description: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetch(`${API_URL}/api/projects/${project.id}/stretch-goals`)
      .then(r => r.ok ? r.json() : []).then(setGoals);
  }, [project.id]);

  const handleAdd = async () => {
    if (!form.targetAmount || !form.title) return;
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    const res = await fetch(`${API_URL}/api/projects/${project.id}/stretch-goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, order: goals.length }),
    });
    if (res.ok) {
      const g = await res.json();
      setGoals(prev => [...prev, g]);
      setForm({ targetAmount: '', title: '', description: '' });
      setShowForm(false);
      toast.success('ストレッチゴールを追加しました');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    const res = await fetch(`${API_URL}/api/projects/${project.id}/stretch-goals/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setGoals(prev => prev.filter(g => g.id !== id));
  };

  if (goals.length === 0 && !isPlanner) return null;

  const collectedAmount = project.collectedAmount || 0;

  return (
    <AppCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
          <Target size={15} className="text-emerald-500" /> ストレッチゴール
        </h3>
        {isPlanner && (
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-800">
            <Plus size={12} /> 追加
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
          <input value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
            placeholder="目標金額（円）" type="number" className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-200 bg-white outline-none" />
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="タイトル（例：追加デザインパネル実装）" className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-200 bg-white outline-none" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="詳細説明" rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-200 bg-white outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-lg">追加</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-slate-200 text-slate-600 text-xs font-black rounded-lg">キャンセル</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {goals.map(g => {
          const percent = Math.min(Math.round((collectedAmount / g.targetAmount) * 100), 100);
          return (
            <div key={g.id} className={`p-3 rounded-xl border ${g.achieved ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {g.achieved
                    ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    : <Target size={15} className="text-slate-400 shrink-0" />}
                  <div>
                    <p className="text-sm font-black text-slate-800">{g.title}</p>
                    <p className="text-[11px] text-slate-500">目標: {g.targetAmount.toLocaleString()}pt</p>
                  </div>
                </div>
                {isPlanner && !g.achieved && (
                  <button onClick={() => handleDelete(g.id)} className="text-slate-300 hover:text-rose-400 shrink-0">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              {!g.achieved && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>{collectedAmount.toLocaleString()} / {g.targetAmount.toLocaleString()} pt</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )}
              {g.description && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{g.description}</p>}
            </div>
          );
        })}
      </div>
    </AppCard>
  );
}

export default function OverviewTab({ ctx }) {
  const {
    project,
    setModalImageSrc, setIsImageModalOpen,
    isPlanner,
    showAnnouncementForm, setShowAnnouncementForm,
    handlePostAnnouncement,
    announcementTitle, setAnnouncementTitle,
    announcementContent, setAnnouncementContent,
    isPostingAnnouncement,
  } = ctx;

  return (
    <div className="space-y-6 md:space-y-8">
      <AppCard>
        <h2 className="text-lg md:text-xl font-black text-slate-800 mb-5 flex items-center gap-2">
          <Book className="text-slate-400" size={20} /> 企画の詳細
        </h2>
        <div className="text-slate-700 whitespace-pre-wrap leading-relaxed md:leading-loose font-medium text-xs sm:text-sm md:text-base">
          <JpText>{project.description}</JpText>
        </div>
        {project.videoUrl && <VideoEmbed url={project.videoUrl} className="mt-5" />}
      </AppCard>

      {/* 完了写真ギャラリー */}
      {project.status === 'COMPLETED' && project.completionImageUrls && project.completionImageUrls.filter(Boolean).length > 0 && (
        <div>
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            🎉 完成フラスタ写真
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {project.completionImageUrls.filter(Boolean).map((url, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-2xl overflow-hidden cursor-zoom-in border border-amber-100 shadow-sm hover:scale-[1.02] transition-transform"
                onClick={() => { setModalImageSrc(url); setIsImageModalOpen(true); }}
              >
                <Image src={url} alt={`完了写真 ${i + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* デザイン参考画像 */}
      {project.designImageUrls && project.designImageUrls.filter(Boolean).length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">デザイン参考画像</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {project.designImageUrls.filter(Boolean).map((url, i) => (
              <div
                key={i}
                className="relative shrink-0 w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden cursor-zoom-in border border-slate-100 shadow-sm hover:scale-[1.02] transition-transform"
                onClick={() => { setModalImageSrc(url); setIsImageModalOpen(true); }}
              >
                <Image src={url} alt={`デザイン参考 ${i + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                <span className="absolute bottom-2 left-3 text-[9px] font-black text-white/80 uppercase tracking-wider">参考 {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(project.designDetails || project.size || project.flowerTypes) && (
        <AppCard className="bg-pink-50/30 border border-pink-100">
          <h2 className="text-lg md:text-xl font-black text-slate-800 mb-5 flex items-center gap-2">
            <ImageIcon className="text-pink-400" size={20} /> デザインの希望
          </h2>
          <div className="space-y-3">
            {project.designDetails && (
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-pink-50 shadow-sm">
                <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest block mb-2">雰囲気・詳細</span>
                <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed">{project.designDetails}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {project.size && (
                <div className="bg-white p-4 rounded-2xl border border-pink-50 shadow-sm">
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest block mb-1.5">希望サイズ</span>
                  <p className="text-slate-700 font-black text-sm">{project.size}</p>
                </div>
              )}
              {project.flowerTypes && (
                <div className="bg-white p-4 rounded-2xl border border-pink-50 shadow-sm">
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest block mb-1.5">使いたい花</span>
                  <p className="text-slate-700 font-black text-sm">{project.flowerTypes}</p>
                </div>
              )}
            </div>
          </div>
        </AppCard>
      )}

      {/* 活動報告 */}
      <div className="pt-2">
        <div className="flex flex-row justify-between items-center gap-2 mb-4 px-1">
          <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
            <MessageCircle className="text-pink-500" size={20} /> 活動報告
          </h2>
          {isPlanner && (
            <button
              onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg text-xs font-black shadow-sm hover:bg-pink-600 transition-colors flex items-center gap-1.5"
            >
              <PenTool size={12} /> 新規投稿
            </button>
          )}
        </div>

        <AnimatePresence>
          {isPlanner && showAnnouncementForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handlePostAnnouncement}
              className="mb-5 p-4 md:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-20"
            >
              <input
                value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="タイトル (活動の進捗など)" disabled={isPostingAnnouncement}
                className="w-full p-3 mb-2 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-emerald-300 outline-none font-bold text-slate-800 text-sm transition-all disabled:opacity-50"
              />
              <textarea
                value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="本文を入力..." rows="3" disabled={isPostingAnnouncement}
                className="w-full p-3 mb-3 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-emerald-300 outline-none font-medium text-slate-700 text-sm resize-none transition-all disabled:opacity-50"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAnnouncementForm(false)} disabled={isPostingAnnouncement} className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg font-bold transition-colors disabled:opacity-50">キャンセル</button>
                <button type="submit" disabled={isPostingAnnouncement} className="px-5 py-2 bg-pink-500 text-white text-xs font-black rounded-lg hover:bg-pink-600 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50">
                  {isPostingAnnouncement ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  投稿する
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {project.announcements?.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {project.announcements.map(a => (
              <AppCard key={a.id} className="!p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                    {project.planner?.iconUrl
                      ? <Image src={project.planner.iconUrl} alt="" width={32} height={32} className="object-cover" />
                      : <User size={14} className="text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800">{project.planner?.handleName || project.planner?.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      {new Date(a.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <h3 className="font-black text-slate-800 text-sm md:text-base mb-1.5">{a.title}</h3>
                <p className="text-xs md:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium"><JpText>{a.content}</JpText></p>
              </AppCard>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 text-sm text-center py-12 bg-white rounded-2xl font-bold flex flex-col items-center shadow-sm">
            <MessageCircle size={28} className="text-slate-200 mb-2" />
            まだ活動報告はありません
          </div>
        )}
      </div>
      <StretchGoalsSection project={project} isPlanner={isPlanner} />
      <SponsorsSection projectId={project.id} />
    </div>
  );
}
