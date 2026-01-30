'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiImage } from 'react-icons/fi';

/**
 * 画像読み込みに失敗した場合、フォールバック（代替）UIを表示するコンポーネント
 * Next.jsのImageコンポーネントとほぼ同じpropsで使えます。
 */
export default function ImageWithFallback({ src, alt, fallbackText = "No Image", ...props }) {
  const [error, setError] = useState(false);

  // srcが変わったらエラー状態をリセット
  useEffect(() => {
    setError(false);
  }, [src]);

  // 画像がない、またはエラーが発生した場合の表示
  if (!src || error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-300 w-full h-full ${props.className || ''}`}
        style={{ minHeight: '100%' }} // 親要素の高さに合わせる
      >
        <FiImage size={32} className="mb-1" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{fallbackText}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || 'image'}
      onError={() => setError(true)}
      {...props}
    />
  );
}