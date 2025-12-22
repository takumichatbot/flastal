"use client";
import { useState, useEffect, useRef } from 'react';
import { FiCheck, FiRefreshCw } from 'react-icons/fi';
import { IoColorPaletteOutline } from 'react-icons/io5'; // もし入っていなければ FiIcon 等で代用可

// 🎨 推し色プリセット詳細定義
// H: 色相(0-360), S: 彩度(%), L: 輝度(%)
// isLight: trueの場合、文字色を黒にする（イエローやホワイト用）
const OSHI_COLORS = [
  { id: 'sky',    name: 'スカイ',   h: 204, s: '89%', l: '53%', hex: '#0ea5e9' },
  { id: 'red',    name: 'レッド',   h: 0,   s: '84%', l: '60%', hex: '#ef4444' },
  { id: 'pink',   name: 'ピンク',   h: 330, s: '81%', l: '60%', hex: '#ec4899' },
  { id: 'orange', name: 'オレンジ', h: 25,  s: '95%', l: '53%', hex: '#f97316' },
  { id: 'yellow', name: 'イエロー', h: 45,  s: '93%', l: '47%', hex: '#eab308', isLight: true },
  { id: 'green',  name: 'グリーン', h: 142, s: '71%', l: '45%', hex: '#22c55e' },
  { id: 'mint',   name: 'ミント',   h: 160, s: '84%', l: '39%', hex: '#0d9488' },
  { id: 'blue',   name: 'ブルー',   h: 221, s: '83%', l: '53%', hex: '#3b82f6' },
  { id: 'purple', name: 'パープル', h: 270, s: '95%', l: '60%', hex: '#9333ea' },
  { id: 'black',  name: 'ブラック', h: 0,   s: '0%',  l: '20%', hex: '#333333' },
  { id: 'white',  name: 'ホワイト', h: 0,   s: '0%',  l: '95%', hex: '#f3f4f6', isLight: true, border: true },
];

export default function OshiColorPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeColorId, setActiveColorId] = useState('sky');
  const dropdownRef = useRef(null);

  // 初回読み込み & クリック外判定
  useEffect(() => {
    // ローカルストレージから復元
    const savedColorId = localStorage.getItem('oshi-color-id');
    if (savedColorId) {
      const color = OSHI_COLORS.find(c => c.id === savedColorId);
      if (color) applyColor(color, false);
    }

    // クリック外で閉じる
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyColor = (color, save = true) => {
    const root = document.documentElement;
    setActiveColorId(color.id);

    // 1. CSS変数を更新 (Tailwindのglobals.cssでこれらを使っている前提)
    // --primary: H S L; という形式で更新
    root.style.setProperty('--primary', `${color.h} ${color.s} ${color.l}`);
    
    // 2. 文字色のコントラスト制御
    // 背景が明るい色(isLight)なら文字色は黒、それ以外は白
    if (color.isLight) {
        root.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%'); // 黒っぽい色
    } else {
        root.style.setProperty('--primary-foreground', '210 40% 98%'); // 白っぽい色
    }

    // 3. 個別変数も更新（必要に応じて）
    root.style.setProperty('--primary-h', color.h);

    if (save) {
      localStorage.setItem('oshi-color-id', color.id);
    }
  };

  const handleReset = () => {
    const defaultColor = OSHI_COLORS[0];
    applyColor(defaultColor);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* トリガーボタン */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${isOpen ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}
        title="推し色テーマ変更"
      >
        <div className="relative">
            <IoColorPaletteOutline className="text-lg text-slate-500 group-hover:text-slate-700 transition-colors" />
            <span 
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white" 
                style={{ backgroundColor: OSHI_COLORS.find(c => c.id === activeColorId)?.hex || '#0ea5e9' }}
            ></span>
        </div>
        <span className="text-xs font-bold text-slate-600 hidden sm:block">Theme</span>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100 p-5 z-50 animate-fadeIn origin-top-right">
          
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Oshi Color</h4>
            <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 transition-colors" title="リセット">
                <FiRefreshCw size={12} />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {OSHI_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => applyColor(c)}
                className={`
                    relative w-full aspect-square rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110
                    ${c.border ? 'border border-slate-200' : ''}
                    ${activeColorId === c.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}
                `}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {activeColorId === c.id && (
                  <FiCheck className={`text-lg drop-shadow-sm ${c.isLight ? 'text-slate-800' : 'text-white'}`} />
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">
                アプリ全体のテーマカラーが<br/>
                <span className="font-bold text-slate-600">{OSHI_COLORS.find(c => c.id === activeColorId)?.name}</span> になります
            </p>
          </div>
        </div>
      )}
    </div>
  );
}