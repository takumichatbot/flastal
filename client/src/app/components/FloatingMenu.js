"use client";

import { useState } from 'react';
import Link from 'next/link';
// アイコンを使用
import { FiPlus, FiSearch, FiMessageCircle, FiX, FiZap } from 'react-icons/fi';

export default function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // メニュー項目の定義
  const menuItems = [
    { label: '企画を立てる', icon: <FiPlus />, href: '/projects/create', color: 'bg-pink-500' },
    { label: '企画を探す', icon: <FiSearch />, href: '/projects', color: 'bg-indigo-500' },
    { label: '花屋に相談', icon: <FiMessageCircle />, href: '/florists', color: 'bg-green-500' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      
      {/* 展開されるメニュー (下からふわっと出る) */}
      <div className={`flex flex-col gap-3 transition-all duration-300 origin-bottom ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-0 pointer-events-none'}`}>
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between gap-3 px-5 py-3 rounded-full text-white shadow-lg hover:scale-105 transition-transform ${item.color}`}
          >
            <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>
            <span className="text-xl">{item.icon}</span>
          </Link>
        ))}
      </div>

      {/* メインボタン (魔法の杖アイコン) */}
      <button
        onClick={toggleMenu}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl text-white transition-all duration-300 transform ${
          isOpen 
            ? 'bg-gray-700 rotate-45 hover:bg-gray-600' 
            : 'bg-gradient-to-r from-sky-400 to-purple-500 hover:scale-110 hover:rotate-12'
        }`}
      >
        {isOpen ? <FiX /> : <FiZap />}
      </button>
    </div>
  );
}