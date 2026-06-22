'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { AlertTriangle, RefreshCw, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminFraudFlagsPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const [flags, setFlags] = useState([]);
    const [showReviewed, setShowReviewed] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') router.push('/login');
    }, [isAuthenticated, user, router, loading]);

    const fetchFlags = useCallback(async () => {
        setFetching(true);
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/admin/fraud-flags`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setFlags(Array.isArray(data) ? data : []);
        } catch {
            toast.error('取得に失敗しました');
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => { fetchFlags(); }, [fetchFlags]);

    const handleReview = async (id) => {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        const res = await fetch(`${API_URL}/api/admin/fraud-flags/${id}/review`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            toast.success('確認済みにしました');
            fetchFlags();
        } else {
            toast.error('操作に失敗しました');
        }
    };

    const displayed = flags.filter(f => showReviewed ? f.reviewed : !f.reviewed);

    if (loading || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/admin" className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all">
                        <ArrowLeft size={18} className="text-slate-500" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-rose-500" size={24} />
                        <h1 className="text-2xl font-black text-slate-800">不正支援フラグ</h1>
                        {!showReviewed && flags.filter(f => !f.reviewed).length > 0 && (
                            <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                                {flags.filter(f => !f.reviewed).length}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setShowReviewed(false)}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${!showReviewed ? 'bg-rose-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-rose-300'}`}
                    >
                        未対応
                    </button>
                    <button
                        onClick={() => setShowReviewed(true)}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${showReviewed ? 'bg-slate-700 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}
                    >
                        確認済み
                    </button>
                    <button onClick={fetchFlags} className="ml-auto p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all">
                        <RefreshCw size={16} className={`text-slate-500 ${fetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {fetching ? (
                    <div className="flex justify-center py-20">
                        <RefreshCw className="animate-spin text-rose-400" size={32} />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="text-center py-20">
                        <CheckCircle2 className="text-emerald-400 mx-auto mb-3" size={40} />
                        <p className="text-slate-400 font-bold">未対応の不正フラグはありません</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayed.map(flag => (
                            <div key={flag.id} className={`bg-white rounded-2xl border p-5 ${flag.reviewed ? 'border-slate-200 opacity-60' : 'border-rose-200'}`}>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            {flag.reasons?.map(r => (
                                                <span key={r} className="text-[11px] font-black bg-rose-100 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-200">
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-sm text-slate-700 font-medium mb-1">
                                            <span className="font-black">ユーザー: </span>
                                            {flag.user?.handleName || flag.userId}
                                            {flag.user?.email && <span className="text-slate-400 ml-1 text-xs">({flag.user.email})</span>}
                                        </div>
                                        <div className="text-sm text-slate-700 font-medium mb-2">
                                            <span className="font-black">企画: </span>
                                            {flag.project?.title || flag.projectId}
                                            <Link
                                                href={`/projects/${flag.projectId}`}
                                                target="_blank"
                                                className="ml-1.5 text-sky-500 hover:text-sky-700 inline-flex items-center gap-0.5"
                                            >
                                                <ExternalLink size={11} />
                                            </Link>
                                        </div>
                                        <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-2.5 font-mono">{flag.details}</p>
                                        <p className="text-[11px] text-slate-400 mt-2">
                                            {new Date(flag.createdAt).toLocaleString('ja-JP')}
                                        </p>
                                    </div>
                                    {!flag.reviewed && (
                                        <button
                                            onClick={() => handleReview(flag.id)}
                                            className="shrink-0 px-4 py-2 bg-slate-700 text-white text-sm font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5"
                                        >
                                            <CheckCircle2 size={14} /> 確認済みにする
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
