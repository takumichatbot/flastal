'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const STATUS_MAP = {
    active:   { label: '有効', cls: 'bg-emerald-100 text-emerald-700' },
    canceled: { label: 'キャンセル済み', cls: 'bg-slate-100 text-slate-500' },
    past_due: { label: '支払い遅延', cls: 'bg-red-100 text-red-600' },
};

export default function SubscriptionsPage() {
    const { authenticatedFetch } = useAuth();
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(null);

    const fetchSubs = async () => {
        const r = await authenticatedFetch(`${API_URL}/api/payment/subscriptions/mine`);
        if (r.ok) setSubs(await r.json());
        setLoading(false);
    };

    useEffect(() => { fetchSubs(); }, []);

    const handleCancel = async (subscriptionId) => {
        if (!confirm('定期支援をキャンセルしますか？次回以降の支援は行われなくなります。')) return;
        setCanceling(subscriptionId);
        try {
            const r = await authenticatedFetch(`${API_URL}/api/payment/subscriptions/${subscriptionId}`, { method: 'DELETE' });
            const d = await r.json();
            if (r.ok) { toast.success(d.message); fetchSubs(); }
            else toast.error(d.message);
        } finally { setCanceling(null); }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <div className="max-w-2xl mx-auto px-4 pt-10">
                <h1 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2">
                    <RefreshCw size={22} className="text-pink-500" /> 定期支援管理
                </h1>
                <p className="text-sm text-slate-500 mb-6">毎月自動で支援される企画の一覧です。</p>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                    </div>
                ) : subs.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-bold">
                        定期支援はありません
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subs.map(s => {
                            const st = STATUS_MAP[s.subscriptionStatus] || STATUS_MAP.canceled;
                            return (
                                <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                                    {s.project?.imageUrl && (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                                            <Image src={s.project.imageUrl} alt={s.project.title} width={48} height={48} className="object-cover w-full h-full" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/projects/${s.project?.id}`} className="text-sm font-black text-slate-800 hover:text-pink-600 line-clamp-1 transition-colors">
                                            {s.project?.title || '削除された企画'}
                                        </Link>
                                        <p className="text-xs text-slate-400 font-bold mt-0.5">
                                            月額 ¥{s.amount.toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
                                    {s.subscriptionStatus === 'active' && (
                                        <button onClick={() => handleCancel(s.subscriptionId)}
                                            disabled={canceling === s.subscriptionId}
                                            className="shrink-0 p-2 text-slate-300 hover:text-red-400 transition-colors">
                                            <XCircle size={18} />
                                        </button>
                                    )}
                                    {s.subscriptionStatus === 'canceled' && (
                                        <CheckCircle2 size={18} className="shrink-0 text-slate-300" />
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
