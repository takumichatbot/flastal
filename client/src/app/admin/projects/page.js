'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
    Search, Filter, ArrowLeft, RefreshCw, 
    Trash2, ExternalLink, Calendar, DollarSign, Target, Award,
    CheckCircle2, Clock, AlertTriangle, XCircle, LayoutGrid, Edit3, X, Eye, EyeOff
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

// ステータスに応じたバッジを返す関数
const getStatusBadge = (status) => {
    switch (status) {
        case 'FUNDRAISING': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '支援募集中', icon: Target };
        case 'SUCCESSFUL': return { bg: 'bg-sky-100', text: 'text-sky-700', label: '目標達成', icon: CheckCircle2 };
        case 'PRODUCTION_IN_PROGRESS': return { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '制作中', icon: Award };
        case 'DELIVERED_OR_FINISHED':
        case 'COMPLETED': return { bg: 'bg-purple-100', text: 'text-purple-700', label: '完了済', icon: CheckCircle2 };
        case 'PENDING_APPROVAL': return { bg: 'bg-amber-100', text: 'text-amber-700', label: '審査待ち', icon: Clock };
        case 'CANCELED': return { bg: 'bg-rose-100', text: 'text-rose-700', label: '中止', icon: XCircle };
        default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: status || '不明', icon: AlertTriangle };
    }
};

