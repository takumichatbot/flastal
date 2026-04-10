'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BlogPage() {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 埋め込みスクリプトを読み込む処理
    const container = containerRef.current;
    if (!container) return;

    // 既存のスクリプトがあればクリア
    const existingScript = container.querySelector('script');
    if (existingScript) {
      container.removeChild(existingScript);
    }

    const script = document.createElement('script');
    script.src = "https://larubot.tokyo/embed/blog.js";
    // ご提示いただいたウィジェットと同じIDを使用
    script.setAttribute("data-id", "e19ed703-6238-49a5-ac83-c92c522a44cd");
    script.async = true;

    // 読み込み完了後にローディングを消す
    script.onload = () => {
      setIsLoading(false);
    };

    container.appendChild(script);

    // クリーンアップ
    return () => {
      if (container && container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBFD] font-sans text-slate-800 pb-24">
      {/* ヘッダー部分 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">トップページへ戻る</span>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-500" />
            <h1 className="font-black text-slate-800 tracking-tight">お役立ち情報・コラム</h1>
          </div>
          <div className="w-20" /> {/* 中央揃えのためのスペーサー */}
        </div>
      </div>

      {/* 記事一覧/詳細 コンテンツエリア */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 md:pt-16">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-4 sm:p-8 min-h-[70vh] relative"
        >
          {/* ローディング表示 */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-[2rem] z-10">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">Loading articles...</p>
            </div>
          )}

          {/* LARUbot ブログ埋め込みコンテナ */}
          <div ref={containerRef} className="w-full h-full min-h-[500px]" />
        </motion.div>
      </div>
    </div>
  );
}