"use client";
import { useState, useRef } from 'react';
import { FiUpload, FiAlertTriangle, FiImage, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

// 形状定義
const SHAPES = [
  { id: 'rect', label: '長方形 (A3/A4)', icon: '⬜' },
  { id: 'square', label: '正方形', icon: '⬛' },
  { id: 'circle', label: '円形', icon: '⚪' },
  { id: 'heart', label: 'ハート型', icon: '❤️' },
  { id: 'wood', label: '木札 (立札)', icon: '🟫' },
];

// ハート型の安全なSVGマスク（ブラウザのバグを防ぐエンコード済み）
const heartMask = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 88.9L16.7 55.6C7.2 46.1 7.2 30.9 16.7 21.4 26.2 11.9 41.4 11.9 50.9 21.4L50 22.3 49.1 21.4C58.6 11.9 73.8 11.9 83.3 21.4 92.8 30.9 92.8 46.1 83.3 55.6L50 88.9z'/%3E%3C/svg%3E\")";

export default function PanelPreviewer({ onImageSelected }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0, size: 0 });
  const [qualityStatus, setQualityStatus] = useState(null); 
  const [shape, setShape] = useState('rect'); 
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 画質判定ロジック (300dpi基準)
  const checkQuality = (width, height) => {
    const longSide = Math.max(width, height);
    const shortSide = Math.min(width, height);

    if (longSide >= 2500 && shortSide >= 1500) return { status: 'good', msg: '高画質 (A3印刷可能)' };
    if (longSide >= 1200) return { status: 'warning', msg: '中画質 (A4〜A5推奨)' };
    return { status: 'bad', msg: '低画質 (粗くなる可能性あり)' };
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
        toast.error('画像ファイルを選択してください');
        return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      const result = checkQuality(img.width, img.height);
      setQualityStatus(result);
      setImageMeta({ width: img.width, height: img.height, size: (file.size / 1024 / 1024).toFixed(2) });
      setPreviewUrl(objectUrl);
      if (onImageSelected) onImageSelected(file); 
    };
    img.src = objectUrl;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setQualityStatus(null);
    setShape('rect');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 形状によってプロポーション（縦横比）と最大幅を変える
  const isSquareLike = shape === 'square' || shape === 'circle' || shape === 'heart';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full">
      
      {/* ヘッダー */}
      <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="font-bold text-gray-800 flex items-center text-sm md:text-base">
          <FiImage className="mr-2 text-indigo-500"/> パネル・シミュレーター
        </h3>
        {previewUrl && (
            <span className={`text-[10px] md:text-xs font-bold px-3 py-1 rounded-full border ${
                qualityStatus.status === 'good' ? 'bg-green-50 text-green-700 border-green-200' :
                qualityStatus.status === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
            }`}>
                {qualityStatus.msg}
            </span>
        )}
      </div>

      <div className="p-4 md:p-6 w-full">
        {!previewUrl ? (
          /* アップロードエリア */
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={`border-2 border-dashed rounded-2xl h-48 md:h-64 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
                isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <div className={`p-3 md:p-4 rounded-full mb-3 transition-colors ${isDragging ? 'bg-indigo-200 text-indigo-600' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'}`}>
                <FiUpload className="text-2xl md:text-3xl"/>
            </div>
            <p className="text-gray-600 font-bold text-sm md:text-lg">画像をドロップ または 選択</p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-2 text-center px-4">対応形式: JPG, PNG (推奨: 長辺2500px以上)</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
            
            {/* プレビュー表示エリア */}
            <div className="flex-1 bg-slate-100 rounded-2xl p-4 md:p-8 flex items-center justify-center relative min-h-[300px] md:min-h-[400px] shadow-inner overflow-hidden">
                {/* ぼかし背景 */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110"
                    style={{ backgroundImage: `url(${previewUrl})` }}
                ></div>
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>

                {/* --- パネル本体 --- */}
                {/* ★修正: スマホサイズで枠からはみ出さないよう aspectRatio と maxWidth を使用し、overflow-hidden で画像を切り抜く */}
                <div 
                    className={`relative shadow-2xl transition-all duration-500 z-10 overflow-hidden ${
                        shape === 'wood' ? 'bg-[#eecfa1]' : 'bg-white'
                    }`}
                    style={{
                        width: '100%',
                        maxWidth: isSquareLike ? '300px' : '280px',
                        aspectRatio: isSquareLike ? '1 / 1' : '1 / 1.4',
                        borderRadius: shape === 'circle' ? '50%' : shape === 'rect' ? '8px' : '0',
                        maskImage: shape === 'heart' ? heartMask : 'none',
                        WebkitMaskImage: shape === 'heart' ? heartMask : 'none',
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                    }}
                >
                    {/* 画像本体 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={previewUrl} 
                        className={`w-full h-full object-cover transition-all duration-500 ${shape === 'wood' ? 'mix-blend-multiply opacity-90 p-4 md:p-6' : ''}`} 
                        alt="Preview"
                    />

                    {/* 木札モードの場合のテクスチャオーバーレイ (画像の上に配置) */}
                    {shape === 'wood' && (
                         <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none z-20"
                              style={{ backgroundImage: `repeating-linear-gradient(90deg, #d2b48c 0px, #deb887 2px, #d2b48c 4px)` }}
                         >
                            <div className="absolute inset-0 border-[4px] md:border-[6px] border-[#8b4513] opacity-80"></div>
                            {/* 木札の文字入力エリア（簡易） */}
                            <div className="absolute top-3 md:top-4 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-0.5 text-[10px] font-serif border border-black shadow-sm">
                                御祝
                            </div>
                         </div>
                    )}
                </div>
            </div>

            {/* コントロールパネル */}
            <div className="w-full lg:w-72 flex flex-col space-y-5 md:space-y-6 shrink-0">
                
                {/* 形状選択 */}
                <div>
                    <label className="text-[10px] md:text-xs font-black text-gray-400 mb-2.5 block uppercase tracking-widest">Shape Selection</label>
                    <div className="grid grid-cols-2 gap-2">
                        {SHAPES.map((s) => (
                            <button 
                                key={s.id}
                                onClick={() => setShape(s.id)}
                                className={`flex items-center gap-1.5 md:gap-2 p-2 rounded-xl text-xs font-bold border transition-all ${
                                    shape === s.id 
                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm ring-2 ring-indigo-50' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                <span className="text-base md:text-lg shrink-0">{s.icon}</span>
                                <span className="truncate">{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 画像情報 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">File Info</p>
                    <div className="space-y-1.5 text-xs text-gray-600 font-mono font-medium">
                        <div className="flex justify-between items-center">
                            <span>Resolution:</span>
                            <span className="font-bold text-gray-800">{imageMeta.width} x {imageMeta.height} px</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>File Size:</span>
                            <span className="font-bold text-gray-800">{imageMeta.size} MB</span>
                        </div>
                    </div>
                    
                    {/* アラート */}
                    {qualityStatus.status !== 'good' && (
                        <div className="mt-4 text-[10px] md:text-xs leading-relaxed bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200 flex items-start gap-2 shadow-sm">
                            <FiAlertTriangle className="shrink-0 mt-0.5 text-yellow-600" size={14}/>
                            <span>解像度が低いため、印刷時にぼやける可能性があります。より大きな画像の使用を推奨します。</span>
                        </div>
                    )}
                </div>

                <button 
                    onClick={clearImage} 
                    className="w-full py-3.5 border border-red-200 text-red-500 bg-white rounded-xl text-xs md:text-sm font-black hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    <FiTrash2 size={16}/> 別の画像を選び直す
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}