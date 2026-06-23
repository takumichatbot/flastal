'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function ImageModal({ src, alt, onClose }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const modalRef = useRef(null);

  // マウント時にスクロールをロックし、Escキー + フォーカストラップを設定
  useEffect(() => {
    // スクロールロック
    document.body.style.overflow = 'hidden';

    // フォーカスをモーダルに移動
    modalRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Tab キーのフォーカストラップ
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // クリーンアップ
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!src) return null;

  // 画像を新しいタブで開く（noopener,noreferrer でセキュリティ対策）
  const handleOpenOriginal = () => {
    const win = window.open(src, '_blank', 'noopener,noreferrer');
    if (win) win.opener = null;
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={alt || '画像プレビュー'}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-all duration-300 animate-fadeIn outline-none"
      onClick={onClose}
    >
      {/* ツールバー (右上) */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-50" onClick={(e) => e.stopPropagation()}>
        
        {/* 元画像を開くボタン */}
        <button 
          onClick={handleOpenOriginal}
          className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
          title="新しいタブで開く"
        >
          <ExternalLink size={20} />
        </button>

        {/* 閉じるボタン */}
        <button 
          onClick={onClose} 
          className="p-2 text-white hover:text-pink-400 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
          title="閉じる (Esc)"
        >
          <X size={24} />
        </button>
      </div>

      {/* 画像エリア */}
      <div 
        className="relative w-full h-full max-w-7xl max-h-screen p-4 flex items-center justify-center" 
        onClick={(e) => e.stopPropagation()} // 画像エリアクリックでは閉じない
      >
        {/* ローディングスピナー */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-t-pink-500 border-white/20 rounded-full animate-spin"></div>
          </div>
        )}

        {/* 画像 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={src} 
          alt={alt || "拡大画像"} 
          onLoad={() => setIsLoaded(true)}
          className={`max-w-full max-h-full object-contain shadow-2xl transition-opacity duration-300 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
      </div>
    </div>
  );
}