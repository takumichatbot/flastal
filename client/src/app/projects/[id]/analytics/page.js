'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft, Eye, Users, TrendingUp, Target, Heart,
  RefreshCw, BarChart2, MousePointerClick, Download,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function StatCard({ icon: Icon, label, value, sub, color = 'sky' }) {
  const colors = {
    sky:    'bg-sky-50 text-sky-600 border-sky-100',
    pink:   'bg-pink-50 text-pink-600 border-pink-100',
    emerald:'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 ${colors[color]}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-white/70 shadow-sm"><Icon size={18} /></div>
        <span className="text-xs font-black uppercase tracking-widest opacity-70">{label}</span>
      </div>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      {sub && <p className="text-xs font-bold opacity-60 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function ProjectAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [data, setData] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchAnalytics();
  }, [id, isAuthenticated, loading]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const [analyticsRes, projectRes] = await Promise.all([
        fetch(`${API_URL}/api/projects/${id}/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/projects/${id}`),
      ]);
      if (analyticsRes.status === 403) { router.push(`/projects/${id}`); return; }
      if (!analyticsRes.ok) throw new Error();
      const analytics = await analyticsRes.json();
      const project = projectRes.ok ? await projectRes.json() : null;
      setData(analytics);
      if (project) setProjectTitle(project.title);
    } catch {
      router.push(`/projects/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin text-sky-400" size={32} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/projects/${id}`} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <BarChart2 size={20} className="text-sky-500" /> アナリティクス
            </h1>
            <p className="text-xs text-slate-400 font-medium truncate max-w-xs">{projectTitle}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <a
              href={`${API_URL}/api/projects/${id}/export/pledges`}
              onClick={e => {
                e.preventDefault();
                const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
                fetch(`${API_URL}/api/projects/${id}/export/pledges`, { headers: { Authorization: `Bearer ${token}` } })
                  .then(r => r.blob()).then(blob => {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `pledges_${id}.csv`;
                    a.click();
                  });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black border border-emerald-100 hover:bg-emerald-100 transition-colors"
            >
              <Download size={13} /> CSV
            </a>
            <button onClick={fetchAnalytics} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* KPI カード */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={Eye}             label="閲覧数"   value={data.viewCount.toLocaleString()}  color="sky" />
          <StatCard icon={Users}           label="支援者数" value={data.backerCount.toLocaleString()} color="pink" />
          <StatCard icon={MousePointerClick} label="CVR"   value={`${data.cvr}%`} sub="閲覧→支援の転換率" color="purple" />
          <StatCard icon={TrendingUp}      label="支援総額" value={`¥${data.collectedAmount.toLocaleString()}`} color="emerald" />
          <StatCard icon={Target}          label="達成率"   value={`${data.progress}%`} sub={`目標 ¥${data.targetAmount.toLocaleString()}`} color="amber" />
          <StatCard icon={Heart}           label="応援コメ" value={data.cheerCount.toLocaleString()} color="pink" />
        </div>

        {/* 日別累積支援額グラフ */}
        {data.dailyProgress.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-sky-500" /> 日別累積支援額
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.dailyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={v => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`}
                  width={52}
                />
                <Tooltip
                  formatter={v => [`¥${Number(v).toLocaleString()}`, '累積支援額']}
                  labelFormatter={l => `${l}`}
                />
                <Line
                  type="monotone" dataKey="total"
                  stroke="#ec4899" strokeWidth={2.5} dot={false}
                  activeDot={{ r: 5, fill: '#ec4899' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 平均支援額 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-slate-700 mb-2">平均支援額</h2>
          <p className="text-4xl font-black text-slate-800">
            ¥{data.avgPledge.toLocaleString()}
            <span className="text-sm font-bold text-slate-400 ml-2">/ 人</span>
          </p>
        </div>
      </div>
    </div>
  );
}
