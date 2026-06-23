'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, TrendingUp } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function RecommendedProjects({ token }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_URL}/api/recommend`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setData(d))
      .catch(() => {});
  }, [token]);

  if (!data || data.projects.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center gap-2 mb-4">
        {data.type === 'personalized' ? (
          <>
            <Sparkles size={18} className="text-pink-500" />
            <h2 className="font-black text-slate-800">あなたへのおすすめ</h2>
          </>
        ) : (
          <>
            <TrendingUp size={18} className="text-violet-500" />
            <h2 className="font-black text-slate-800">人気の企画</h2>
          </>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.projects.map(p => {
          const pct =
            p.targetAmount > 0
              ? Math.min(Math.round((p.collectedAmount / p.targetAmount) * 100), 100)
              : 0;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square bg-slate-100">
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-black text-slate-800 line-clamp-2 mb-2">{p.title}</p>
                <div className="h-1 bg-slate-100 rounded-full mb-1">
                  <div
                    className="h-1 bg-pink-400 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{pct}%</span>
                  <span>{p._count.pledges}人</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
