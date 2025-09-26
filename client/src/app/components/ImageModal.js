'use client';

export default function ImageModal({ src, onClose }) {
  if (!src) return null;

  return (
    // 背景のオーバーレイ
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
      onClick={onClose} // 背景クリックで閉じる
    >
      {/* 画像コンテナ */}
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* ★★★ ここを修正 ★★★ */}
        {/* object-containを追加して、画像全体が表示されるようにする */}
        <img src={src} alt="拡大画像" className="max-w-full max-h-full object-contain rounded-lg"/>
      </div>

      {/* 閉じるボタン */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors"
      >
        &times;
      </button>
    </div>
  );
}