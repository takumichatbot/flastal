'use client';

import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

/**
 * PointsCard — ポイント残高カード
 *
 * PC ヘッダーと設定タブの両方で再利用できる自己完結コンポーネント。
 *
 * @param {number}  points      - 現在のポイント残高
 * @param {string}  [className] - 追加クラス（省略可）
 */
export function PointsCard({ points = 0, className = '' }) {
  const isNativeApp = Capacitor.isNativePlatform();
  return (
    <div
      className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-5 shadow-lg relative overflow-hidden ${className}`}
    >
      {/* 装飾円 */}
      <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Zap size={12} className="text-amber-400 fill-amber-400" />
            ポイント残高
          </p>
          <p className="text-white text-3xl font-black font-mono tracking-tight">
            {points.toLocaleString()}
            <span className="text-sm text-slate-400 font-sans ml-1.5">pt</span>
          </p>
        </div>

        {!isNativeApp && (
          <Link
            href="/points"
            className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black text-sm px-5 py-3 rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            チャージ <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}
