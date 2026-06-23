'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

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
    // fill モード（親要素相対配置）の場合はグラデーションスケルトンを表示
    if (props.fill) {
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-pink-100/80 flex items-center justify-center">
            <svg className="w-6 h-6 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      );
    }
    // width/height 指定モード（アイコン等）の場合はシンプルな背景を表示
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-300 w-full h-full ${props.className || ''}`}
      >
        <ImageIcon size={16} />
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