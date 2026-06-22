'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Crown, Medal, Star, BarChart2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const RANK_STYLES = [
    { bg: 'bg-amber-50 border-amber-200', icon: <Crown size={16} className="text-amber-500" />, num: 'text-amber-500' },
    { bg: 'bg-slate-50 border-slate-200', icon: <Medal size={16} className="text-slate-400" />, num: 'text-slate-400' },
    { bg: 'bg-orange-50 border-orange-200', icon: <Star size={16} className="text-orange-400" />, num: 'text-orange-400' },
];

function getRankStyle(rank) {
    return RANK_STYLES[rank - 1] || { bg: 'bg-white border-slate-100', icon: null, num: 'text-slate-400' };
}

function SkeletonCard() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 rounded-full w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                <div className="h-1.5 bg-slate-100 rounded-full w-full" />
            </div>
            <div className="space-y-1.5 text-right shrink-0">
                <div className="h-3.5 bg-slate-200 rounded-full w-16" />
                <div className="h-2.5 bg-slate-100 rounded-full w-10 ml-auto" />
            </div>
        </div>
    );
}

function EmptyState({ tab }) {
    return (
        <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                {tab === 'projects'
                    ? <BarChart2 size={28} className="text-slate-300" />
                    : <Users size={28} className="text-slate-300" />
                }
            </div>
            <p className="text-slate-500 font-black text-sm mb-1">
                {tab === 'projects' ? '今月の企画ランキングはまだありません' : '今月の支援者ランキングはまだありません'}
            </p>
            <p className="text-slate-400 text-xs font-bold">月が始まったばかりかもしれません。しばらくしてから再度ご確認ください。</p>
        </div>
    );
}

export default function RankingPage() {
    const [data, setData] = useState(null);
    const [tab, setTab] = useState('projects');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/projects/ranking/monthly`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setData(d); })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* ヘッダー */}
            <div className="bg-gradient-to-br from-pink-500 to-violet-600 text-white px-4 pt-12 pb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy size={24} />
                    <h1 className="text-2xl font-black tracking-tight">月間ランキング</h1>
                </div>
                <p className="text-pink-100 text-sm font-bold">{data?.month}</p>
            </div>

            {/* タブ */}
            <div className="max-w-2xl mx-auto px-4 -mt-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex p-1 mb-6">
                    {[
                        { key: 'projects', label: '人気企画', icon: TrendingUp },
                        { key: 'pledgers', label: '支援者', icon: Users },
                    ].map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                                tab === key
                                    ? 'bg-pink-500 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}>
                            <Icon size={15} /> {label}
                        </button>
                    ))}
                </div>

                {/* 企画ランキング */}
                {tab === 'projects' && (
                    loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : !data?.topProjects?.length ? (
                        <EmptyState tab="projects" />
                    ) : (
                        <div className="space-y-3">
                            {data.topProjects.map((p, i) => {
                                const s = getRankStyle(p.rank);
                                const pct = Math.min(Math.round((p.collectedAmount / Math.max(p.targetAmount, 1)) * 100), 100);
                                return (
                                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                        <Link href={`/projects/${p.id}`} className={`flex items-center gap-4 p-4 rounded-2xl border ${s.bg} hover:shadow-md transition-shadow`}>
                                            <div className="flex items-center justify-center w-8 shrink-0">
                                                {p.rank <= 3 ? s.icon : <span className={`text-sm font-black ${s.num}`}>{p.rank}</span>}
                                            </div>
                                            {p.imageUrl && (
                                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                                                    <Image src={p.imageUrl} alt={p.title} width={48} height={48} className="object-cover w-full h-full" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 line-clamp-1">{p.title}</p>
                                                <p className="text-[11px] text-slate-400 font-bold">{p.planner?.handleName}</p>
                                                <div className="mt-1.5 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                    <div className="h-full bg-pink-400 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-pink-600">¥{p.collectedAmount.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{p.backerCount}人</p>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )
                )}

                {/* 支援者ランキング */}
                {tab === 'pledgers' && (
                    loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : !data?.topPledgers?.length ? (
                        <EmptyState tab="pledgers" />
                    ) : (
                        <div className="space-y-3">
                            {data.topPledgers.map((u, i) => {
                                const s = getRankStyle(u.rank);
                                return (
                                    <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                        <Link href={`/users/${u.id}`} className={`flex items-center gap-4 p-4 rounded-2xl border ${s.bg} hover:shadow-md transition-shadow`}>
                                            <div className="flex items-center justify-center w-8 shrink-0">
                                                {u.rank <= 3 ? s.icon : <span className={`text-sm font-black ${s.num}`}>{u.rank}</span>}
                                            </div>
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                                {u.iconUrl
                                                    ? <Image src={u.iconUrl} alt={u.handleName} width={40} height={40} className="object-cover w-full h-full" />
                                                    : <div className="w-full h-full flex items-center justify-center text-slate-300"><Users size={18} /></div>
                                                }
                                            </div>
                                            <p className="flex-1 text-sm font-black text-slate-800 truncate">{u.handleName}</p>
                                            <p className="text-sm font-black text-emerald-600">¥{u.totalAmount.toLocaleString()}</p>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
