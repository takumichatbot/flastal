'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Shield } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const ACTION_LABELS = {
  USER_SUSPEND:        { label: 'ユーザー停止',       icon: '🚫', color: 'bg-red-100 text-red-700' },
  USER_UNSUSPEND:      { label: '停止解除',            icon: '✅', color: 'bg-green-100 text-green-700' },
  USER_DELETE:         { label: 'ユーザー削除',        icon: '🗑️', color: 'bg-red-100 text-red-800' },
  PROJECT_DELETE:      { label: 'プロジェクト削除',    icon: '🗑️', color: 'bg-orange-100 text-orange-700' },
  PROJECT_APPROVE:     { label: 'プロジェクト承認',    icon: '✅', color: 'bg-green-100 text-green-700' },
  PROJECT_REJECT:      { label: 'プロジェクト拒否',    icon: '❌', color: 'bg-red-100 text-red-700' },
  PROJECT_FORCE_CLOSE: { label: '強制キャンセル',      icon: '⛔', color: 'bg-red-100 text-red-700' },
  FLORIST_APPROVE:     { label: '花屋承認',            icon: '✅', color: 'bg-green-100 text-green-700' },
  FLORIST_REJECT:      { label: '花屋否認',            icon: '❌', color: 'bg-red-100 text-red-700' },
  ILLUSTRATOR_APPROVE: { label: 'クリエイター承認',    icon: '✅', color: 'bg-green-100 text-green-700' },
  ILLUSTRATOR_REJECT:  { label: 'クリエイター否認',    icon: '❌', color: 'bg-red-100 text-red-700' },
  VENUE_APPROVE:       { label: '会場承認',            icon: '✅', color: 'bg-green-100 text-green-700' },
  VENUE_REJECT:        { label: '会場否認',            icon: '❌', color: 'bg-red-100 text-red-700' },
  ORGANIZER_APPROVE:   { label: '主催者承認',          icon: '✅', color: 'bg-green-100 text-green-700' },
  ORGANIZER_REJECT:    { label: '主催者否認',          icon: '❌', color: 'bg-red-100 text-red-700' },
  PAYOUT_APPROVE:      { label: '送金承認',            icon: '💰', color: 'bg-blue-100 text-blue-700' },
};

export default function AuditLogsPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterTargetType, setFilterTargetType] = useState('');
  const limit = 50;

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [user, router]);

  const fetchLogs = useCallback(async (newOffset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit, offset: newOffset });
      if (filterAction) params.append('action', filterAction);
      if (filterTargetType) params.append('targetType', filterTargetType);

      const res = await fetch(`${API_URL}/api/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setOffset(newOffset);
    } catch (e) {
      console.error('audit-logs fetch error:', e);
    }
    setLoading(false);
  }, [token, filterAction, filterTargetType]);

  useEffect(() => {
    if (token) fetchLogs(0);
  }, [token, fetchLogs]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Shield size={20} className="text-indigo-500" />
        管理者操作ログ（{total}件）
      </h1>

      {/* フィルター */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
        >
          <option value="">すべてのアクション</option>
          {Object.entries(ACTION_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          value={filterTargetType}
          onChange={(e) => setFilterTargetType(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
        >
          <option value="">すべての対象</option>
          {['User', 'Project', 'Florist', 'Venue', 'Organizer', 'Payout', 'PayoutRequest'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-semibold"
        >
          絞り込む
        </button>
        {(filterAction || filterTargetType) && (
          <button
            type="button"
            onClick={() => { setFilterAction(''); setFilterTargetType(''); }}
            className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm"
          >
            クリア
          </button>
        )}
      </form>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">監査ログがありません</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const meta = ACTION_LABELS[log.action] || { label: log.action, icon: '📋', color: 'bg-slate-100 text-slate-700' };
            return (
              <div key={log.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-4">
                <span className="text-xl flex-shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {log.targetType} #{log.targetId.slice(0, 8)}
                    </span>
                  </div>
                  {log.detail && (
                    <p className="text-xs text-slate-600 mt-1 truncate">
                      {typeof log.detail === 'object'
                        ? (log.detail.reason || log.detail.title || log.detail.role || JSON.stringify(log.detail))
                        : String(log.detail)}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 font-medium">
                      {log.admin?.handleName || log.admin?.email || '不明'}
                    </span>
                    <span className="text-xs text-slate-300">
                      {new Date(log.createdAt).toLocaleString('ja-JP')}
                    </span>
                    {log.ipAddress && (
                      <span className="text-xs text-slate-300">{log.ipAddress}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ページネーション */}
      {total > limit && (
        <div className="flex justify-between mt-6">
          <button
            onClick={() => fetchLogs(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            ← 前のページ
          </button>
          <span className="text-sm text-slate-400 self-center">
            {offset + 1}〜{Math.min(offset + limit, total)} / {total}件
          </span>
          <button
            onClick={() => fetchLogs(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            次のページ →
          </button>
        </div>
      )}
    </div>
  );
}
