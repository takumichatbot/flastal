'use client';

import { useState, useEffect, useRef } from 'react';
import '@google/model-viewer';
import { FiBox, FiMaximize, FiRotateCw, FiAlertCircle } from 'react-icons/fi';

export default function ArViewer({ src, iosSrc, alt, poster }) {
  const modelViewerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    
    if (modelViewer) {
      // 進捗イベントのリスナー
      const onProgress = (event) => {
        const progressValue = event.detail.totalProgress * 100;
        setProgress(progressValue);
        if (progressValue >= 100) {
          setIsLoaded(true);
        }
      };

      // エラーハンドリング
      const onError = (error) => {
        console.error('AR Model Load Error:', error);
        setError('モデルの読み込みに失敗しました');
      };

      modelViewer.addEventListener('progress', onProgress);
      modelViewer.addEventListener('error', onError);

      return () => {
        modelViewer.removeEventListener('progress', onProgress);
        modelViewer.removeEventListener('error', onError);
      };
    }
  }, []);

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
        <FiAlertCircle size={32} className="mb-2 text-red-400"/>
        <p className="text-sm font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-gradient-to-b from-gray-50 to-gray-100 rounded-3xl overflow-hidden relative border border-white shadow-inner group">
      
      {/* 背景のグリッド装飾 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* model-viewer 本体 */}
      <model-viewer
        ref={modelViewerRef}
        src={src} 
        ios-src={iosSrc}
        poster={poster} // 読み込み前に表示する画像（あれば）
        alt={alt || "3Dモデル"}
        ar
        ar-modes="scene-viewer webxr quick-look" 
        ar-scale="fixed" // ★実寸大で表示する設定
        camera-controls
        auto-rotate
        shadow-intensity="1"
        shadow-softness="1"
        exposure="1" // 明るさ調整
        style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
      >
        {/* --- Slot: AR起動ボタン --- */}
        <button slot="ar-button" className="absolute bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform active:scale-95 z-50 border border-white/20 backdrop-blur-sm">
          <FiBox className="text-xl" />
          <span>ARで部屋に置く</span>
        </button>

        {/* --- Slot: ロード中の表示 --- */}
        <div slot="progress-bar" className={`absolute top-0 left-0 w-full h-1 bg-gray-200 transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}>
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* --- カスタムUI: 読み込み中オーバーレイ --- */}
        {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                <div className="w-12 h-12 border-4 border-t-indigo-500 border-indigo-100 rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-bold text-indigo-900 tracking-wider">LOADING 3D MODEL...</p>
                <p className="text-xs text-indigo-400 font-mono mt-1">{Math.round(progress)}%</p>
            </div>
        )}

        {/* --- カスタムUI: 操作ガイド (読み込み完了後) --- */}
        {isLoaded && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="bg-white/80 p-2 rounded-full shadow text-gray-600 backdrop-blur text-xs font-bold flex items-center gap-1" title="回転可能">
                    <FiRotateCw /> <span className="hidden sm:inline">Rotate</span>
                </div>
                <div className="bg-white/80 p-2 rounded-full shadow text-gray-600 backdrop-blur text-xs font-bold flex items-center gap-1" title="拡大縮小可能">
                    <FiMaximize /> <span className="hidden sm:inline">Zoom</span>
                </div>
            </div>
        )}

      </model-viewer>
    </div>
  );
}