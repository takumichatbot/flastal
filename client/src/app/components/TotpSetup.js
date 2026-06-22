'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function TotpSetup({ enabled, onToggle }) {
    const { authenticatedFetch } = useAuth();
    const [phase, setPhase] = useState('idle'); // idle | setup | disable
    const [qrUrl, setQrUrl] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    const startSetup = async () => {
        setLoading(true);
        try {
            const r = await authenticatedFetch(`${API_URL}/api/auth/totp/setup`, { method: 'POST' });
            const d = await r.json();
            if (!r.ok) { toast.error(d.message); return; }
            setQrUrl(d.qrDataUrl);
            setPhase('setup');
        } finally { setLoading(false); }
    };

    const confirmSetup = async () => {
        setLoading(true);
        try {
            const r = await authenticatedFetch(`${API_URL}/api/auth/totp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const d = await r.json();
            if (!r.ok) { toast.error(d.message); return; }
            toast.success('2FAを有効にしました');
            setPhase('idle');
            setToken('');
            onToggle?.(true);
        } finally { setLoading(false); }
    };

    const confirmDisable = async () => {
        setLoading(true);
        try {
            const r = await authenticatedFetch(`${API_URL}/api/auth/totp/disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const d = await r.json();
            if (!r.ok) { toast.error(d.message); return; }
            toast.success('2FAを無効にしました');
            setPhase('idle');
            setToken('');
            onToggle?.(false);
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {enabled ? <ShieldCheck size={18} className="text-emerald-500" /> : <Shield size={18} className="text-slate-400" />}
                    <h3 className="text-sm font-black text-slate-800">二要素認証 (2FA)</h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {enabled ? '有効' : '無効'}
                </span>
            </div>

            {phase === 'idle' && (
                <div>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Google Authenticator などのアプリを使って、ログイン時に6桁のコードを要求します。
                    </p>
                    {!enabled ? (
                        <button onClick={startSetup} disabled={loading}
                            className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                            {loading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                            2FAを設定する
                        </button>
                    ) : (
                        <button onClick={() => setPhase('disable')}
                            className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <ShieldOff size={13} /> 2FAを無効にする
                        </button>
                    )}
                </div>
            )}

            {phase === 'setup' && (
                <div className="space-y-4">
                    <p className="text-xs text-slate-600 font-bold">Google Authenticator でQRコードをスキャン</p>
                    {qrUrl && (
                        <div className="flex justify-center">
                            <Image src={qrUrl} alt="2FA QR" width={180} height={180} className="rounded-xl border border-slate-100" />
                        </div>
                    )}
                    <input type="text" inputMode="numeric" maxLength={6} value={token} onChange={e => setToken(e.target.value)}
                        placeholder="6桁のコードを入力"
                        className="w-full text-center text-lg font-black tracking-widest bg-slate-50 border border-slate-200 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    <div className="flex gap-2">
                        <button onClick={() => { setPhase('idle'); setToken(''); }}
                            className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black">キャンセル</button>
                        <button onClick={confirmSetup} disabled={loading || token.length < 6}
                            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? <Loader2 size={13} className="animate-spin" /> : null} 確認・有効化
                        </button>
                    </div>
                </div>
            )}

            {phase === 'disable' && (
                <div className="space-y-4">
                    <p className="text-xs text-slate-600 font-bold">認証アプリの現在のコードを入力して無効化します</p>
                    <input type="text" inputMode="numeric" maxLength={6} value={token} onChange={e => setToken(e.target.value)}
                        placeholder="6桁のコードを入力"
                        className="w-full text-center text-lg font-black tracking-widest bg-slate-50 border border-slate-200 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-red-300" />
                    <div className="flex gap-2">
                        <button onClick={() => { setPhase('idle'); setToken(''); }}
                            className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black">キャンセル</button>
                        <button onClick={confirmDisable} disabled={loading || token.length < 6}
                            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? <Loader2 size={13} className="animate-spin" /> : null} 無効にする
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
