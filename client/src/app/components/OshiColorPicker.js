"use client";
import { useState, useEffect } from 'react';
import { FiSettings, FiCheck } from 'react-icons/fi';

// 推し色プリセット (色相Hueの値)
const OSHI_COLORS = [
  { name: 'スカイ', hue: 204, hex: '#0ea5e9' }, // デフォルト
  { name: 'レッド', hue: 0,   hex: '#ef4444' },
  { name: 'ピンク', hue: 330, hex: '#ec4899' },
  { name: 'オレンジ', hue: 25,  hex: '#f97316' },
  { name: 'イエロー', hue: 45,  hex: '#eab308' },
  { name: 'グリーン', hue: 142, hex: '#22c55e' },
  { name: 'ミント', hue: 160, hex: '#14b8a6' },
  { name: 'ブルー', hue: 217, hex: '#3b82f6' },
  { name: 'パープル', hue: 270, hex: '#a855f7' },
  { name: 'ブラック', hue: 0,   s: '0%', l: '20%', hex: '#333333' }, // 黒は彩度0
];

export default function OshiColorPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentHue, setCurrentHue] = useState(204);

  // 初回読み込み時にlocalStorageから設定を復元
  useEffect(() => {
    const savedHue = localStorage.getItem('oshi-hue');
    if (savedHue) {
      changeColor(parseInt(savedHue), false);
    }
  }, []);

  const changeColor = (hue, save = true) => {
    const root = document.documentElement;
    setCurrentHue(hue);

    // 特別対応: 黒の場合
    if (hue === 0 && save === true && OSHI_COLORS.find(c=>c.hue===0 && c.s==='0%')) {
       // (黒の実装は少し複雑になるので、今回は色相変更のみの基本実装にします)
    }

    // CSS変数を書き換え
    root.style.setProperty('--primary-h', hue);
    
    if (save) {
      localStorage.setItem('oshi-hue', hue);
      // setIsOpen(false); // 閉じるかどうかは好みで
    }
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-100 px-3 py-1.5 rounded-full transition-colors"
      >
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${currentHue}, 89%, 53%)` }}></span>
        推し色
      </button>

      {isOpen && (
        <>
          {/* 閉じるための背景クリックエリア */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-fadeIn">
            <p className="text-xs font-bold text-gray-500 mb-3 text-center">テーマカラーを変更</p>
            <div className="grid grid-cols-5 gap-2">
              {OSHI_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => changeColor(c.hue)}
                  className="w-full aspect-square rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {currentHue === c.hue && (
                    <FiCheck className="text-white text-lg drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t text-center">
                <button onClick={() => changeColor(204)} className="text-xs text-gray-400 hover:text-sky-500 underline">
                    リセット
                </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}