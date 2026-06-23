'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center"
      >
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">ダッシュボードエラー</h2>
        <p className="text-slate-500 text-sm mb-6">ダッシュボードの読み込み中にエラーが発生しました。</p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm"
          >
            <RefreshCw size={14} /> 再試行
          </button>
          <Link href="/" className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm">
            <Home size={14} /> ホームへ
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
