'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, TrendingUp, TrendingDown } from 'lucide-react';

const TYPE_LABELS = {
  PLEDGE_USED: { label: '支援で使用', color: 'text-red-500', sign: '-', icon: TrendingDown },
  PLEDGE_REFUND: { label: '支援返金', color: 'text-green-500', sign: '+', icon: TrendingUp },
  REFERRAL_BONUS: { label: '招待ボーナス', color: 'text-green-500', sign: '+', icon: TrendingUp },
  ADMIN_GRANT: { label: '管理者付与', color: 'text-blue-500', sign: '+', icon: TrendingUp },
  POINT_CHARGE: { label: 'ポイントチャージ', color: 'text-amber-500', sign: '+', icon: TrendingUp },
  BADGE_REWARD: { label: 'バッジ獲得', color: 'text-amber-500', sign: '+', icon: TrendingUp },
};

export default function PointHistoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

  const loadHistory = () => {
    setLoading(true);
    setError(false);
    const token =
      (typeof window !== 'undefined' && window.__flastalToken) ||
      (typeof window !== 'undefined' && localStorage.getItem('accessToken')) ||
      '';

    fetch(`${API}/api/users/point-history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9FF]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9FF] px-4 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
          <Zap size={28} className="text-rose-300" />
        </div>
        <p className="text-sm font-black text-slate-600 mb-1">ポイント情報を読み込めませんでした</p>
        <p className="text-xs text-slate-400 mb-5">通信環境をご確認のうえ、再度お試しください</p>
        <button
          onClick={loadHistory}
          className="px-5 py-2.5 bg-pink-500 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-transform"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9FF] pb-20">
      <div className="max-w-lg mx-auto px-4 pt-10">
        <Link
          href="/mypage"
          className="inline-flex items-center gap-2 text-slate-500 text-sm mb-6 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} />
          マイページへ戻る
        </Link>

        {/* 現在のポイント残高 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white mb-6 relative overflow-hidden shadow-lg">
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-2">
            <Zap size={12} className="text-amber-400 fill-amber-400" />
            現在のポイント残高
          </div>
          <div className="text-4xl font-black font-mono tracking-tight">
            {(data?.currentBalance ?? 0).toLocaleString()}
            <span className="text-base text-slate-400 font-sans ml-2">pt</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link
              href="/points"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md active:scale-95 transition-transform"
            >
              <Zap size={12} />
              ポイントをチャージする
            </Link>
          </div>
        </div>

        {/* 取引履歴 */}
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          取引履歴 {data?.total ? `（全${data.total}件）` : ''}
        </h2>

        {!data?.transactions?.length ? (
          <div className="text-center py-16 bg-white/60 rounded-[2rem] border border-white">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={28} className="text-amber-300" />
            </div>
            <p className="text-sm font-black text-slate-600 mb-1">取引履歴がありません</p>
            <p className="text-xs text-slate-400">ポイントをチャージして企画を支援しよう</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.transactions.map(tx => {
              const info = TYPE_LABELS[tx.type] || {
                label: tx.type || '取引',
                color: (tx.amount ?? 0) >= 0 ? 'text-green-500' : 'text-red-500',
                sign: (tx.amount ?? 0) >= 0 ? '+' : '',
                icon: (tx.amount ?? 0) >= 0 ? TrendingUp : TrendingDown,
              };
              const Icon = info.icon;
              const displayAmount = tx.amount ?? tx.points ?? 0;
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-slate-100"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    info.sign === '+' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <Icon size={16} className={info.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-slate-700">{info.label}</div>
                    {tx.note && (
                      <div className="text-xs text-slate-400 mt-0.5 truncate">{tx.note}</div>
                    )}
                    <div className="text-[10px] text-slate-300 mt-0.5 font-bold">
                      {new Date(tx.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className={`text-base font-black shrink-0 ${info.color}`}>
                    {info.sign}{Math.abs(displayAmount).toLocaleString()} pt
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
