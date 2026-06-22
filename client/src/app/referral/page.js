'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
    Gift, Copy, Check, Users, TrendingUp, Coins, Share2,
    Twitter, Link as LinkIcon, Loader2, ChevronRight, Star,
    CalendarDays, Download, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const REFERRAL_BONUS = 200;
const COMMISSION_RATE = 3;

const BANNER_MATERIALS = [
    { label: 'バナー 728×90（レクタングル）', file: '/banners/flastal_banner_728x90.png', size: '728×90' },
    { label: 'バナー 300×250（スクエア）',   file: '/banners/flastal_banner_300x250.png', size: '300×250' },
    { label: 'バナー 160×600（スカイスクレイパー）', file: '/banners/flastal_banner_160x600.png', size: '160×600' },
];

function CopyButton({ text, label }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('コピーしました！');
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black transition-colors">
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {label}
        </button>
    );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
            </div>
            <p className="text-xl font-black text-slate-800">{value}</p>
            <p className="text-xs font-bold text-slate-500">{label}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        PAID:      { label: '支払済', cls: 'bg-emerald-50 text-emerald-600' },
        CONFIRMED: { label: '確定済', cls: 'bg-blue-50 text-blue-600' },
        PENDING:   { label: '未確定', cls: 'bg-amber-50 text-amber-600' },
    };
    const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500' };
    return (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
    );
}

