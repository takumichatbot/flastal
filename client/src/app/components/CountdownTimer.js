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

  const isVeryUrgent = remaining.d === 0;          // 24時間切り
  const isUrgent = remaining.d < 3 && remaining.d > 0;  // 3日未満

  const containerClass = isVeryUrgent
    ? 'border-rose-200 bg-rose-50'
    : isUrgent
    ? 'border-amber-200 bg-amber-50'
    : 'border-slate-200 bg-white/80';

  const labelClass = isVeryUrgent
    ? 'text-rose-600'
    : isUrgent
    ? 'text-amber-600'
    : 'text-slate-500';

  const valueClass = isVeryUrgent
    ? 'text-rose-700 font-black animate-pulse'
    : isUrgent
    ? 'text-amber-700 font-bold'
    : 'text-slate-700 font-bold';

  // 24時間切りは時・分・秒、それ以外は日・時・分
  const units = isVeryUrgent
    ? [
        { label: '時間', value: remaining.h },
        { label: '分',   value: remaining.m },
        { label: '秒',   value: remaining.s },
      ]
    : [
        { label: '日',   value: remaining.d },
        { label: '時間', value: remaining.h },
        { label: '分',   value: remaining.m },
      ];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {units.map(({ label, value }) => (
        <Unit
          key={label}
          value={value}
          label={label}
          containerClass={containerClass}
          labelClass={labelClass}
          valueClass={valueClass}
        />
      ))}
    </div>
  );
}

function Unit({ value, label, containerClass, labelClass, valueClass }) {
  return (
    <div className={`text-center rounded-xl px-2 py-1 border shadow-sm ${containerClass}`}>
      <p className={`text-lg leading-none tabular-nums ${valueClass}`}>
        {String(value).padStart(2, '0')}
      </p>
      <p className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${labelClass}`}>{label}</p>
    </div>
  );
}
