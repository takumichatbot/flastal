// src/app/components/ShareButtons.js
'use client';

import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, MessageCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareButtons({ url, text, hashtags = 'FLASTAL,フラスタ' }) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // サーバーサイドレンダリング時のエラーを防ぐため、URLはマウント後に取得
  useEffect(() => {
    setCurrentUrl(url || window.location.href);
  }, [url]);

  if (!currentUrl) return null;

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(text || '');
  const encodedHashtags = encodeURIComponent(hashtags);

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}&hashtags=${encodedHashtags}`;
  const lineUrl = `https://line.me/R/msg/text/?${encodedText}%20${encodedUrl}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('リンクをコピーしました！');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('コピーに失敗しました');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* X (Twitter) */}
      <a 
        href={twitterUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-transform hover:scale-105 shadow-sm"
        aria-label="X (Twitter)でシェア"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
      </a>

      {/* LINE */}
      <a 
        href={lineUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#06C755] text-white hover:bg-[#05b34c] transition-transform hover:scale-105 shadow-sm"
        aria-label="LINEでシェア"
      >
        <MessageCircle size={20} className="fill-white" />
      </a>

      {/* Link Copy */}
      <button 
        onClick={copyToClipboard}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-transform hover:scale-105 shadow-sm"
        aria-label="リンクをコピー"
      >
        {copied ? <Check size={18} className="text-emerald-500" /> : <LinkIcon size={18} />}
      </button>
    </div>
  );
}