export default function ReferralPage() {
    const { isAuthenticated, token } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/referral/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setStats(await res.json());
        } catch {}
        finally { setLoading(false); }
    }, [token]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9FF]">
                <p className="text-slate-400 font-bold">ログインが必要です</p>
            </div>
        );
    }

    const referralUrl = stats?.referralUrl ?? '';
    const referralCode = stats?.referralCode ?? '';

    const twitterShareUrl = referralUrl
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(`FLASTALで推し活フラスタを一緒に作ろう！\n招待リンクから登録すると ${REFERRAL_BONUS}pt もらえるよ🌸\n`)}&url=${encodeURIComponent(referralUrl)}&hashtags=FLASTAL,フラスタ`
        : '#';

    return (
        <div className="min-h-screen bg-[#FAF9FF] font-sans">
            {/* ヒーロー */}
            <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-violet-600 py-12 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                        <Gift size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">友達招待プログラム</h1>
                    <p className="text-pink-100 text-sm font-bold">
                        招待した友達が登録 → 両者に <span className="text-white font-black">{REFERRAL_BONUS}pt</span> プレゼント<br />
                        友達が支援するたびに <span className="text-white font-black">{COMMISSION_RATE}%</span> のポイントが還元
                    </p>

                    {/* 紹介コードをヒーロー内に大きく表示 */}
                    {!loading && referralCode && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-6 inline-flex flex-col items-center gap-1"
                        >
                            <p className="text-pink-200 text-xs font-bold tracking-widest uppercase">あなたの招待コード</p>
                            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3">
                                <span className="text-white text-2xl font-black tracking-widest">{referralCode}</span>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(referralCode); toast.success('コピーしました！'); }}
                                    className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                >
                                    <Copy size={14} className="text-white" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-400" size={28} /></div>
                ) : stats ? (
                    <>
                        {/* 統計カード（4枚 → 2行2列 on mobile, 4列 on sm） */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard icon={Users}       label="合計紹介数"     value={`${stats.referredCount}人`}                        color="text-pink-500"    bg="bg-pink-50" />
                            <StatCard icon={CalendarDays} label="今月の紹介数"   value={`${stats.thisMonthReferredCount ?? 0}人`}           color="text-violet-500"  bg="bg-violet-50" />
                            <StatCard icon={Coins}        label="獲得ポイント合計" value={`${stats.totalReward.toLocaleString()}pt`}         color="text-amber-500"   bg="bg-amber-50" />
                            <StatCard icon={Star}         label="現在のポイント" value={`${stats.points.toLocaleString()}pt`}               color="text-emerald-500" bg="bg-emerald-50" />
                        </div>

                        {/* 招待URL */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <h2 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                                <LinkIcon size={14} className="text-pink-500" /> あなたの招待リンク
                            </h2>
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3">
                                <p className="flex-1 text-xs font-mono text-slate-600 truncate">{referralUrl}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <CopyButton text={referralUrl}  label="URLをコピー" />
                                <CopyButton text={referralCode} label={`コード: ${referralCode}`} />
                                <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-colors">
                                    <Twitter size={14} /> X でシェア
                                </a>
                            </div>
                        </div>

                        {/* 仕組み */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <h2 className="text-sm font-black text-slate-700 mb-4">仕組み</h2>
                            <div className="space-y-3">
                                {[
                                    { step: '1', text: `あなたの招待リンク経由で友達が登録`, reward: `+${REFERRAL_BONUS}pt（双方）` },
                                    { step: '2', text: '友達がFLASTALで企画を支援する', reward: `支援額の${COMMISSION_RATE}%をポイントで還元` },
                                    { step: '3', text: 'ポイントを次回の支援に使用', reward: '1pt = 1円 で利用可能' },
                                ].map(({ step, text, reward }) => (
                                    <div key={step} className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-full bg-pink-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{step}</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{text}</p>
                                            <p className="text-xs font-black text-pink-500">{reward}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* コミッション履歴テーブル */}
                        {stats.conversions.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <h2 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-amber-500" /> 紹介履歴
                                </h2>
                                {/* モバイル: カード形式 / sm以上: テーブル */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="text-left pb-2 font-black text-slate-400">日付</th>
                                                <th className="text-right pb-2 font-black text-slate-400">支援額</th>
                                                <th className="text-right pb-2 font-black text-slate-400">報酬</th>
                                                <th className="text-right pb-2 font-black text-slate-400">ステータス</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {stats.conversions.map((c) => (
                                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-2.5 text-slate-500">
                                                        {new Date(c.createdAt).toLocaleDateString('ja-JP')}
                                                    </td>
                                                    <td className="py-2.5 text-right font-bold text-slate-700">
                                                        ¥{c.pledgeAmount.toLocaleString()}
                                                    </td>
                                                    <td className="py-2.5 text-right font-black text-amber-600">
                                                        +{c.reward.toLocaleString()}pt
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <StatusBadge status={c.status ?? 'PENDING'} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* モバイル向けカードリスト */}
                                <div className="sm:hidden divide-y divide-slate-50">
                                    {stats.conversions.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between py-2.5">
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    ¥{c.pledgeAmount.toLocaleString()} の支援
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {new Date(c.createdAt).toLocaleDateString('ja-JP')}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-sm font-black text-amber-600">
                                                    +{c.reward.toLocaleString()}pt
                                                </span>
                                                <StatusBadge status={c.status ?? 'PENDING'} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 招待した人リスト */}
                        {stats.referredUsers.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <h2 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                                    <Users size={14} className="text-violet-500" /> 招待した友達
                                </h2>
                                <div className="divide-y divide-slate-50">
                                    {stats.referredUsers.map((u, i) => (
                                        <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                            className="flex items-center gap-3 py-2.5">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                                {u.iconUrl
                                                    ? <img src={u.iconUrl} alt={u.handleName} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-black">{u.handleName?.[0]}</div>
                                                }
                                            </div>
                                            <p className="flex-1 text-sm font-bold text-slate-700">{u.handleName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">
                                                {new Date(u.createdAt).toLocaleDateString('ja-JP')}
                                            </p>
                                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                +{REFERRAL_BONUS}pt
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 広告素材セクション */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <h2 className="text-sm font-black text-slate-700 mb-1 flex items-center gap-2">
                                <ImageIcon size={14} className="text-rose-500" /> 広告素材
                            </h2>
                            <p className="text-[11px] text-slate-400 mb-4">バナーをダウンロードしてブログやSNSで紹介できます</p>
                            <div className="space-y-2">
                                {BANNER_MATERIALS.map(({ label, file, size }) => (
                                    <div key={file} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                                                <ImageIcon size={14} className="text-pink-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{label}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">{size}px</p>
                                            </div>
                                        </div>
                                        <a
                                            href={file}
                                            download
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black transition-colors"
                                        >
                                            <Download size={12} /> DL
                                        </a>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3">
                                ※ バナーには必ず招待リンク（
                                <span className="font-mono">{referralUrl || `https://flastal.com/register?ref=YOUR_CODE`}</span>
                                ）を紐付けてください
                            </p>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-slate-400 py-20">データを読み込めませんでした</p>
                )}
            </div>
        </div>
    );
}