// --- 🌟 編集用モーダルコンポーネント ---
function ProjectEditModal({ project, isOpen, onClose, onSuccess, authenticatedFetch }) {
    const [formData, setFormData] = useState({ title: '', status: '', targetAmount: 0 });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (project && isOpen) {
            setFormData({
                title: project.title || '',
                status: project.status || '',
                targetAmount: project.targetAmount || 0,
            });
        }
    }, [project, isOpen]);

    if (!isOpen || !project) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('保存中...');
        try {
            const res = await authenticatedFetch(`${API_URL}/api/admin/projects/${project.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('保存に失敗しました');
            toast.success('企画情報を更新しました', { id: toastId });
            onSuccess();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit3 className="text-sky-500"/> 企画の編集</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors shadow-sm"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">企画タイトル</label>
                        <input 
                            type="text" required
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})} 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-slate-800 transition-all" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">目標金額 (pt)</label>
                        <input 
                            type="number" required min="0"
                            value={formData.targetAmount} 
                            onChange={(e) => setFormData({...formData, targetAmount: parseInt(e.target.value) || 0})} 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-slate-800 transition-all" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ステータス</label>
                        <select 
                            value={formData.status} 
                            onChange={(e) => setFormData({...formData, status: e.target.value})} 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-slate-800 transition-all cursor-pointer"
                        >
                            <option value="PENDING_APPROVAL">審査待ち (PENDING_APPROVAL)</option>
                            <option value="FUNDRAISING">支援募集中 (FUNDRAISING)</option>
                            <option value="SUCCESSFUL">目標達成 (SUCCESSFUL)</option>
                            <option value="PRODUCTION_IN_PROGRESS">制作中 (PRODUCTION_IN_PROGRESS)</option>
                            <option value="COMPLETED">完了済 (COMPLETED)</option>
                            <option value="CANCELED">中止 (CANCELED)</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-colors">キャンセル</button>
                        <button type="submit" disabled={isSaving} className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-sky-600 shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
                            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} 保存する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminProjectsPage() {
    const { user, isAuthenticated, loading, authenticatedFetch } = useAuth();
    const router = useRouter();

    const [projects, setProjects] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    
    // 編集モーダル用のState
    const [editingProject, setEditingProject] = useState(null);

    const fetchProjects = async () => {
        setIsLoadingData(true);
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/admin/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error('企画一覧の取得に失敗しました');
            const data = await res.json();
            setProjects(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('企画一覧の取得に失敗しました');
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            toast.error('管理者権限がありません');
            router.push('/login');
            return;
        }
        
        const timer = setTimeout(() => {
            fetchProjects();
        }, 500);
        return () => clearTimeout(timer);
    }, [isAuthenticated, user, loading, router]);

    // 検索とフィルタリング
    const filteredProjects = useMemo(() => {
        let result = projects;

        if (activeTab !== 'ALL') {
            if (activeTab === 'ACTIVE') {
                result = result.filter(p => ['FUNDRAISING', 'SUCCESSFUL', 'PRODUCTION_IN_PROGRESS'].includes(p.status));
            } else if (activeTab === 'COMPLETED') {
                result = result.filter(p => ['COMPLETED', 'DELIVERED_OR_FINISHED'].includes(p.status));
            } else if (activeTab === 'CANCELED') {
                result = result.filter(p => p.status === 'CANCELED');
            } else if (activeTab === 'PENDING') {
                result = result.filter(p => p.status === 'PENDING_APPROVAL');
            } else if (activeTab === 'UNLISTED') {
                // 非公開タブを追加
                result = result.filter(p => p.visibility === 'UNLISTED' || p.isVisible === false);
            }
        }

        if (searchKeyword.trim() !== '') {
            const keyword = searchKeyword.toLowerCase();
            result = result.filter(p => 
                (p.title && p.title.toLowerCase().includes(keyword)) ||
                (p.planner?.handleName && p.planner.handleName.toLowerCase().includes(keyword)) ||
                (p.planner?.name && p.planner.name.toLowerCase().includes(keyword))
            );
        }

        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [projects, activeTab, searchKeyword]);

    // 🌟 公開・非公開（アーカイブ）の切り替え
    const handleToggleVisibility = async (p) => {
        const isHidden = p.visibility === 'UNLISTED' || p.isVisible === false;
        const newIsVisible = !isHidden ? false : true;
        const actionText = newIsVisible ? '公開' : '非公開';

        if (!window.confirm(`本当にこの企画を「${actionText}」にしますか？\n（非公開にすると、一般ユーザーの検索や一覧には表示されなくなります）`)) {
            return;
        }

        const toastId = toast.loading(`${actionText}に変更中...`);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/admin/projects/${p.id}/visibility`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible: newIsVisible })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || '状態の変更に失敗しました');
            }

            toast.success(`企画を${actionText}にしました`, { id: toastId });
            fetchProjects();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    // 🌟 強制削除処理
    const handleDeleteProject = async (projectId, projectTitle) => {
        if (!window.confirm(`本当に企画「${projectTitle}」を完全に削除しますか？\nこの操作は取り消せません。\n※決済履歴が紐づいている場合は、原則として「非公開」にすることを推奨します。`)) {
            return;
        }

        const toastId = toast.loading('強制削除中...');
        try {
            const res = await authenticatedFetch(`${API_URL}/api/admin/projects/${projectId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || '強制削除に失敗しました（決済データが紐づいている可能性があります）');
            }

            toast.success('企画を完全に削除しました。', { id: toastId });
            fetchProjects(); 
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-sky-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <LayoutGrid className="text-sky-500" size={24} /> 全企画管理
                                </h1>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Project Management Console</p>
                            </div>
                        </div>
                        <div className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-inner">
                            合計: <span className="text-sky-600 font-black">{filteredProjects.length}</span> 件
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Search & Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="企画タイトル、企画者名で検索..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium shadow-inner"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                        {[
                            { id: 'ALL', label: 'すべて' },
                            { id: 'ACTIVE', label: '進行中' },
                            { id: 'PENDING', label: '審査待ち' },
                            { id: 'COMPLETED', label: '完了済' },
                            { id: 'CANCELED', label: '中止' },
                            { id: 'UNLISTED', label: '非公開' }, // 🌟 非公開タブも追加
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 shadow-sm",
                                    activeTab === tab.id 
                                        ? "bg-slate-900 text-white shadow-md border border-slate-800" 
                                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">企画情報</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ステータス</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">支援状況</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">作成日</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">アクション</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoadingData ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <RefreshCw className="animate-spin text-sky-400 mx-auto mb-4" size={32} />
                                            <p className="text-sm font-bold text-slate-500">データを読み込み中...</p>
                                        </td>
                                    </tr>
                                ) : filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <Filter className="text-slate-300 mx-auto mb-4" size={32} />
                                            <p className="text-sm font-bold text-slate-500">条件に一致する企画がありません</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((p) => {
                                        const badge = getStatusBadge(p.status);
                                        const progress = p.targetAmount > 0 ? Math.min(100, Math.floor((p.collectedAmount / p.targetAmount) * 100)) : 0;
                                        const isHidden = p.visibility === 'UNLISTED' || p.isVisible === false;
                                        
                                        return (
                                            <tr key={p.id} className={cn("hover:bg-sky-50/30 transition-colors group", isHidden ? "opacity-70 bg-slate-50" : "")}>
                                                
                                                <td className="px-6 py-4 min-w-[250px]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">
                                                            {p.imageUrl ? (
                                                                <img src={p.imageUrl} alt="thumbnail" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <LayoutGrid className="text-slate-300" size={20} />
                                                            )}
                                                            {isHidden && (
                                                                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
                                                                    <span className="text-[10px] font-black text-white px-2 py-0.5 border border-white/50 rounded-full">非公開</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Link href={`/projects/${p.id}`} target="_blank" className="text-sm font-bold text-slate-800 hover:text-sky-600 transition-colors line-clamp-1">
                                                                    {p.title}
                                                                </Link>
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-medium">
                                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold border border-slate-200">企画者</span>
                                                                {p.planner?.handleName || p.planner?.name || '不明'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm whitespace-nowrap", badge.bg, badge.text, badge.bg.replace('bg-', 'border-'))}>
                                                        <badge.icon size={12} /> {badge.label}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 w-32">
                                                        <div className="flex justify-between items-end text-xs">
                                                            <span className="font-black text-slate-800">¥{p.collectedAmount?.toLocaleString() || 0}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">/ ¥{p.targetAmount?.toLocaleString() || 0}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                                            <div 
                                                                className={cn("h-full transition-all", progress >= 100 ? 'bg-sky-500' : 'bg-emerald-400')} 
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-0.5 text-sm text-slate-600 font-medium">
                                                        <span className="flex items-center gap-1 text-xs"><Calendar size={12} className="text-slate-400"/> {new Date(p.createdAt).toLocaleDateString('ja-JP')}</span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 flex-wrap max-w-[250px]">
                                                        
                                                        {/* 🌟 非公開/公開トグルボタン */}
                                                        <button 
                                                            onClick={() => handleToggleVisibility(p)}
                                                            className={cn(
                                                                "flex items-center gap-1 px-3 py-1.5 border rounded-lg transition-all text-xs font-bold shadow-sm",
                                                                isHidden
                                                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border-amber-200 hover:border-amber-500"
                                                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-300"
                                                            )}
                                                            title={isHidden ? "公開する" : "非公開（アーカイブ）にする"}
                                                        >
                                                            {isHidden ? (
                                                                <><Eye size={14} /> <span className="hidden xl:inline">公開する</span></>
                                                            ) : (
                                                                <><EyeOff size={14} /> <span className="hidden xl:inline">非公開</span></>
                                                            )}
                                                        </button>

                                                        {/* 編集ボタン */}
                                                        <button 
                                                            onClick={() => setEditingProject(p)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-white text-indigo-500 hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-400 rounded-lg transition-all text-xs font-bold shadow-sm"
                                                            title="企画を編集"
                                                        >
                                                            <Edit3 size={14} /> <span className="hidden xl:inline">編集</span>
                                                        </button>

                                                        {/* 削除ボタン */}
                                                        <button 
                                                            onClick={() => handleDeleteProject(p.id, p.title)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-white text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-200 hover:border-rose-500 rounded-lg transition-all text-xs font-bold shadow-sm"
                                                            title="強制削除（※要注意）"
                                                        >
                                                            <Trash2 size={14} /> <span className="hidden xl:inline">削除</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* モーダルのレンダリング */}
            <ProjectEditModal 
                project={editingProject} 
                isOpen={!!editingProject} 
                onClose={() => setEditingProject(null)} 
                onSuccess={() => {
                    setEditingProject(null);
                    fetchProjects();
                }}
                authenticatedFetch={authenticatedFetch}
            />

        </div>
    );
}