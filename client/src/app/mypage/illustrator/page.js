'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Palette, Briefcase, CheckCircle2, Clock, Loader2,
  ChevronRight, Settings, AlertCircle, Star,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800">{value ?? '—'}</p>
        <p className="text-xs font-bold text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function OfferCard({ offer, onAccept, onReject }) {
  const [loading, setLoading] = useState(false);

  const handle = async (action) => {
    setLoading(true);
    await action();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
      <p className="font-black text-slate-800 text-sm">{offer.project?.title}</p>
      <p className="text-xs text-slate-500 mt-0.5">
        {offer.project?.planner?.handleName} 様より ・ 報酬 {offer.amount?.toLocaleString()}円
      </p>
      {offer.message && (
        <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap line-clamp-3">
          {offer.message}
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handle(() => onAccept(offer.id))}
          disabled={loading}
          className="flex-1 py-2 rounded-xl bg-pink-500 text-white text-xs font-black hover:bg-pink-600 disabled:opacity-50"
        >
          承諾する
        </button>
        <button
          onClick={() => handle(() => onReject(offer.id))}
          disabled={loading}
          className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200 disabled:opacity-50"
        >
          辞退する
        </button>
      </div>
    </div>
  );
}

function ProjectRow({ project }) {
  const statusLabel = {
    FUNDRAISING: '募集中',
    SUCCESSFUL: '達成',
    IN_PROGRESS: '制作中',
    COMPLETED: '完了',
  }[project.status] ?? project.status;

  const deadline = project.deliveryDateTime
    ? new Date(project.deliveryDateTime).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    : null;

  return (
    <Link href={`/projects/${project.id}`} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3 hover:border-pink-200 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{project.title}</p>
        {deadline && <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Clock size={11} /> 納期 {deadline}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-black text-pink-600 bg-pink-50 rounded-full px-2 py-0.5">{statusLabel}</span>
        <ChevronRight size={14} className="text-slate-300" />
      </div>
    </Link>
  );
}

export default function IllustratorMyPage() {
  const router = useRouter();
  const { user, authenticatedFetch, loading: authLoading } = useAuth();

  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [offers, setOffers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const load = useCallback(async () => {
    setDataLoading(true);
    try {
      const [statsRes, projectsRes, offersRes] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/illustrators/dashboard/stats`),
        authenticatedFetch(`${API_URL}/api/illustrators/projects`),
        authenticatedFetch(`${API_URL}/api/illustrators/offers`),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (offersRes.ok) setOffers(await offersRes.json());
    } catch {
      toast.error('データの取得に失敗しました');
    } finally {
      setDataLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'ILLUSTRATOR') { router.replace('/mypage'); return; }
    load();
  }, [authLoading, user, router, load]);

  const handleAccept = useCallback(async (offerId) => {
    const res = await authenticatedFetch(`${API_URL}/api/illustrators/offers/${offerId}/accept`, { method: 'PATCH' });
    if (res.ok) {
      toast.success('オファーを承諾しました');
      setOffers(prev => prev.filter(o => o.id !== offerId));
    } else {
      toast.error('操作に失敗しました');
    }
  }, [authenticatedFetch]);

  const handleReject = useCallback(async (offerId) => {
    const res = await authenticatedFetch(`${API_URL}/api/illustrators/offers/${offerId}/reject`, { method: 'PATCH' });
    if (res.ok) {
      toast.success('オファーを辞退しました');
      setOffers(prev => prev.filter(o => o.id !== offerId));
    } else {
      toast.error('操作に失敗しました');
    }
  }, [authenticatedFetch]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-pink-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center shadow-sm">
              <Palette size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800">絵師ダッシュボード</h1>
              <p className="text-xs text-slate-500">{user?.handleName} さん</p>
            </div>
          </div>
          <Link href="/mypage/edit" className="p-2 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-colors">
            <Settings size={18} className="text-slate-500" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="進行中の案件" value={stats?.activeOrders} icon={Clock} color="bg-pink-400" />
          <StatCard label="完了した案件" value={stats?.completedOrders} icon={CheckCircle2} color="bg-emerald-400" />
        </div>

        {/* Pending offers */}
        {offers.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertCircle size={13} /> 届いたオファー ({offers.length})
            </h2>
            <div className="space-y-3">
              {offers.map(offer => (
                <OfferCard key={offer.id} offer={offer} onAccept={handleAccept} onReject={handleReject} />
              ))}
            </div>
          </section>
        )}

        {/* Active projects */}
        <section>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">進行中の案件</h2>
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 px-6 py-10 text-center text-slate-400 text-sm font-bold">
              現在進行中の案件はありません
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map(p => <ProjectRow key={p.id} project={p} />)}
            </div>
          )}
        </section>

        {/* Quick links */}
        <section>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">クイックリンク</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/illustrators/recruitment" className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-2 hover:border-pink-200 transition-colors">
              <Briefcase size={20} className="text-pink-400" />
              <p className="text-sm font-black text-slate-700">案件ボード</p>
              <p className="text-xs text-slate-400">絵師を求める企画を探す</p>
            </Link>
            <Link href={`/illustrators/${user?.id}`} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-2 hover:border-pink-200 transition-colors">
              <Star size={20} className="text-amber-400" />
              <p className="text-sm font-black text-slate-700">公開プロフィール</p>
              <p className="text-xs text-slate-400">自分の絵師ページを確認</p>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
