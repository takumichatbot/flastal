'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Search, RefreshCw, ArrowLeft, CheckCircle, XCircle, Clock, ExternalLink, Palette } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const GlassCard = ({ children, className }) => (
  <div className={cn('bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6', className)}>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    APPROVED: { label: '承認済み', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={11} /> },
    PENDING:  { label: '審査待ち', cls: 'bg-amber-100 text-amber-700',   icon: <Clock size={11} /> },
    SUSPENDED:{ label: '停止中',   cls: 'bg-red-100 text-red-700',       icon: <XCircle size={11} /> },
    REJECTED: { label: '却下',     cls: 'bg-slate-100 text-slate-500',   icon: <XCircle size={11} /> },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold', s.cls)}>
      {s.icon}{s.label}
    </span>
  );
};

export default function AdminIllustratorsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [illustrators, setIllustrators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      toast.error('管理者権限がありません');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchIllustrators = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/illustrators/all`, {
        headers: { Authorization: `Bearer ${window.__flastalToken}` },
      });
      if (!res.ok) throw new Error('取得失敗');
      setIllustrators(await res.json());
    } catch {
      toast.error('イラストレーター一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated && user?.role === 'ADMIN') fetchIllustrators(); }, [isAuthenticated, user, fetchIllustrators]);

  const handleStatus = async (id, status) => {
    setProcessingId(id);
    const toastId = toast.loading('処理中...');
    try {
      const res = await fetch(`${API_URL}/api/admin/illustrators/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${window.__flastalToken}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).message || '失敗');
      toast.success(status === 'APPROVED' ? '承認しました' : status === 'REJECTED' ? '却下しました' : '停止しました', { id: toastId });
      fetchIllustrators();
    } catch (e) {
      toast.error(e.message, { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = useMemo(() => {
    return illustrators.filter(ill => {
      const matchStatus = statusFilter === 'ALL' || ill.status === statusFilter;
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || ill.handleName?.toLowerCase().includes(q) || ill.email?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [illustrators, statusFilter, searchTerm]);

  if (authLoading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-amber-500" size={32} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto space-y-6 pt-4">

        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition">
            <ArrowLeft size={18} className="text-slate-500" />
          </Link>
          <div className="flex items-center gap-2">
            <Palette className="text-purple-500" size={22} />
            <h1 className="text-2xl font-black text-slate-800">イラストレーター管理</h1>
          </div>
          <span className="ml-auto text-xs font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">
            {filtered.length} 件
          </span>
        </div>

        {/* フィルター */}
        <GlassCard className="!p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="名前・メールで検索"
                className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="ALL">全てのステータス</option>
              <option value="PENDING">審査待ち</option>
              <option value="APPROVED">承認済み</option>
              <option value="SUSPENDED">停止中</option>
            </select>
            <button onClick={fetchIllustrators} className="px-4 py-2 text-sm bg-purple-500 text-white rounded-2xl font-bold hover:bg-purple-600 transition flex items-center gap-2">
              <RefreshCw size={14} />更新
            </button>
          </div>
        </GlassCard>

        {/* 一覧 */}
        <GlassCard className="!p-0 overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <RefreshCw className="animate-spin text-purple-400" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm font-bold">該当するイラストレーターがいません</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(ill => (
                <div key={ill.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/60 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-800">{ill.handleName || '名前未設定'}</span>
                      <StatusBadge status={ill.status} />
                      {ill.roles?.includes('ILLUSTRATOR') && ill.role !== 'ILLUSTRATOR' && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded-full">マルチロール</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{ill.email}</p>
                    {ill.illustratorProfile?.portfolio && (
                      <a href={ill.illustratorProfile.portfolio} target="_blank" rel="noreferrer"
                        className="text-xs text-purple-500 hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink size={10} />ポートフォリオ
                      </a>
                    )}
                    <p className="text-[10px] text-slate-300 mt-1">登録: {new Date(ill.createdAt).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {ill.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleStatus(ill.id, 'APPROVED')}
                        disabled={processingId === ill.id}
                        className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition disabled:opacity-50"
                      >承認</button>
                    )}
                    {ill.status !== 'SUSPENDED' && (
                      <button
                        onClick={() => handleStatus(ill.id, 'SUSPENDED')}
                        disabled={processingId === ill.id}
                        className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition disabled:opacity-50"
                      >停止</button>
                    )}
                    {ill.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatus(ill.id, 'REJECTED')}
                        disabled={processingId === ill.id}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-300 text-slate-700 rounded-xl hover:bg-slate-400 transition disabled:opacity-50"
                      >却下</button>
                    )}
                    {ill.status === 'SUSPENDED' && (
                      <button
                        onClick={() => handleStatus(ill.id, 'APPROVED')}
                        disabled={processingId === ill.id}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition disabled:opacity-50"
                      >停止解除</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
