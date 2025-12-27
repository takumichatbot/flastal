'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  FiSearch, FiEye, FiCheckCircle, FiXCircle, FiClock, 
  FiCalendar, FiTarget, FiUser, FiImage, FiX, FiFileText, FiRefreshCw, FiLoader, FiAlertTriangle, FiArrowLeft
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'https://flastal-backend.onrender.com';

// 認証トークンを確実にクリーンにする関数
const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    if (!rawToken) return null;
    return rawToken.replace(/^["']|["']$/g, '').trim();
};

// --- 詳細確認モーダル ---
function ProjectDetailModal({ project, onClose, onAction, isProcessing }) {
  if (!project) return null;

  return (
    // z-indexを最大級の100に設定し、確実に最前面へ
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col font-sans border border-white/20">
        
        {/* ヘッダー */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 italic">
            <span className="bg-sky-500 text-white px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest">PROJECT</span>
            企画審査の詳細確認
          </h3>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-900 shadow-sm">
            <FiX size={24} />
          </button>
        </div>

        {/* 内容エリア */}
        <div className="p-8 overflow-y-auto flex-1 space-y-8 text-slate-800 bg-white">
          <div className="text-slate-800">
            <h2 className="text-3xl font-black text-slate-900 mb-4 leading-tight italic">{project.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm font-bold text-gray-500">
               <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl text-slate-700 border border-slate-100"><FiUser className="text-pink-500"/> 企画者: {project.planner?.handleName || '不明'}</span>
               <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl text-slate-700 border border-slate-100"><FiClock className="text-sky-500"/> 申請日: {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-700">
                <label className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">目標 pt</label>
                <p className="text-4xl font-black text-white italic tracking-tighter">{Number(project.targetAmount).toLocaleString()} <span className="text-sm font-medium opacity-60">pt</span></p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 font-bold">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">イベント開催日</label>
                    <p className="text-slate-800 text-base">{project.eventDate ? new Date(project.eventDate).toLocaleDateString() : '未定'}</p>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">募集期限</label>
                    <p className="text-slate-800 text-base">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '未定'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center min-h-[250px] relative group border border-slate-100">
              {project.imageUrl ? (
                <img src={project.imageUrl} alt="企画画像" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-300 flex flex-col items-center">
                  <FiImage size={48} />
                  <span className="text-xs mt-3 font-black uppercase tracking-widest">画像なし</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">企画説明内容</label>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto shadow-inner">
              {project.description || '説明文が登録されていません。'}
            </div>
          </div>
        </div>

        {/* フッターアクション */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/80 flex gap-4">
          <button
            onClick={() => onAction(project.id, 'REJECTED')}
            disabled={isProcessing}
            className="flex-1 bg-white border-2 border-slate-200 text-slate-500 font-black py-4 rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <FiXCircle size={20} /> 申請を却下
          </button>
          <button
            onClick={() => onAction(project.id, 'FUNDRAISING')}
            disabled={isProcessing}
            className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-pink-600 shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <FiCheckCircle size={20} /> 承認して募集を開始
          </button>
        </div>
      </div>
    </div>
  );
}

// --- メインコンテンツ ---
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
      if (!token) {
        setErrorInfo("認証が必要です。");
        setLoadingData(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/admin/projects/pending`, {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
        }
      });
      
      if (res.status === 401 || res.status === 403) {
          setErrorInfo("管理者権限エラーが発生しました。再度ログインが必要です。");
          return;
      }
      
      if (!res.ok) throw new Error('リストの取得に失敗しました。');
      
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorInfo("サーバーとの通信に失敗しました。URLを確認してください。");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchPendingProjects();
  }, [isAuthenticated, user, authLoading, fetchPendingProjects, router]);

  const handleUpdateStatus = async (projectId, status) => {
    const actionText = status === 'FUNDRAISING' ? '承認（公開）' : '却下';
    if (!window.confirm(`この企画を「${actionText}」してもよろしいですか？`)) return;

    setIsProcessing(true);
    const toastId = toast.loading('サーバーへリクエストを送信中...');
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '更新に失敗しました');
      }

      toast.success(`企画のステータスを更新しました`, { id: toastId });
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
    return projects.filter(p => 
      (p.title && p.title.toLowerCase().includes(lowerTerm)) ||
      (p.planner?.handleName && p.planner.handleName.toLowerCase().includes(lowerTerm))
    );
  }, [projects, searchTerm]);

  if (authLoading || (loadingData && !errorInfo)) {
    return <div className="min-h-screen bg-white flex items-center justify-center font-sans"><FiLoader className="animate-spin text-pink-500 size-12" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 sm:p-12 font-sans text-slate-800 pt-28">
      <div className="max-w-7xl mx-auto text-slate-800">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 px-2">
            <div className="space-y-4">
                <Link href="/admin" className="inline-flex items-center text-[10px] font-black text-slate-300 hover:text-pink-500 transition-colors uppercase tracking-[0.3em]">
                    <FiArrowLeft className="mr-2"/> ダッシュボードに戻る
                </Link>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter italic uppercase">PROJECT REVIEW</h1>
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">新規プロジェクトの登録承認と審査</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-orange-50 px-6 py-4 rounded-[1.5rem] border border-orange-100 flex flex-col items-center shadow-sm">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">現在の待ち数</span>
                    <span className="text-xl font-black text-orange-600">{projects.length}件</span>
                </div>
                <button onClick={fetchPendingProjects} className="p-6 bg-white border border-slate-100 rounded-[1.5rem] hover:bg-slate-50 shadow-sm text-slate-400 transition-all active:rotate-180 duration-500">
                    <FiRefreshCw className={loadingData ? 'animate-spin' : ''} size={24} />
                </button>
            </div>
        </div>

        {/* 権限エラー */}
        {errorInfo && (
            <div className="mb-12 bg-rose-50 border-2 border-rose-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-rose-500/5">
                <div className="flex items-center gap-6">
                    <div className="bg-rose-500 text-white p-4 rounded-2xl shadow-xl shadow-rose-200"><FiAlertTriangle size={32} /></div>
                    <div className="space-y-1">
                        <p className="font-black text-rose-900 text-xl tracking-tight italic">アクセス権限エラー</p>
                        <p className="text-rose-700/60 text-sm font-bold uppercase tracking-widest leading-relaxed">{errorInfo}</p>
                    </div>
                </div>
                <button onClick={() => { logout(); router.push('/login'); }} className="px-10 py-5 bg-rose-500 text-white rounded-[1.5rem] font-black text-xs uppercase hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95">再ログインして修復</button>
            </div>
        )}

        {/* 検索バー */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 mb-12 flex flex-col md:flex-row items-center gap-8">
            <div className="relative flex-1 w-full group">
                <FiSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 size-6 group-focus-within:text-pink-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="企画名やユーザー名で検索・絞り込み..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-20 pr-10 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-pink-100 outline-none transition-all font-bold text-xl placeholder:text-slate-200 shadow-sm text-slate-900"
                />
            </div>
        </div>

        {/* 企画リストグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 text-slate-800">
            {filteredProjects.length > 0 ? (
                filteredProjects.map(project => (
                    <div key={project.id} className="bg-white rounded-[3rem] p-8 border-2 border-slate-50 transition-all flex flex-col justify-between group hover:border-pink-50 hover:shadow-[0_30px_60px_rgba(0,0,0,0.03)]">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-orange-50 text-orange-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-orange-100 animate-pulse">
                                    審査待ち
                                </span>
                                <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <div className="w-full h-48 mb-6 rounded-[2rem] overflow-hidden bg-slate-50 relative border-4 border-white shadow-inner">
                                {project.imageUrl ? (
                                    <img src={project.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <FiImage size={40} />
                                    </div>
                                )}
                            </div>

                            <h3 className="font-black text-xl text-slate-900 mb-3 line-clamp-2 leading-tight italic uppercase tracking-tighter">{project.title}</h3>
                            <div className="space-y-2 mb-8 text-xs font-bold text-slate-400">
                                <p className="flex items-center gap-3"><FiUser className="text-pink-500"/> {project.planner?.handleName || '企画者不明'}</p>
                                <p className="flex items-center gap-3"><FiTarget className="text-sky-500"/> 目標額: <span className="text-slate-800 font-black">{Number(project.targetAmount).toLocaleString()} pt</span></p>
                            </div>
                        </div>
                        
                        <button onClick={() => setSelectedProject(project)} className="w-full py-5 bg-gray-50 text-slate-900 text-xs font-black rounded-[1.5rem] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3 border border-gray-100 uppercase tracking-[0.2em] shadow-sm">
                            <FiEye /> 内容を詳しく確認
                        </button>
                    </div>
                ))
            ) : (
                <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <div className="bg-slate-50 size-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                        <FiCheckCircle size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-widest">審査待ちはありません</h3>
                    <p className="text-slate-300 text-sm mt-3 font-bold uppercase tracking-widest text-slate-400">現在、すべての企画の処理が完了しています</p>
                </div>
            )}
        </div>
      </div>

      <ProjectDetailModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
        onAction={handleUpdateStatus} 
        isProcessing={isProcessing} 
      />
      <style jsx global>{` body { background-color: #fafafa; } `}</style>
    </div>
  );
}

export default function ProjectApprovalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-sans"><FiLoader className="animate-spin text-pink-500 size-12" /></div>}>
      <ProjectApprovalInner />
    </Suspense>
  );
}