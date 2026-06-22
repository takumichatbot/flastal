'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Lock, MessageSquare, ImageIcon, CheckCircle2, UploadCloud,
  UserPlus, Brush, Download, Box, Plus, Trash2, User, RefreshCw, Loader2, Sparkles,
  Send, Shield, Users, Mail,
} from 'lucide-react';
import { AppCard, cn } from './shared.js';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ⑤ チームメンバー管理
function TeamSection({ project }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const isOwner = user?.id === project.plannerId;
  const token = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/projects/${project.id}/team/members`);
    if (res.ok) setMembers(await res.json());
  }, [project.id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${project.id}/team/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('招待しました');
      setInviteEmail('');
      fetchMembers();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleRemove = async (memberId) => {
    const res = await fetch(`${API_URL}/api/projects/${project.id}/team/members/${memberId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) { toast.success('削除しました'); fetchMembers(); }
  };

  if (!isOwner && members.length === 0) return null;

  return (
    <AppCard>
      <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
        <Users size={15} className="text-indigo-500" /> チームメンバー
      </h3>
      {members.length > 0 && (
        <div className="space-y-2 mb-4">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                {m.user.iconUrl ? <Image src={m.user.iconUrl} alt={m.user.handleName || 'ユーザーアイコン'} width={32} height={32} className="object-cover" /> : <User size={14} className="text-indigo-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">{m.user.handleName}</p>
                <p className="text-[10px] text-slate-400 truncate">{m.role}</p>
              </div>
              {isOwner && (
                <button onClick={() => handleRemove(m.user.id)} className="text-slate-300 hover:text-rose-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {isOwner && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="招待するメールアドレス"
              className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-400"
            />
          </div>
          <button onClick={handleInvite} disabled={loading}
            className="px-4 py-2.5 bg-indigo-500 text-white text-xs font-black rounded-xl disabled:opacity-50 flex items-center gap-1">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} 招待
          </button>
        </div>
      )}
    </AppCard>
  );
}

// ④ 達成メッセージ一斉送信
function BroadcastSection({ project }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const isOwner = user?.id === project.plannerId;

  if (!isOwner) return null;

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/projects/${project.id}/team/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(data.sent);
      toast.success(`${data.sent}人に送信しました`);
      setSubject(''); setMessage('');
    } catch (err) { toast.error(err.message); }
    finally { setSending(false); }
  };

  return (
    <AppCard>
      <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
        <Send size={15} className="text-rose-500" /> 全支援者へメッセージ
      </h3>
      {sent !== null && (
        <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-600 flex items-center gap-2">
          <CheckCircle2 size={13} /> {sent}人に送信しました
        </div>
      )}
      <div className="space-y-2">
        <input value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="件名（例：企画達成のお礼）"
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-rose-400" />
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="支援者へのメッセージ本文..."
          rows={4}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-rose-400 resize-none" />
        <button onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-black rounded-xl disabled:opacity-50">
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} 一斉送信
        </button>
      </div>
    </AppCard>
  );
}

