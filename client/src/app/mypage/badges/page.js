'use client';
import { useState, useEffect } from 'react';
import { Award, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function BadgesPage() {
  const [badges, setBadges] = useState({ earned: [], locked: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/users/badges`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setBadges(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mypage" className="text-slate-500 hover:text-slate-700">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Award size={18} className="text-yellow-500" />
          獲得バッジ
        </h1>
      </div>

      {badges.earned?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-500 mb-3">獲得済み（{badges.earned.length}個）</h2>
          <div className="grid grid-cols-3 gap-3">
            {badges.earned.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-3 text-center shadow-sm">
                <div className="text-3xl mb-1">{b.icon || '🏅'}</div>
                <p className="text-xs font-black text-slate-800 leading-tight">{b.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{b.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {badges.locked?.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 mb-3">未獲得</h2>
          <div className="grid grid-cols-3 gap-3">
            {badges.locked.map(b => (
              <div key={b.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-3 text-center opacity-50">
                <div className="text-3xl mb-1 grayscale">{b.icon || '🔒'}</div>
                <p className="text-xs font-black text-slate-400 leading-tight">{b.name}</p>
                <p className="text-[10px] text-slate-300 mt-0.5">{b.condition}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {badges.earned?.length === 0 && badges.locked?.length === 0 && (
        <div className="py-16 text-center">
          <Award size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm">バッジ情報を読み込めませんでした</p>
        </div>
      )}
    </div>
  );
}
