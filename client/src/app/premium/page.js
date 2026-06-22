'use client';

import { useState } from 'react';
import { Crown, BarChart3, Zap, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const FEATURES = [
    { icon: BarChart3, label: '詳細アナリティクス', desc: '日別/時間別支援グラフ、CVR分析、デバイス別統計' },
    { icon: Star,      label: '優先掲載',           desc: '検索結果・トップページで上位に表示' },
    { icon: Zap,       label: 'AIカバー画像無制限',  desc: 'DALL-E 3 によるカバー画像を無制限で生成' },
    { icon: Crown,     label: 'プレミアムバッジ',    desc: 'プロフィールと企画ページに表示される限定バッジ' },
];

export default function PremiumPage() {
    const { user, authenticatedFetch } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!user) { router.push('/login'); return; }
        setLoading(true);
        try {
            const r = await authenticatedFetch(`${API_URL}/api/payment/premium/checkout`, { method: 'POST' });
            const d = await r.json();
            if (r.ok && d.url) { window.location.href = d.url; }
            else toast.error(d.message || 'エラーが発生しました');
        } finally { setLoading(false); }
    };

    const handleCancel = async () => {
        if (!confirm('プレミアムプランをキャンセルしますか？')) return;
        setLoading(true);
        try {
            const r = await authenticatedFetch(`${API_URL}/api/payment/premium/cancel`, { method: 'DELETE' });
            const d = await r.json();
            if (r.ok) toast.success(d.message);
            else toast.error(d.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-950 to-slate-900 pb-24 text-white">
            {/* ヒーロー */}
            <div className="text-center px-4 pt-16 pb-10">
                <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 text-xs font-black px-4 py-1.5 rounded-full mb-6 border border-amber-400/30">
                    <Crown size={13} /> プレミアムプラン
                </div>
                <h1 className="text-4xl font-black tracking-tight mb-3">
                    企画をもっと<br />本気で育てよう
                </h1>
                <p className="text-violet-300 text-sm font-bold max-w-xs mx-auto leading-relaxed">
                    データドリブンな企画運営と優先露出で、目標達成率を高める
                </p>
                <div className="mt-8 text-5xl font-black text-white">
                    ¥980<span className="text-xl text-violet-400 font-bold"> / 月</span>
                </div>
            </div>

            {/* 特典リスト */}
            <div className="max-w-md mx-auto px-4 space-y-3 mb-8">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
                        <div className="w-9 h-9 rounded-xl bg-violet-600/40 flex items-center justify-center shrink-0">
                            <Icon size={17} className="text-violet-300" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white">{label}</p>
                            <p className="text-xs text-violet-400 font-bold mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5 ml-auto" />
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="max-w-md mx-auto px-4">
                {user?.isPremium ? (
                    <div className="space-y-3">
                        <div className="w-full py-4 bg-emerald-500/20 text-emerald-300 rounded-2xl text-sm font-black flex items-center justify-center gap-2 border border-emerald-500/30">
                            <CheckCircle2 size={16} /> プレミアム会員です
                        </div>
                        <button onClick={handleCancel} disabled={loading}
                            className="w-full py-3 text-slate-400 text-xs font-bold underline">
                            解約する
                        </button>
                    </div>
                ) : (
                    <button onClick={handleSubscribe} disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                        {loading ? <Loader2 size={15} className="animate-spin" /> : <Crown size={15} />}
                        プレミアムに登録する
                    </button>
                )}
                <p className="text-center text-xs text-violet-500 mt-3">いつでもキャンセル可能・月末まで有効</p>
            </div>
        </div>
    );
}