// ③ 支援者限定コンテンツ
function ExclusiveSection({ project, isPlanner, isPledger }) {
  const [contents, setContents] = useState([]);
  const [locked, setLocked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', contentType: 'TEXT' });
  const token = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

  const fetchContents = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/projects/${project.id}/team/exclusive`, {
      headers: token() ? { Authorization: `Bearer ${token()}` } : {},
    });
    if (res.status === 403) { setLocked(true); return; }
    if (res.ok) setContents(await res.json());
  }, [project.id]);

  useEffect(() => { if (isPlanner || isPledger) fetchContents(); }, [fetchContents, isPlanner, isPledger]);

  if (!isPlanner && !isPledger) return null;

  const handleCreate = async () => {
    const res = await fetch(`${API_URL}/api/projects/${project.id}/team/exclusive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    });
    if (res.ok) { const c = await res.json(); setContents(p => [c, ...p]); setShowForm(false); setForm({ title: '', body: '', contentType: 'TEXT' }); toast.success('追加しました'); }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API_URL}/api/projects/${project.id}/team/exclusive/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) setContents(p => p.filter(c => c.id !== id));
  };

  return (
    <AppCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
          <Shield size={15} className="text-violet-500" /> 支援者限定コンテンツ
        </h3>
        {isPlanner && <button onClick={() => setShowForm(s => !s)} className="text-xs font-black text-violet-600 hover:text-violet-800 flex items-center gap-1"><Plus size={11} />追加</button>}
      </div>
      {locked && (
        <div className="text-center py-6 text-slate-400">
          <Lock size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs font-bold">このコンテンツは支援者限定です</p>
        </div>
      )}
      {showForm && (
        <div className="mb-4 p-3 bg-violet-50 rounded-xl border border-violet-100 space-y-2">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="タイトル" className="w-full px-3 py-2 text-sm rounded-lg border border-violet-200 bg-white outline-none" />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="内容" rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-violet-200 bg-white outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-1.5 bg-violet-500 text-white text-xs font-black rounded-lg">投稿</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-slate-200 text-slate-600 text-xs font-black rounded-lg">キャンセル</button>
          </div>
        </div>
      )}
      {!locked && contents.length === 0 && !showForm && <p className="text-xs text-slate-400 text-center py-4">まだコンテンツはありません</p>}
      <div className="space-y-2">
        {contents.map(c => (
          <div key={c.id} className="p-3 bg-violet-50 rounded-xl border border-violet-100">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-black text-slate-800">{c.title}</p>
              {isPlanner && <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-rose-400 shrink-0"><Trash2 size={12} /></button>}
            </div>
            {c.body && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{c.body}</p>}
          </div>
        ))}
      </div>
    </AppCard>
  );
}

