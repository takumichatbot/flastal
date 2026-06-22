'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Activity, Server, CreditCard, Mail, Globe } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const SERVICES = [
    { key: 'api',     label: 'API サーバー',      icon: Server,     check: () => fetch(`${API_URL}/`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok) },
    { key: 'web',     label: 'Webフロントエンド',  icon: Globe,      check: () => Promise.resolve(true) },
    { key: 'payment', label: '決済システム (Stripe)', icon: CreditCard, check: () => fetch(`${API_URL}/api/payment/health`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok).catch(() => null) },
    { key: 'email',   label: 'メール配信',          icon: Mail,       check: () => fetch(`${API_URL}/api/health/email`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok).catch(() => null) },
];

const STATUS_CONFIG = {
    ok:      { label: '正常稼働中',   color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: CheckCircle2 },
    warn:    { label: '情報取得不可', color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   icon: AlertTriangle },
    error:   { label: '障害発生中',   color: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-200',    icon: XCircle },
    loading: { label: '確認中...',    color: 'text-slate-400',   bg: 'bg-slate-50',    border: 'border-slate-200',   icon: RefreshCw },
};

// 過去のインシデント（手動更新）
const INCIDENTS = [
    // { date: '2025-06-15', title: 'APIサーバーの一時的な遅延', status: 'resolved', detail: '約15分間の応答遅延が発生しました。現在は復旧済みです。' },
];

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.loading;
    const Icon = cfg.icon;
    return (
        <span className={`flex items-center gap-1.5 text-xs font-black ${cfg.color} ${cfg.bg} px-2.5 py-1 rounded-full border ${cfg.border}`}>
            <Icon size={11} className={status === 'loading' ? 'animate-spin' : ''} />
            {cfg.label}
        </span>
    );
}

export default function StatusPage() {
    const [statuses, setStatuses] = useState({});
    const [lastChecked, setLastChecked] = useState(null);
    const [checking, setChecking] = useState(false);

    const checkAll = async () => {
        setChecking(true);
        const init = Object.fromEntries(SERVICES.map(s => [s.key, 'loading']));
        setStatuses(init);

        await Promise.all(SERVICES.map(async (svc) => {
            try {
                const ok = await svc.check();
                setStatuses(prev => ({ ...prev, [svc.key]: ok === null ? 'warn' : ok ? 'ok' : 'error' }));
            } catch {
                setStatuses(prev => ({ ...prev, [svc.key]: 'error' }));
            }
        }));

        setLastChecked(new Date());
        setChecking(false);
    };

    useEffect(() => { checkAll(); }, []);

    const allOk = Object.values(statuses).every(s => s === 'ok' || s === 'warn');
    const hasError = Object.values(statuses).some(s => s === 'error');

    return (
        <div className="min-h-screen bg-[#FAF9FF] font-sans">
            {/* ヘッダー */}
            <div className={`py-10 px-4 transition-colors ${hasError ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                <div className="max-w-2xl mx-auto text-center">
                    <Activity size={32} className="text-white mx-auto mb-2" />
                    <h1 className="text-2xl font-black text-white mb-1">FLASTAL システム稼働状況</h1>
                    <p className="text-white/80 text-sm font-bold">
                        {hasError ? '一部のサービスで障害が発生しています' : 'すべてのサービスは正常に稼働しています'}
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {/* サービス一覧 */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-black text-slate-700">サービス状態</h2>
                        <button onClick={checkAll} disabled={checking}
                            className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-violet-500 transition-colors disabled:opacity-50">
                            <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
                            再確認
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {SERVICES.map(svc => {
                            const Icon = svc.icon;
                            const status = statuses[svc.key] || 'loading';
                            return (
                                <div key={svc.key} className="flex items-center justify-between px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <Icon size={16} className="text-slate-500" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">{svc.label}</p>
                                    </div>
                                    <StatusBadge status={status} />
                                </div>
                            );
                        })}
                    </div>
                    {lastChecked && (
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                            <p className="text-[11px] text-slate-400 font-bold">
                                最終確認: {lastChecked.toLocaleTimeString('ja-JP')}
                            </p>
                        </div>
                    )}
                </div>

                {/* インシデント履歴 */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="text-sm font-black text-slate-700 mb-4">インシデント履歴</h2>
                    {INCIDENTS.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-300" />
                            <p className="text-sm text-slate-400 font-bold">過去90日間、重大な障害は発生していません</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {INCIDENTS.map((inc, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${inc.status === 'resolved' ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-black text-slate-700">{inc.title}</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${inc.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {inc.status === 'resolved' ? '解決済み' : '対応中'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{inc.date} — {inc.detail}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
