'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
    Award, DollarSign, Edit3, RefreshCw, Search, 
    Filter, TrendingUp, Users, AlertTriangle, ArrowLeft, Loader2
} from 'lucide-react';
import FloristFeeModal from '../components/FloristFeeModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6", className)}>
    {children}
  </div>
);

function AdminFloristsInner() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [florists, setFlorists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [targetFloristId, setTargetFloristId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); 
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    const fetchFlorists = useCallback(async () => {
        if (!isAuthenticated || user?.role !== 'ADMIN') return;
        setLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/florists/all`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('花屋リストの取得に失敗しました。');
            const data = await res.json();
            setFlorists(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(error.message);
            setFlorists([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') return router.push('/admin');
        fetchFlorists();
    }, [authLoading, isAuthenticated, user, router, fetchFlorists]);

    const handleFeeUpdated = () => { setTargetFloristId(null); fetchFlorists(); };

    const processedFlorists = useMemo(() => {
        let data = [...florists];
        if (statusFilter !== 'ALL') data = data.filter(f => f.status === statusFilter);
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(f => (f.platformName && f.platformName.toLowerCase().includes(lowerTerm)) || (f.shopName && f.shopName.toLowerCase().includes(lowerTerm)) || (f.email && f.email.toLowerCase().includes(lowerTerm)));
        }
        data.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            if (sortConfig.key === 'customFeeRate') {
                aValue = a.customFeeRate ?? -1;
                bValue = b.customFeeRate ?? -1;
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return data;
    }, [florists, searchTerm, statusFilter, sortConfig]);

    const stats = useMemo(() => {
        return { total: florists.length, approved: florists.filter(f => f.status === 'APPROVED').length, customFee: florists.filter(f => f.customFeeRate !== null).length };
    }, [florists]);

    const handleSort = (key) => {
        setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-3xl text-pink-500"/></div>;
    if (!isAuthenticated || user?.role !== 'ADMIN') return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-pink-50/30 py-8 md:py-12 font-sans text-slate-800 relative overflow-hidden pb-24">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div className="space-y-3">
                        <Link href="/admin" className="inline-flex items-center text-[10px] font-black text-slate-400 hover:text-pink-600 transition-colors uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                            <ArrowLeft size={14} className="mr-1.5"/> ダッシュボードに戻る
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3"><Award className="text-pink-500"/> Florist Management</h1>
                        <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">お花屋さんのステータス管理と手数料率設定</p>
                    </div>
                    <button onClick={fetchFlorists} disabled={loading} className="px-6 py-3.5 bg-white text-slate-500 rounded-full text-xs font-black hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm border border-slate-200">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""}/> データ同期
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard icon={<Users/>} label="登録花屋総数" value={`${stats.total}件`} color="sky" />
                    <StatCard icon={<Award/>} label="承認済みアカウント" value={`${stats.approved}件`} color="emerald" />
                    <StatCard icon={<DollarSign/>} label="個別手数料 適用中" value={`${stats.customFee}件`} color="pink" />
                </div>

                <GlassCard className="mb-8 !p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl w-full md:w-auto border border-white">
                        {['ALL', 'APPROVED', 'PENDING'].map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)}
                                className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", statusFilter === status ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                            >
                                {status === 'ALL' ? 'すべて' : status === 'APPROVED' ? '承認済み' : '審査待ち'}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 group-focus-within:text-pink-500 transition-colors" />
                        <input type="text" placeholder="名前、店舗名、メールで検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-pink-200 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>
                </GlassCard>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="min-w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <SortableTh label="花屋情報" sortKey="platformName" currentSort={sortConfig} onSort={handleSort} />
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">連絡先</th>
                                    <SortableTh label="ステータス" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                                    <SortableTh label="適用手数料率" sortKey="customFeeRate" currentSort={sortConfig} onSort={handleSort} align="right" />
                                    <th className="px-8 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">設定</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-8 py-20 text-center"><Loader2 className="animate-spin text-pink-500 size-8 mx-auto"/></td></tr>
                                ) : processedFlorists.length === 0 ? (
                                    <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold">該当するデータが見つかりません</td></tr>
                                ) : (
                                    processedFlorists.map((florist) => (
                                        <tr key={florist.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-pink-50 rounded-[1rem] flex items-center justify-center text-pink-500 font-black shadow-sm border border-pink-100">
                                                        {florist.platformName?.[0] || 'F'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800">{florist.platformName || '名称未設定'}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">ID: {florist.id.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-700">{florist.email}</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{florist.shopName || '-'}</div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <StatusBadge status={florist.status} />
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-right">
                                                {florist.customFeeRate !== null ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-pink-50 text-pink-600 border border-pink-100 shadow-sm gap-1">
                                                        <DollarSign size={12}/> {(florist.customFeeRate * 100).toFixed(1)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                                        全体設定 (標準)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button onClick={() => setTargetFloristId(florist.id)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-pink-600 bg-white border border-slate-200 hover:border-pink-200 hover:bg-pink-50 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 mx-auto">
                                                    <Edit3 size={14}/> 手数料設定
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {targetFloristId && (
                    <FloristFeeModal floristId={targetFloristId} onClose={() => setTargetFloristId(null)} onFeeUpdated={handleFeeUpdated} />
                )}
            </div>
        </div>
    );
}

export default function AdminFloristsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-pink-500 size-12" /></div>}>
      <AdminFloristsInner />
    </Suspense>
  );
}

const StatCard = ({ icon, label, value, color }) => {
    const colors = {
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        pink: 'bg-pink-50 text-pink-600 border-pink-100',
    };
    return (
        <GlassCard className="!p-6 flex items-center gap-5 hover:-translate-y-1 transition-transform">
            <div className={cn("p-4 rounded-[1.25rem] shadow-inner border", colors[color])}>{icon}</div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
            </div>
        </GlassCard>
    );
};

const SortableTh = ({ label, sortKey, currentSort, onSort, align = 'left' }) => (
    <th className={cn("px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none group", align === 'right' ? 'text-right' : 'text-left')} onClick={() => onSort(sortKey)}>
        <div className={cn("flex items-center gap-1.5", align === 'right' ? 'justify-end' : '')}>
            {label}
            <div className="flex flex-col text-[8px] text-slate-300">
                <span className={currentSort.key === sortKey && currentSort.direction === 'asc' ? 'text-pink-500' : ''}>▲</span>
                <span className={currentSort.key === sortKey && currentSort.direction === 'desc' ? 'text-pink-500' : ''}>▼</span>
            </div>
        </div>
    </th>
);

const StatusBadge = ({ status }) => {
    const styles = { APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200', PENDING: 'bg-amber-50 text-amber-600 border-amber-200', REJECTED: 'bg-rose-50 text-rose-600 border-rose-200' };
    const labels = { APPROVED: '承認済み', PENDING: '審査待ち', REJECTED: '却下/停止' };
    return <span className={cn("px-3 py-1.5 inline-flex text-[10px] font-black rounded-md border uppercase tracking-widest shadow-sm", styles[status] || 'bg-slate-50 text-slate-500 border-slate-200')}>{labels[status] || status}</span>;
};