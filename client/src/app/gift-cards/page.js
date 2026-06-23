'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Gift, Copy, Check, Loader2, Plus, RefreshCw, Tag } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function IssueForm({ token, onIssued }) {
    const [points, setPoints] = useState(1000);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/gift-cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ points: Number(points), message }),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            const card = await res.json();
            toast.success('ギフトカードを発行しました！');
            onIssued(card);
            setMessage('');
        } catch (err) {
            toast.error(err.message || '発行に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2"><Plus size={16} className="text-pink-500" /> ギフトカード発行</h2>
            <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">ポイント数</label>
                <div className="flex gap-2 flex-wrap mb-2">
                    {[500, 1000, 3000, 5000, 10000].map(p => (
                        <button type="button" key={p} onClick={() => setPoints(p)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${points === p ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-pink-50'}`}>
                            {p.toLocaleString()}pt
                        </button>
                    ))}
                </div>
                <input type="number" value={points} onChange={e => setPoints(e.target.value)} min={100} max={100000}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">メッセージ（任意）</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="お世話になっています！"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 resize-none" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-black shadow-sm hover:shadow-md transition-all disabled:opacity-50">
                {loading ? (
                    <><Loader2 size={16} className="animate-spin mr-1" />処理中...</>
                ) : (
                    <><Gift size={16} />発行する（{Number(points).toLocaleString()}pt）</>
                )}
            </button>
        </form>
    );
}

function RedeemForm({ token, onRedeemed }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/gift-cards/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast.success(`${data.points.toLocaleString()}ptを受け取りました！`);
            onRedeemed();
            setCode('');
        } catch (err) {
            toast.error(err.message || '利用に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2"><Tag size={16} className="text-emerald-500" /> ギフトカードを使用</h2>
            <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">ギフトカードコード</label>
                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="FLST-XXXX-XXXX"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
            <button type="submit" disabled={loading || !code}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-black shadow-sm hover:shadow-md transition-all disabled:opacity-50">
                {loading ? (
                    <><Loader2 size={16} className="animate-spin mr-1" />処理中...</>
                ) : (
                    <><Gift size={16} />ポイントを受け取る</>
                )}
            </button>
        </form>
    );
}

function CodeBadge({ code }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors font-mono text-xs font-bold text-slate-700">
            {code}
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
        </button>
    );
}

export default function GiftCardsPage() {
    const { isAuthenticated, token } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCards = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/gift-cards/mine`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setCards(await res.json());
        } catch {}
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCards(); }, [token]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9FF]">
                <p className="text-slate-400 font-bold">ログインが必要です</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9FF] font-sans">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 py-10 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <Gift size={36} className="text-white mx-auto mb-2" />
                    <h1 className="text-2xl font-black text-white">FLASTALギフトカード</h1>
                    <p className="text-pink-100 text-sm mt-1">ポイントをプレゼントして推し活を盛り上げよう</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <IssueForm token={token} onIssued={(card) => setCards(prev => [card, ...prev])} />
                    <RedeemForm token={token} onRedeemed={fetchCards} />
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-black text-slate-800">発行済みカード</h2>
                        <button onClick={fetchCards} className="text-slate-400 hover:text-pink-500 transition-colors">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-400" size={24} /></div>
                    ) : cards.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-8">まだ発行したカードがありません</p>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {cards.map(card => (
                                <div key={card.id} className="py-3 flex items-center justify-between gap-3">
                                    <div>
                                        <CodeBadge code={card.code} />
                                        {card.message && <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{card.message}</p>}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-pink-500">{card.points.toLocaleString()}pt</p>
                                        <p className={`text-[10px] font-bold ${card.redeemedById ? 'text-slate-300' : 'text-emerald-500'}`}>
                                            {card.redeemedById ? '使用済み' : '未使用'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