function FloristMatcher({ projectId }) {
  const { authenticatedFetch } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await authenticatedFetch(`${API_URL}/api/projects/${projectId}/florist-match`);
      if (r.ok) setResult(await r.json());
    } finally { setLoading(false); }
  };

  return (
    <AppCard>
      <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
        <Sparkles size={15} className="text-violet-500" /> AI花屋マッチング
      </h3>
      {!result ? (
        <button onClick={run} disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          AIでおすすめ花屋を探す
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-bold">{result.explanation}</p>
          {result.florists.map(f => (
            <div key={f.id} className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800">{f.shopName}</p>
                <p className="text-[11px] text-slate-500 font-bold mb-1">{f.address}</p>
                <p className="text-[11px] text-violet-600 font-bold italic">「{f.aiReason}」</p>
              </div>
              <Link href={`/florists/${f.id}`} className="shrink-0 text-xs font-black text-violet-600 hover:text-violet-700 underline">詳細</Link>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

export default function CollaborationTab({ ctx }) {
  const {
    project, isPlanner, isPledger, isFlorist, isAssignedIllustrator,
    aiSummary,
    collabTab, setCollabTab,
    activeOffer,
    socket, setAiSummary, fetchProject,
    newTaskTitle, setNewTaskTitle,
    handleAddTask, handleToggleTask, handleDeleteTask,
    handleUpload,
    isIllustrationUploading,
    handleAcceptIllustration, handleRejectIllustration,
    handleDownloadIllustration,
    handleAcceptApplication,
    setIsArModalOpen,
    setModalImageSrc, setIsImageModalOpen,
    floristName,
    // lazy-loaded components passed from parent
    GroupChat, MoodboardPostForm, MoodboardDisplay, PanelPreviewer,
  } = ctx;

  return (
    <div className="space-y-4">
      {aiSummary && (
        <AppCard className="bg-slate-900 text-white border-slate-800 !p-4 md:!p-6">
          <h2 className="text-sm font-black text-slate-300 mb-2 flex items-center">
            <Wand2 className="mr-2 text-slate-400" size={16} /> AI Summary
          </h2>
          <div className="text-xs leading-relaxed font-medium prose prose-invert max-w-none line-clamp-3">
            {aiSummary}
          </div>
        </AppCard>
      )}

      <TeamSection project={project} />
      <BroadcastSection project={project} />
      <ExclusiveSection project={project} isPlanner={isPlanner} isPledger={isPledger} />
      {isPlanner && <FloristMatcher projectId={project.id} />}

      {!(isPlanner || isPledger || isFlorist || isAssignedIllustrator) && (
        <AppCard className="text-center py-16 bg-slate-50">
          <Lock size={32} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-black text-slate-700 mb-2">参加者限定スペース</h3>
          <p className="text-slate-500 font-bold text-sm">共同作業は、支援者と関係者のみ利用できます。</p>
        </AppCard>
      )}

      {(isPlanner || isPledger || isFlorist || isAssignedIllustrator) && (
        <>
          {/* サブタブナビ */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <button onClick={() => setCollabTab('chat')} className={cn('px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all', collabTab === 'chat' ? 'bg-pink-500 text-white shadow-md shadow-pink-100' : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-200')}>
              <MessageSquare size={16} /> ミーティング
            </button>
            {isPlanner && activeOffer && (
              <Link href={`/projects/${project.id}/florist-chat`} className="px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all bg-pink-500 text-white hover:bg-pink-600 shadow-md border border-pink-400">
                <MessageSquare size={16} /> 花屋と個別相談
              </Link>
            )}
            <button onClick={() => setCollabTab('board')} className={cn('px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all', collabTab === 'board' ? 'bg-pink-500 text-white shadow-md shadow-pink-100' : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-200')}>
              <ImageIcon size={16} /> アイデアボード
            </button>
            {isPlanner && (
              <button onClick={() => setCollabTab('tasks')} className={cn('px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all', collabTab === 'tasks' ? 'bg-pink-500 text-white shadow-md shadow-pink-100' : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-200')}>
                <CheckCircle2 size={16} /> やることリスト
              </button>
            )}
            <button onClick={() => setCollabTab('tools')} className={cn('px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all', collabTab === 'tools' ? 'bg-pink-500 text-white shadow-md shadow-pink-100' : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-200')}>
              <UploadCloud size={16} /> 提出・データ
            </button>
            {isPlanner && !project.illustratorId && (
              <button onClick={() => setCollabTab('applicants')} className={cn('px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all', collabTab === 'applicants' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-sm border border-amber-200')}>
                <UserPlus size={16} /> クリエイター応募
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={collabTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>

              {/* チャット */}
              {collabTab === 'chat' && GroupChat && (
                <AppCard className="!p-0 overflow-hidden flex flex-col h-[600px] border-pink-100 ring-4 ring-pink-50">
                  <div className="p-4 border-b border-slate-100 bg-pink-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="text-pink-500" size={18} />
                      <h2 className="text-sm font-black text-slate-800">企画チャット</h2>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden relative bg-white">
                    <GroupChat project={project} user={ctx.user} isPlanner={isPlanner} isPledger={isPledger} socket={socket} onSummaryUpdate={setAiSummary} summary={aiSummary} />
                  </div>
                </AppCard>
              )}

              {/* アイデアボード */}
              {collabTab === 'board' && MoodboardPostForm && (
                <AppCard className="border-pink-100 ring-4 ring-pink-50 !p-4 md:!p-6 bg-slate-50/50">
                  <MoodboardPostForm projectId={project.id} onPostSuccess={fetchProject} />
                  <div className="mt-6 pt-6 border-t border-slate-200/60">
                    {MoodboardDisplay && <MoodboardDisplay projectId={project.id} />}
                  </div>
                </AppCard>
              )}

              {/* タスク */}
              {isPlanner && collabTab === 'tasks' && (
                <AppCard className="border-emerald-100 ring-4 ring-emerald-50">
                  <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 mb-6">
                    <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="新しいタスクを追加" className="p-3 border border-slate-200 rounded-xl flex-grow bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-bold" />
                    <button type="submit" className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-sm font-black text-sm flex justify-center items-center gap-2"><Plus size={16} />追加</button>
                  </form>
                  <div className="space-y-2">
                    {project.tasks?.map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={t.isCompleted} onChange={() => handleToggleTask(t.id, t.isCompleted)} className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer" />
                          <span className={cn('text-sm font-bold transition-colors', t.isCompleted ? 'line-through text-slate-400' : 'text-slate-700')}>{t.title}</span>
                        </div>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-white transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    {(!project.tasks || project.tasks.length === 0) && <p className="text-center text-slate-400 text-sm font-bold py-10">タスクはありません</p>}
                  </div>
                </AppCard>
              )}

              {/* ツール */}
              {collabTab === 'tools' && (
                <div className="space-y-5 md:space-y-6">
                  {(isPlanner || isAssignedIllustrator) && (
                    <AppCard className="border-amber-100 ring-4 ring-amber-50">
                      <h3 className="font-black text-slate-800 mb-3 md:mb-4 flex items-center text-sm md:text-base">
                        <Brush className="mr-2 text-amber-500" size={18} /> イラスト納品・検収
                      </h3>
                      <div className="bg-white p-5 md:p-6 rounded-[1.5rem] border border-slate-100">
                        {project.isIllustrationAccepted ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div>
                            <h4 className="text-lg font-black text-slate-800 mb-2">イラストの検収が完了しました！🎉</h4>
                            <p className="text-sm font-bold text-slate-500 mb-6">報酬のポイントがクリエイターに支払われました。</p>
                            {project.illustrationDataUrl && (
                              <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 cursor-zoom-in" onClick={() => { setModalImageSrc(project.illustrationDataUrl); setIsImageModalOpen(true); }}>
                                <Image src={project.illustrationDataUrl} alt="納品イラスト" fill className="object-contain" />
                              </div>
                            )}
                          </div>
                        ) : project.illustrationDataUrl ? (
                          <div className="text-center py-4">
                            <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 inline-block">納品確認待ち</span>
                            <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 mb-6 cursor-zoom-in" onClick={() => { setModalImageSrc(project.illustrationDataUrl); setIsImageModalOpen(true); }}>
                              <Image src={project.illustrationDataUrl} alt="納品イラスト" fill className="object-contain" />
                            </div>
                            {isPlanner ? (
                              <div className="space-y-3 max-w-sm mx-auto">
                                <p className="text-xs font-bold text-slate-500 mb-4">クリエイターからイラストが納品されました。<br />確認して、問題なければ検収（ポイント支払い）を完了してください。</p>
                                <button onClick={handleAcceptIllustration} className="w-full py-3.5 bg-emerald-500 text-white font-black rounded-xl shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                                  <CheckCircle2 size={18} /> 問題ないので検収して支払う
                                </button>
                                <button onClick={handleRejectIllustration} className="w-full py-3 bg-white text-slate-500 font-black rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">修正を依頼する (リテイク)</button>
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-slate-500">企画者の確認と検収をお待ちください...</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            {isAssignedIllustrator ? (
                              <>
                                <p className="text-sm font-bold text-slate-500 mb-6">完成したイラストデータをアップロードして納品してください。</p>
                                <label className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-xl shadow-lg hover:shadow-orange-500/30 cursor-pointer transition-all active:scale-95">
                                  {isIllustrationUploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                                  完成データを納品する
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'illustration_delivery')} disabled={isIllustrationUploading} />
                                </label>
                              </>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4"><Brush size={32} /></div>
                                <p className="text-sm font-bold text-slate-500">クリエイターからのイラスト納品をお待ちください。</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </AppCard>
                  )}

                  {isFlorist && project.isIllustrationAccepted && project.illustrationDataUrl && (
                    <AppCard className="border-pink-100 ring-4 ring-pink-50 bg-gradient-to-br from-white to-pink-50/30">
                      <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 cursor-zoom-in hover:scale-105 transition-transform" onClick={() => { setModalImageSrc(project.illustrationDataUrl); setIsImageModalOpen(true); }}>
                            <Image src={project.illustrationDataUrl} alt="納品イラスト" width={64} height={64} className="object-cover rounded-xl" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 text-lg mb-1 flex items-center gap-2"><Brush className="text-pink-500" size={18} /> 印刷用データ</h3>
                            <p className="text-xs font-bold text-slate-500">絵師から納品された最終データです。</p>
                          </div>
                        </div>
                        <button onClick={() => handleDownloadIllustration(project.illustrationDataUrl)} className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 shrink-0">
                          <Download size={18} /> ダウンロード
                        </button>
                      </div>
                    </AppCard>
                  )}

                  <AppCard className="!p-5 md:!p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-br from-slate-50/50 to-white border-slate-100 gap-4">
                    <div>
                      <h3 className="font-black text-slate-800 mb-1 flex items-center text-sm md:text-base"><Box className="mr-2 text-slate-500" size={18} /> ARプレビュー</h3>
                      <p className="text-[10px] md:text-xs font-bold text-slate-500/70 mb-0">スマホをかざして実際のサイズ感を確認できます。</p>
                    </div>
                    <button onClick={() => setIsArModalOpen(true)} className="w-full sm:w-auto px-8 py-3 bg-slate-700 text-white text-xs md:text-sm font-black rounded-xl hover:bg-slate-800 transition-all shadow-md shrink-0 active:scale-95">起動する</button>
                  </AppCard>

                  {(isPlanner || isFlorist) && PanelPreviewer && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between overflow-hidden w-full">
                      <PanelPreviewer onImageSelected={(file) => handleUpload({ target: { files: [file] } }, 'illustration')} />
                      {project.illustrationPanelUrls?.length > 0 && (
                        <div className="p-5 md:p-6 border-t border-slate-100 bg-slate-50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3">提出済みデータ (過去分)</p>
                          <div className="flex flex-wrap gap-2 md:gap-3">
                            {project.illustrationPanelUrls.map((url, i) => (
                              <div key={i} className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in hover:scale-105 transition-transform" onClick={() => { setModalImageSrc(url); setIsImageModalOpen(true); }}>
                                <Image src={url} alt={`提出データ ${i}`} fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {((isPlanner || isFlorist) || project.productionStatus === 'PRE_COMPLETION') && (
                    <AppCard className="border-slate-100">
                      <h3 className="font-black text-slate-800 mb-3 md:mb-4 flex items-center text-sm md:text-base"><CheckCircle2 className="mr-2 text-emerald-500" size={16} /> 仕上がり確認 (前日写真)</h3>
                      {project.preEventPhotoUrls?.length > 0 ? (
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          {project.preEventPhotoUrls.map((url, i) => (
                            <div key={i} className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in hover:scale-105 transition-transform" onClick={() => { setModalImageSrc(url); setIsImageModalOpen(true); }}>
                              <Image src={url} alt={`前日写真 ${i}`} fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">まだ写真はアップロードされていません。</p>
                      )}
                      {isFlorist && (
                        <div className="mt-4 md:mt-5">
                          <label className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer hover:bg-slate-50 shadow-sm transition-all w-full justify-center active:scale-95">
                            <UploadCloud className="mr-2" size={16} /> 写真を追加
                            <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'pre_photo')} />
                          </label>
                        </div>
                      )}
                    </AppCard>
                  )}
                </div>
              )}

              {/* クリエイター応募 */}
              {isPlanner && !project.illustratorId && collabTab === 'applicants' && (
                <AppCard className="border-amber-100 ring-4 ring-amber-50/50 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-800 flex items-center gap-2"><UserPlus className="text-amber-500" size={20} /> 届いている立候補</h3>
                    <span className="bg-amber-100 text-amber-600 text-xs font-bold px-3 py-1 rounded-full">{project.illustratorApplications?.length || 0} 件</span>
                  </div>
                  {project.illustratorApplications?.length > 0 ? (
                    <div className="space-y-4">
                      {project.illustratorApplications.map(app => (
                        <div key={app.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                {app.illustrator?.iconUrl ? <Image src={app.illustrator.iconUrl} alt={app.illustrator?.name || 'コラボレーターアイコン'} width={40} height={40} className="object-cover" /> : <User size={20} className="m-2 text-slate-300" />}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm">{app.illustrator?.name || '絵師さん'}</p>
                                <Link href={`/illustrators/${app.illustrator?.userId}`} className="text-[10px] text-amber-500 font-bold hover:underline">プロフィールを見る</Link>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">希望金額</p>
                              <p className="font-black text-amber-500 text-lg leading-none">{app.proposedAmount?.toLocaleString()} <span className="text-[10px]">pt</span></p>
                            </div>
                          </div>
                          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 mb-4">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><MessageSquare size={12} /> 提案メッセージ</p>
                            <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{app.message}</p>
                          </div>
                          <button onClick={() => handleAcceptApplication(app.id, app.proposedAmount)} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-105 text-white text-sm font-black rounded-xl transition-all shadow-md shadow-amber-100 flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> 採用して {app.proposedAmount?.toLocaleString()}pt 仮払いする
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                      <UserPlus className="mx-auto text-slate-300 mb-3" size={32} />
                      <p className="text-sm font-bold text-slate-500 mb-1">まだ立候補はありません</p>
                      <p className="text-xs text-slate-400 font-medium">掲示板に掲載して、クリエイターからの応募を待ちましょう！</p>
                    </div>
                  )}
                </AppCard>
              )}

            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
