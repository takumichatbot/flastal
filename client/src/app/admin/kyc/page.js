'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const STATUS_CONFIG = {
    PENDING:  { label: '審査待ち', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    APPROVED: { label: '承認済み', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    REJECTED: { label: '却下',    color: 'bg-rose-100 text-rose-700 border-rose-200',      icon: XCircle },
    NONE:     { label: '未提出',   color: 'bg-slate-100 text-slate-500 border-slate-200',   icon: Clock },
};

export default function AdminKycPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('PENDING');
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            router.push('/login');
        }
    }, [isAuthenticated, user, router, loading]);

    const fetchUsers = useCallback(async () => {
        setFetching(true);
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/admin/users?kycStatus=${filter}&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const arr = Array.isArray(data) ? data : (data.users || []);
            setUsers(arr.filter(u => u.kycStatus === filter || (filter === 'ALL')));
        } catch {
            toast.error('取得に失敗しました');
        } finally {
            setFetching(false);
        }
    }, [filter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleReview = async (userId, status) => {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        const res = await fetch(`${API_URL}/api/admin/users/${userId}/kyc`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ kycStatus: status }),
        });
        if (res.ok) {
            toast.success(status === 'APPROVED' ? '承認しました' : '却下しました');
            fetchUsers();
        } else {
            toast.error('操作に失敗しました');
        }
    };

    if (loading || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/admin" className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all">
                        <ArrowLeft size={18} className="text-slate-500" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" size={24} />
                        <h1 className="text-2xl font-black text-slate-800">KYC 本人確認審査</h1>
                    </div>
                </div>

                {/* フィルタータブ */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                filter === s
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'
                            }`}
                        >
                            {s === 'PENDING' ? '審査待ち' : s === 'APPROVED' ? '承認済み' : s === 'REJECTED' ? '却下' : '全件'}
                        </button>
                    ))}
                    <button
                        onClick={fetchUsers}
                        className="ml-auto p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                        <RefreshCw size={16} className={`text-slate-500 ${fetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {fetching ? (
                    <div className="flex justify-center py-20">
                        <RefreshCw className="animate-spin text-emerald-400" size={32} />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 font-bold">
                        該当するユーザーはいません
                    </div>
                ) : (
                    <div className="space-y-3">
                        {users.map(u => {
                            const cfg = STATUS_CONFIG[u.kycStatus] || STATUS_CONFIG.NONE;
                            const Icon = cfg.icon;
                            return (
                                <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-black text-slate-800 truncate">{u.handleName || u.email}</p>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                                <Icon size={10} />{cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                        {u.kycDocumentUrl && (
                                            <a
                                                href={u.kycDocumentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-bold text-sky-500 hover:text-sky-700 mt-1"
                                            >
                                                <ExternalLink size={12} /> 書類を確認
                                            </a>
                                        )}
                                    </div>

                                    {u.kycStatus === 'PENDING' && (
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleReview(u.id, 'APPROVED')}
                                                className="px-4 py-2 bg-emerald-500 text-white text-sm font-black rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-1.5"
                                            >
                                                <CheckCircle2 size={14} /> 承認
                                            </button>
                                            <button
                                                onClick={() => handleReview(u.id, 'REJECTED')}
                                                className="px-4 py-2 bg-rose-500 text-white text-sm font-black rounded-xl hover:bg-rose-600 transition-all flex items-center gap-1.5"
                                            >
                                                <XCircle size={14} /> 却下
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
