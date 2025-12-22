'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  FiSearch, FiEye, FiCheckCircle, FiXCircle, FiClock, 
  FiCalendar, FiTarget, FiUser, FiImage, FiX, FiFileText 
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- 詳細確認モーダル ---
function ProjectDetailModal({ project, onClose, onAction, isProcessing }) {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded text-xs uppercase">Project</span>
            企画審査詳細
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <FiX size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* タイトル & 基本情報 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
               <span className="flex items-center gap-1"><FiUser/> 企画者: {project.planner?.handleName || '不明'}</span>
               <span className="flex items-center gap-1"><FiClock/> 申請日: {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左カラム: 数値・日程系 */}
            <div className="space-y-4">
              <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                <label className="text-xs font-bold text-sky-600 uppercase flex items-center gap-1 mb-1"><FiTarget/> 目標金額</label>
                <p className="text-2xl font-extrabold text-gray-800">{Number(project.targetAmount).toLocaleString()} <span className="text-sm font-medium">pt</span></p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><FiCalendar/> イベント開催日</label>
                    <p className="font-bold text-gray-800">{project.eventDate ? new Date(project.eventDate).toLocaleDateString() : '未定'}</p>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><FiClock/> 募集終了日</label>
                    <p className="font-bold text-gray-800">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '未定'}</p>
                </div>
              </div>
            </div>

            {/* 右カラム: 画像 */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center min-h-[200px]">
              {project.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={project.imageUrl} alt="Project" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <FiImage size={40} />
                  <span className="text-sm mt-2">画像なし</span>
                </div>
              )}
            </div>
          </div>

          {/* 説明文 */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2"><FiFileText/> 企画説明・詳細</label>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {project.description || '説明文がありません。'}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
          <button
            onClick={() => onAction(project.id, 'REJECTED')}
            disabled={isProcessing}
            className="flex-1 bg-white border border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiXCircle /> 却下する
          </button>
          <button
            onClick={() => onAction(project.id, 'FUNDRAISING')}
            disabled={isProcessing}
            className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiCheckCircle /> 承認 (募集開始)
          </button>
        </div>
      </div>
    </div>
  );
}

// --- メインページ ---
export default function AdminProjectApprovalsPage() {
  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null); // モーダル用
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // データ取得
  const fetchPendingProjects = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/admin/projects/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) throw new Error('管理者権限がありません。');
      if (!res.ok) throw new Error('リストの取得に失敗しました。');
      
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
      setProjects([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }
    if (!user || user.role !== 'ADMIN') {
      toast.error('管理者権限がありません。');
      router.push('/mypage');
      return;
    }
    fetchPendingProjects();
  }, [isAuthenticated, user, router, loading]);

  // ステータス更新
  const handleUpdateStatus = async (projectId, status) => {
    const actionText = status === 'FUNDRAISING' ? '承認（募集開始）' : '却下';
    if (!window.confirm(`この企画を「${actionText}」しますか？`)) return;

    setIsProcessing(true);
    const toastId = toast.loading('処理中...');
    const token = localStorage.getItem('authToken');

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
         const errData = await res.json();
         throw new Error(errData.message || '処理に失敗しました');
      }

      toast.success(`企画を${status === 'FUNDRAISING' ? '承認' : '却下'}しました`, { id: toastId });
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setSelectedProject(null); // モーダル閉じる

    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // 検索フィルタリング
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const lowerTerm = searchTerm.toLowerCase();
    return projects.filter(p => 
      (p.title && p.title.toLowerCase().includes(lowerTerm)) ||
      (p.planner?.handleName && p.planner.handleName.toLowerCase().includes(lowerTerm))
    );
  }, [projects, searchTerm]);

  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <FiCheckCircle className="text-sky-500"/> プロジェクト登録審査
            </h1>
            <p className="text-sm text-gray-500 mt-1">申請された企画内容を確認し、募集開始の承認を行います。</p>
          </div>
          
          <div className="flex items-center gap-4">
             <span className="text-sm font-bold bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
               管理者: {user.name || user.email}
             </span>
             <button onClick={() => { logout(); router.push('/login'); }} className="text-xs font-bold text-gray-500 hover:text-red-600 underline">
               ログアウト
             </button>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8 inline-flex flex-wrap gap-1">
          {[
            { name: 'ダッシュボード', path: '/admin' },
            { name: '出金管理', path: '/admin/payouts' },
            { name: 'チャット監視', path: '/admin/moderation' },
            { name: '花屋審査', path: '/admin/florist-approval' },
            { name: '企画審査', path: '/admin/project-approval', active: true },
          ].map((nav) => (
            <Link 
              key={nav.path}
              href={nav.path}
              className={`
                px-4 py-2 text-sm font-bold rounded-lg transition-all
                ${nav.active 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
              `}
            >
              {nav.name}
            </Link>
          ))}
        </div>

        {/* メインエリア */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            
            {/* コントロールバー */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
              <h2 className="font-bold text-lg flex items-center gap-2">
                審査待ちリスト 
                <span className="bg-sky-100 text-sky-600 text-xs px-2 py-0.5 rounded-full">{filteredProjects.length}件</span>
              </h2>
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="企画名や企画者で検索..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              </div>
            </div>

            {/* リスト表示 */}
            <div className="p-6">
                {loadingData ? (
                  <div className="flex justify-center py-10 text-gray-400">読み込み中...</div>
                ) : filteredProjects.length === 0 ? (
                   <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                     <FiCheckCircle className="mx-auto text-4xl text-gray-300 mb-3" />
                     <p className="text-gray-500 font-medium">現在、審査待ちの企画はありません。</p>
                   </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                      <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all flex flex-col justify-between group h-full">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                    <FiClock /> 申請中
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            {/* サムネイル (あれば) */}
                            {project.imageUrl && (
                                <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={project.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            )}

                            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight">
                                {project.title}
                            </h3>
                            
                            <div className="space-y-1 mb-4 text-xs text-gray-500">
                                <p className="flex items-center gap-1"><FiUser className="shrink-0"/> {project.planner?.handleName}</p>
                                <p className="flex items-center gap-1"><FiTarget className="shrink-0"/> 目標: {Number(project.targetAmount).toLocaleString()} pt</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedProject(project)}
                            className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group-hover:bg-sky-600"
                        >
                            <FiEye /> 内容を確認して審査
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
        </div>
      </div>

      {/* 詳細モーダル */}
      <ProjectDetailModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
        onAction={handleUpdateStatus}
        isProcessing={isProcessing}
      />
    </div>
  );
}