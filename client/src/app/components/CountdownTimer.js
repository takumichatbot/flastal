'use client';

import { useState, useEffect } from 'react';

function calcRemaining(deadline) {
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  return { d, h, m, s };
}

export default function CountdownTimer({ deadline, className = '' }) {
  const [remaining, setRemaining] = useState(() => deadline ? calcRemaining(deadline) : null);

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setRemaining(calcRemaining(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline || !remaining) return null;

  const isUrgent = remaining.d < 3;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {remaining.d > 0 && (
        <Unit value={remaining.d} label="日" urgent={isUrgent} />
      )}
      <Unit value={remaining.h} label="時" urgent={isUrgent} />
      <Unit value={remaining.m} label="分" urgent={isUrgent} />
      {remaining.d === 0 && (
        <Unit value={remaining.s} label="秒" urgent={isUrgent} animate />
      )}
    </div>
  );
}

function Unit({ value, label, urgent, animate }) {
  return (
    <div className={`text-center rounded-xl px-2 py-1 border shadow-sm ${urgent ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'} ${animate ? 'tabular-nums' : ''}`}>
      <p className={`text-lg font-black leading-none tabular-nums ${urgent ? 'text-rose-500' : 'text-slate-700'}`}>
        {String(value).padStart(2, '0')}
      </p>
      <p className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${urgent ? 'text-rose-400' : 'text-slate-400'}`}>{label}</p>
    </div>
  );
}
