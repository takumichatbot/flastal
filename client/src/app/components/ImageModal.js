'use client';

import { useEffect, useState } from 'react';
import { FiX, FiDownload, FiExternalLink } from 'react-icons/fi';

export default function ImageModal({ src, alt, onClose }) {
  const [isLoaded, setIsLoaded] = useState(false);

  // マウント時にスクロールをロックし、Escキーのイベントを設定
  useEffect(() => {
    // スクロールロック
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // クリーンアップ
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!src) return null;

  // 画像を新しいタブで開く
  const handleOpenOriginal = () => {
    window.open(src, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-all duration-300 animate-fadeIn"
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
          <FiExternalLink size={20} />
        </button>

        {/* 閉じるボタン */}
        <button 
          onClick={onClose} 
          className="p-2 text-white hover:text-pink-400 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
          title="閉じる (Esc)"
        >
          <FiX size={24} />
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