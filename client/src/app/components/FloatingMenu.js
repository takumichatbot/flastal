"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
// アイコン
import { FiPlus, FiSearch, FiMessageCircle, FiX, FiZap } from 'react-icons/fi';
import PushNotificationManager from './PushNotificationManager';

export default function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ハイドレーションエラー防止
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const menuItems = [
    { label: '企画を立てる', icon: <FiPlus className="text-lg" />, href: '/projects/create', color: 'bg-gradient-to-r from-pink-500 to-rose-500' },
    { label: '企画を探す', icon: <FiSearch className="text-lg" />, href: '/projects', color: 'bg-gradient-to-r from-indigo-500 to-blue-500' },
    { label: '花屋に相談', icon: <FiMessageCircle className="text-lg" />, href: '/florists', color: 'bg-gradient-to-r from-emerald-500 to-green-500' },
  ];

  if (!mounted) return null;

  return (
    <>
      {/* バックドロップ (メニューが開いている時だけ表示)
        画面全体を覆い、クリックするとメニューを閉じる
      */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={closeMenu}
      />

      {/* メニュー本体 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-4 pointer-events-none">
        
        {/* メインボタン (常時表示・操作可能) */}
        <button
          onClick={toggleMenu}
          className={`pointer-events-auto w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-3xl text-white transition-all duration-300 transform active:scale-95 ${
            isOpen 
              ? 'bg-slate-800 rotate-90 hover:bg-slate-700' 
              : 'bg-gradient-to-r from-sky-400 to-purple-500 hover:scale-110 hover:rotate-12 hover:shadow-2xl'
          }`}
          aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
        >
          {isOpen ? <FiX /> : <FiZap />}
        </button>

        {/* 展開されるメニュー項目
          横並び(flex-row)で右から左へ出てくるアニメーション 
        */}
        <div 
          className={`absolute bottom-0 right-20 flex flex-row-reverse items-center gap-3 transition-all duration-300 origin-right pointer-events-auto ${
            isOpen 
              ? 'opacity-100 translate-x-0 scale-100' 
              : 'opacity-0 translate-x-8 scale-90 pointer-events-none'
          }`}
        >
          {/* メニュー項目 */}
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              onClick={closeMenu}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all ${item.color}`}
            >
              {item.icon}
              <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>
            </Link>
          ))}

          {/* プッシュ通知マネージャー (左端に配置) */}
          <div className="flex-shrink-0">
             <PushNotificationManager />
          </div>

        </div>
      </div>
    </>
  );
}