'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
    TrendingUp, Eye, Users, Heart, Target, BarChart2,
    ChevronRight, Loader2, ArrowUpRight, Percent, Download,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function StatCard({ icon: Icon, label, value, sub, color = 'text-pink-500', bg = 'bg-pink-50' }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-black text-slate-800">{value}</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="text-slate-500 text-xs mb-1">{label}</p>
            <p className="font-black text-pink-600">¥{payload[0].value.toLocaleString()}</p>
        </div>
    );
}

function ProjectAnalyticsCard({ project, token }) {
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        if (data || loading) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/projects/${project.id}/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setData(await res.json());
        } catch (err) { console.error('[Dashboard] analytics fetch failed:', err); }
        finally { setLoading(false); }
    };

    const toggle = () => {
        setOpen(o => !o);
        if (!open) load();
    };

    const pct = Math.min(
        Math.round(((project.collectedAmount || 0) / Math.max(project.targetAmount || 1, 1)) * 100),
        100
    );

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={toggle} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left">
                <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-800 truncate">{project.title}</p>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-black text-pink-500 shrink-0">{pct}%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-bold">
                        ¥{(project.collectedAmount || 0).toLocaleString()} / ¥{(project.targetAmount || 0).toLocaleString()}
                    </p>
                </div>
                <ChevronRight size={16} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
            </button>

            {open && (
                <div className="border-t border-slate-100 p-4">
                    {loading ? (
                        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-pink-400" size={24} /></div>
                    ) : data ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                                <StatCard icon={Eye}        label="ページビュー" value={data.viewCount.toLocaleString()}      bg="bg-sky-50"     color="text-sky-500" />
                                <StatCard icon={Users}      label="支援者数"     value={`${data.backerCount}人`}               bg="bg-violet-50"  color="text-violet-500" />
                                <StatCard icon={Percent}    label="CVR"         value={`${data.cvr}%`}                        bg="bg-amber-50"   color="text-amber-500" />
                                <StatCard icon={TrendingUp} label="平均支援額"   value={`¥${data.avgPledge.toLocaleString()}`} bg="bg-emerald-50" color="text-emerald-500" />
                            </div>

                            {data.dailyProgress.length > 1 && (
                                <div>
                                    <p className="text-xs font-black text-slate-500 mb-3 flex items-center gap-1">
                                        <BarChart2 size={12} /> 累積支援額の推移
                                    </p>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <AreaChart data={data.dailyProgress} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                            <defs>
                                                <linearGradient id={`grad-${project.id}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                                                tickFormatter={d => d.slice(5)} />
                                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                                                tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} width={40} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="total" stroke="#f43f5e" strokeWidth={2}
                                                fill={`url(#grad-${project.id})`} dot={false} activeDot={{ r: 4, fill: '#f43f5e' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            <div className="mt-4 flex gap-3">
                                <Link href={`/projects/${project.id}`}
                                    className="flex items-center gap-1.5 text-xs font-black text-violet-500 hover:text-violet-700 transition-colors">
                                    企画ページを見る <ArrowUpRight size={12} />
                                </Link>
                                <button
                                    onClick={() => {
                                        fetch(`${API_URL}/api/projects/${project.id}/export/pledges`, {
                                            headers: { Authorization: `Bearer ${token}` },
                                        }).then(r => r.blob()).then(blob => {
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url; a.download = `pledges_${project.id}.csv`;
                                            a.click(); URL.revokeObjectURL(url);
                                        });
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors">
                                    <Download size={12} /> CSV
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-4">データを読み込めませんでした</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const { isAuthenticated, token } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ totalCollected: 0, totalProjects: 0, totalBackers: 0 });

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        fetch(`${API_URL}/api/projects?myProjects=true&limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : data?.projects || [];
                setProjects(list);
                setSummary({
                    totalCollected: list.reduce((s, p) => s + (p.collectedAmount || 0), 0),
                    totalProjects: list.length,
                    totalBackers: list.reduce((s, p) => s + (p._count?.pledges || 0), 0),
                });
            })
            .catch((err) => {
                console.error('[Dashboard] projects fetch failed:', err);
                toast.error('データの取得に失敗しました');
            })
            .finally(() => setLoading(false));
    }, [token]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9FF]">
                <p className="text-slate-400 font-bold">ログインが必要です</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9FF] font-sans">
            {/* ヘッダー */}
            <div className="bg-gradient-to-br from-violet-600 to-pink-500 py-10 px-4">
                <div className="max-w-3xl mx-auto">
                    <p className="text-violet-200 text-xs font-black uppercase tracking-widest mb-1">Planner Dashboard</p>
                    <h1 className="text-2xl font-black text-white">プランナーダッシュボード</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* サマリー */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <StatCard icon={Target}     label="合計調達額"  value={`¥${summary.totalCollected.toLocaleString()}`} color="text-pink-500"   bg="bg-pink-50" />
                    <StatCard icon={Heart}      label="企画数"      value={`${summary.totalProjects}件`}                  color="text-violet-500" bg="bg-violet-50" />
                    <StatCard icon={Users}      label="延べ支援者"  value={`${summary.totalBackers}人`}                   color="text-emerald-500" bg="bg-emerald-50" />
                </div>

                {/* 企画一覧 */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black text-slate-700 flex items-center gap-2"><BarChart2 size={14} /> 企画の分析</h2>
                    <Link href="/projects/create"
                        className="flex items-center gap-1 text-xs font-black text-pink-500 hover:text-pink-700 transition-colors">
                        新しい企画 <ArrowUpRight size={12} />
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-violet-400" size={28} /></div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <Target size={36} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold text-sm">まだ企画がありません</p>
                        <Link href="/projects/create" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-pink-500 hover:underline">
                            最初の企画を作る <ArrowUpRight size={12} />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {projects.map(p => (
                            <ProjectAnalyticsCard key={p.id} project={p} token={token} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
