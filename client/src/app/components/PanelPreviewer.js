"use client";
import { useState, useRef } from 'react';
import { FiUpload, FiAlertTriangle, FiCheckCircle, FiImage, FiTrash2 } from 'react-icons/fi';

export default function PanelPreviewer({ onImageSelected }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [qualityStatus, setQualityStatus] = useState(null); // 'good', 'warning', 'bad'
  const [shape, setShape] = useState('rect'); // rect, heart, circle, wood
  const fileInputRef = useRef(null);

  // 画質判定ロジック (A3サイズ印刷を想定: 約3508 x 4961 px が300dpi)
  const checkQuality = (width, height) => {
    const longSide = Math.max(width, height);
    if (longSide >= 2500) return 'good';     // A4〜A3レベルで綺麗
    if (longSide >= 1200) return 'warning';  // L判〜A5レベル。A3だと少し粗いかも
    return 'bad';                            // 印刷には不向き
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 画像読み込みと画質チェック
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      const status = checkQuality(img.width, img.height);
      setQualityStatus(status);
      setPreviewUrl(objectUrl);
      if (onImageSelected) onImageSelected(file); // 親コンポーネントへ渡す
    };
    img.src = objectUrl;
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setQualityStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 形状ごとのマスクスタイル (CSS clip-path)
  const getClipPath = () => {
    switch(shape) {
      case 'heart': return 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")';
      case 'circle': return 'circle(50% at 50% 50%)';
      case 'wood': return 'polygon(10% 0, 90% 0, 90% 10%, 100% 10%, 100% 90%, 90% 90%, 90% 100%, 10% 100%, 10% 90%, 0 90%, 0 10%, 10% 10%)'; // 簡易的な木札風
      default: return 'none'; // rect
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center">
        <FiImage className="mr-2 text-pink-500"/> パネル・シミュレーター
      </h3>

      {!previewUrl ? (
        <div 
          onClick={() => fileInputRef.current.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group"
        >
          <FiUpload className="text-4xl text-gray-300 group-hover:text-pink-400 mb-2 transition-colors"/>
          <p className="text-gray-500 font-bold">画像をアップロード</p>
          <p className="text-xs text-gray-400 mt-1">印刷画質の自動チェックを行います</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* プレビューエリア */}
          <div className="flex-1 bg-gray-100 rounded-xl p-4 flex items-center justify-center relative min-h-[300px]">
            {/* 背景のグリッド（透過確認用） */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]"></div>
            
            <div 
              className="relative w-full max-w-[250px] aspect-[1/1.4] transition-all duration-500 shadow-xl bg-white overflow-hidden"
              style={{ 
                clipPath: shape === 'heart' ? 'none' : getClipPath(), // SVG pathのclip-pathはscale調整が難しいため、簡易実装では heartは別途対応するか、mask-imageを使うのがベター。今回は簡易的に四角以外でCSS適用
                borderRadius: shape === 'circle' ? '50%' : shape === 'rect' ? '4px' : '0'
              }}
            >
               {/* ハート型の場合はSVGマスクを使うなどの工夫が必要だが、ここでは簡易的にCSSで対応 */}
               <img src={previewUrl} className="w-full h-full object-cover" />
               
               {/* 木札の場合の枠線 */}
               {shape === 'wood' && (
                 <div className="absolute inset-0 border-[8px] border-amber-700 pointer-events-none opacity-80"></div>
               )}
            </div>

            {/* 画質判定バッジ */}
            <div className="absolute top-4 right-4">
              {qualityStatus === 'good' && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1">
                  <FiCheckCircle /> 画質OK (高解像度)
                </span>
              )}
              {qualityStatus === 'warning' && (
                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1">
                  <FiAlertTriangle /> 画質注意 (A3だと粗いかも)
                </span>
              )}
              {qualityStatus === 'bad' && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1 animate-pulse">
                  <FiAlertTriangle /> 画質不足 (印刷に不向き)
                </span>
              )}
            </div>
          </div>

          {/* 操作パネル */}
          <div className="w-full md:w-48 space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block">パネルの形状</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={()=>setShape('rect')} className={`p-2 border rounded text-xs font-bold ${shape==='rect' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'hover:bg-gray-50'}`}>⬜ 長方形</button>
                <button onClick={()=>setShape('circle')} className={`p-2 border rounded text-xs font-bold ${shape==='circle' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'hover:bg-gray-50'}`}>⚪ 丸型</button>
                <button onClick={()=>setShape('wood')} className={`p-2 border rounded text-xs font-bold ${shape==='wood' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'hover:bg-gray-50'}`}>🟫 木札風</button>
                {/* ハートはCSS実装が複雑なため今回はボタンのみ（実装上は四角になる） */}
                <button onClick={()=>setShape('rect')} className="p-2 border rounded text-xs font-bold text-gray-400 cursor-not-allowed" title="実装中">❤️ ハート</button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">判定結果</p>
              <p className="text-sm text-gray-700">
                {qualityStatus === 'good' ? 'バッチリです！綺麗に印刷できます。' : 
                 qualityStatus === 'warning' ? '少し解像度が低いです。A4サイズ程度なら大丈夫ですが、大きく印刷すると粗くなる可能性があります。' :
                 '解像度が低すぎます。元の大きな画像データを探してください。'}
              </p>
            </div>

            <button onClick={clearImage} className="w-full py-2 border border-red-200 text-red-500 rounded-lg text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2">
              <FiTrash2 /> 画像を選び直す
            </button>
          </div>
        </div>
      )}
    </div>
  );
}