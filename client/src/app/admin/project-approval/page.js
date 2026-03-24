'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { 
  Search, Eye, CheckCircle2, XCircle, Clock, 
  Calendar, Target, User, Image as ImageIcon, X, FileText, 
  RefreshCw, Loader2, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^["']|["']$/g, '').trim() : null;
};

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6", className)}>
    {children}
  </div>
);

// --- 詳細確認モーダル ---
function ProjectDetailModal({ project, onClose, onAction, isProcessing }) {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-white">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 italic">
            <span className="bg-sky-500 text-white px-3 py-1 rounded-lg text-[10px] uppercase font-black">PROJECT</span>
            企画の最終確認
          </h3>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-900 shadow-sm"><X size={20} /></button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-white">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 leading-tight italic tracking-tighter">{project.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
               <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100"><User size={16} className="text-pink-500"/> 企画者: {project.planner?.handleName || '不明'}</span>
               <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100"><Clock size={16} className="text-sky-500"/> 申請日: {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2 mb-2 relative z-10">目標金額</label>
                <p className="text-4xl font-black italic tracking-tighter relative z-10">{Number(project.targetAmount).toLocaleString()} <span className="text-sm opacity-60">pt</span></p>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 font-bold">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">イベント日</label>
                    <p className="text-slate-800 text-base">{project.eventDate ? new Date(project.eventDate).toLocaleDateString() : '未定'}</p>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">募集期限</label>
                    <p className="text-slate-800 text-base">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '未定'}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center min-h-[250px]">
              {project.imageUrl ? (
                <img src={project.imageUrl} alt="企画画像" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-300 flex flex-col items-center"><ImageIcon size={48} /><span className="text-xs mt-3 font-black uppercase">画像なし</span></div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">企画説明内容</label>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm text-slate-700 font-bold leading-relaxed whitespace-pre-wrap shadow-inner">
              {project.description || '説明文が登録されていません。'}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/80 flex gap-4">
          <button onClick={() => onAction(project.id, 'REJECTED')} disabled={isProcessing} className="flex-1 bg-white border-2 border-slate-200 text-slate-500 font-black py-4 rounded-full hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95">
            <XCircle size={18} /> 却下
          </button>
          <button onClick={() => onAction(project.id, 'APPROVED')} disabled={isProcessing} className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-full hover:bg-sky-500 shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95">
            <CheckCircle2 size={18} /> 承認して公開する
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- メインページ ---
function ProjectApprovalInner() {
  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  const fetchPendingProjects = useCallback(async () => {
    setLoadingData(true);
    setErrorInfo(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('認証トークンが見つかりません。再ログインしてください。');

      const res = await fetch(`${API_URL}/api/admin/projects/pending`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
      });
      
      if (res.status === 401 || res.status === 403) throw new Error('管理権限がないか、セッションが切れました。');
      if (!res.ok) throw new Error(`エラー (${res.status}): リストの取得に失敗しました。`);

      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorInfo(error.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') return router.push('/admin/login');
    fetchPendingProjects();
  }, [isAuthenticated, user, authLoading, fetchPendingProjects, router]);

  const handleUpdateStatus = async (projectId, targetStatus) => {
    const actionText = targetStatus === 'APPROVED' ? '承認' : '却下';
    if (!window.confirm(`この企画を「${actionText}」しますか？`)) return;

    setIsProcessing(true);
    const toastId = toast.loading('処理中...');
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/approve/projects/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: targetStatus, adminComment: '' }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');

      toast.success(`企画の${actionText}が完了しました`, { id: toastId });
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setSelectedProject(null);
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return projects.filter(p => (p.title && p.title.toLowerCase().includes(lowerTerm)) || (p.planner?.handleName && p.planner.handleName.toLowerCase().includes(lowerTerm)));
  }, [projects, searchTerm]);

  if (authLoading || (loadingData && !errorInfo)) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-sky-500 size-12" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50/30 p-6 sm:p-12 font-sans text-slate-800 pb-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/3 pointer-events-none z-0" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-8">
            <div className="space-y-4">
                <Link href="/admin" className="inline-flex items-center text-[10px] font-black text-slate-400 hover:text-sky-600 transition-colors uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                    <ArrowLeft size={14} className="mr-1.5"/> ダッシュボードに戻る
                </Link>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3"><Target className="text-sky-500"/> Project Approval</h1>
                <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">企画の審査と募集開始の許可</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white shadow-sm flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">申請数</span>
                    <span className="text-xl font-black text-slate-800">{projects.length}件</span>
                </div>
                <button onClick={fetchPendingProjects} className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 shadow-sm text-slate-500 transition-all active:scale-95">
                    <RefreshCw className={loadingData ? 'animate-spin' : ''} size={20} />
                </button>
            </div>
        </div>

        {errorInfo && (
            <div className="mb-10 bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-500 text-white p-3 rounded-xl"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="font-black text-rose-900 text-lg tracking-tight">権限または通信のエラー</p>
                        <p className="text-rose-700/80 text-xs font-bold uppercase tracking-widest mt-1">{errorInfo}</p>
                    </div>
                </div>
                <button onClick={() => { logout(); router.push('/admin/login'); }} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-black text-xs uppercase hover:bg-rose-600 transition-all shadow-sm active:scale-95">再ログインして修復</button>
            </div>
        )}

        <GlassCard className="mb-10 !p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 size-5 group-focus-within:text-sky-500 transition-colors" />
                <input type="text" placeholder="企画タイトルやユーザー名で検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-sky-200 outline-none font-bold text-sm placeholder:text-slate-300 transition-all text-slate-800"
                />
            </div>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {filteredProjects.length > 0 ? (
                filteredProjects.map(project => (
                    <GlassCard key={project.id} className="!p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all hover:border-sky-200 hover:shadow-xl">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-widest border border-amber-100 flex items-center gap-1">
                                    <Clock size={10}/> 審査待ち
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <div className="w-full h-40 mb-4 rounded-2xl overflow-hidden bg-slate-100 relative border-2 border-white shadow-sm">
                                {project.imageUrl ? (
                                    <img src={project.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><ImageIcon size={32} /></div>
                                )}
                            </div>

                            <h3 className="font-black text-lg text-slate-800 mb-3 line-clamp-2 leading-tight tracking-tight">{project.title}</h3>
                            <div className="space-y-2 mb-6 text-xs font-bold text-slate-500 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                <p className="flex items-center gap-2 truncate"><User className="text-pink-500 shrink-0" size={14}/> {project.planner?.handleName || '匿名'}</p>
                                <p className="flex items-center gap-2"><Target className="text-sky-500 shrink-0" size={14}/> 目標: <span className="text-slate-800 font-black">{Number(project.targetAmount).toLocaleString()} pt</span></p>
                            </div>
                        </div>
                        
                        <button onClick={() => setSelectedProject(project)} className="w-full py-3.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-sky-600 transition-all flex items-center justify-center gap-2 shadow-md">
                            <Eye size={16}/> 詳細を確認して審査
                        </button>
                    </GlassCard>
                ))
            ) : (
                <div className="col-span-full py-32 text-center bg-white/60 backdrop-blur-md rounded-[3rem] border border-white shadow-sm">
                    <div className="bg-slate-100 size-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-inner">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">現在申請はありません</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">すべてのプロジェクトの審査が完了しています🎉</p>
                </div>
            )}
        </div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} onAction={handleUpdateStatus} isProcessing={isProcessing} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProjectApprovalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-sky-500 size-10" /></div>}>
      <ProjectApprovalInner />
    </Suspense>
  );
}