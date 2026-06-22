'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[GlobalError]', error);
        }
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9FF] px-4 text-center font-sans">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mb-6 shadow-sm">
                <AlertTriangle size={36} className="text-rose-400" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">エラーが発生しました</h1>
            <p className="text-sm text-slate-400 mb-8 max-w-xs">
                予期しないエラーが発生しました。しばらく経ってから再度お試しください。
            </p>
            <div className="flex gap-3">
                <button onClick={reset}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-black shadow-sm hover:shadow-md transition-all">
                    <RefreshCw size={14} /> もう一度試す
                </button>
                <Link href="/"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-black hover:bg-slate-50 transition-all">
                    <Home size={14} /> トップへ
                </Link>
            </div>
        </div>
    );
}
