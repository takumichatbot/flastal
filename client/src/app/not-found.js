'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-200/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_8px_40px_rgba(244,114,182,0.15)] border border-white relative z-10"
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -8, 0], y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mb-6 flex justify-center select-none"
        >
          <Image src="/icon-512x512.png" alt="FLASTAL" width={80} height={80} style={{ borderRadius: '22px', boxShadow: '0 8px 24px rgba(236,72,153,0.2)' }} />
        </motion.div>

        <h1 className="text-7xl font-black text-pink-500 tracking-tighter mb-2">404</h1>
        <h2 className="text-xl font-black text-slate-800 mb-3">お花が見つかりませんでした</h2>
        <p className="text-slate-500 text-sm font-bold mb-8 leading-relaxed">
          お探しのページは削除されたか、<br />URLが間違っている可能性があります。
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg"
            >
              <Home size={18} /> トップへ戻る
            </motion.button>
          </Link>
          <Link href="/projects" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-pink-50 text-pink-600 border-2 border-pink-100 font-black rounded-2xl hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-colors"
            >
              <Search size={18} /> 企画を探す
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
