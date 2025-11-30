'use client';

import { useEffect, useRef } from 'react';
import '@google/model-viewer';

export default function ArViewer({ src, iosSrc, alt }) {
  const modelViewerRef = useRef(null);

  useEffect(() => {
    // コンポーネントマウント時にエラーログを抑制するおまじない
    const modelViewer = modelViewerRef.current;
    if (modelViewer) {
      // 必要であればイベントリスナーなどをここに追加
    }
  }, []);

  return (
    <div className="w-full h-96 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200 shadow-inner">
      {/* model-viewer タグ
        src: Android/Web用 3Dモデル (.glb)
        ios-src: iOS用 3Dモデル (.usdz) ※今回は省略可
        ar: ARモードを有効化
        ar-modes: ARの起動モード
        camera-controls: 指で回転可能に
        auto-rotate: 自動回転
      */}
      <model-viewer
        ref={modelViewerRef}
        src={src} 
        ios-src={iosSrc}
        alt={alt}
        ar
        ar-modes="scene-viewer webxr quick-look" 
        camera-controls
        auto-rotate
        shadow-intensity="1"
        style={{ width: '100%', height: '100%' }}
      >
        {/* AR起動ボタンのカスタマイズ */}
        <button slot="ar-button" className="absolute bottom-4 right-4 px-4 py-2 bg-indigo-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-transform active:scale-95 z-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h5"/><path d="M17 12h5"/><path d="M12 2v5"/><path d="M12 17v5"/><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M22 12A10 10 0 0 0 12 2"/><path d="M2 12a10 10 0 0 0 10 10"/></svg>
          ARで部屋に置く
        </button>

        {/* 読み込み中の表示 */}
        <div slot="poster" className="flex items-center justify-center w-full h-full text-gray-400">
           読み込み中...
        </div>
      </model-viewer>
    </div>
  );
}