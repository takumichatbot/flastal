'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BlogPage() {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const existing = el.querySelector('script');
    if (existing) el.removeChild(existing);

    const script = document.createElement('script');
    script.src = "https://larubot.tokyo/embed/blog.js";
    script.setAttribute("data-id", "e19ed703-6238-49a5-ac83-c92c522a44cd");
    script.async = true;
    script.onload = () => setIsLoading(false);
    el.appendChild(script);

    return () => { if (el.contains(script)) el.removeChild(script); };
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDFE] font-sans text-slate-800 pb-24">

      {/* ページヘッダー（レイアウトHeaderとは別の、ページ内ナビ） */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-pink-500 transition-colors">
            <ArrowLeft size={15} /> トップへ戻る
          </Link>
          <div className="flex items-center gap-2 text-slate-500">
            <BookOpen size={16} className="text-pink-400" />
            <span className="font-black text-sm tracking-tight">お役立ち情報・コラム</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-2 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-4 sm:p-8 min-h-[70vh] relative"
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-[2rem] z-10">
              <Loader2 className="w-8 h-8 text-pink-400 animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Loading articles...</p>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full min-h-[500px]" />
        </motion.div>
      </div>
    </div>
  );
}
