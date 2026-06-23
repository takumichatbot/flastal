'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FloristPageError({ error, reset }) {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[FloristPage] Error:', error);
        }
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9FF] px-4">
            <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <AlertTriangle size={32} className="text-amber-400" />
                </div>
                <h2 className="text-lg font-black text-slate-800 mb-2">
                    お花屋さん情報の読み込みに失敗しました
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                    一時的なエラーが発生しました。しばらく経ってから再度お試しください。
                    {error?.message && process.env.NODE_ENV === 'development' && (
                        <span className="block mt-1 text-xs text-red-400">{error.message}</span>
                    )}
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-black shadow-sm hover:shadow-md transition-all"
                    >
                        <RefreshCw size={14} />
                        再試行
                    </button>
                    <Link
                        href="/florists"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-black hover:bg-slate-50 transition-all"
                    >
                        <ArrowLeft size={14} />
                        一覧へ戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}
