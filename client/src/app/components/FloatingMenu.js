"use client";

import { useState } from 'react';
import Link from 'next/link';
// アイコンを使用
import { FiPlus, FiSearch, FiMessageCircle, FiX, FiZap, FiBell } from 'react-icons/fi';
import PushNotificationManager from './PushNotificationManager'; // 💡 追記: プッシュ通知マネージャーをインポート

export default function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // メニュー項目の定義
  // 💡 注意: 通知ボタンを左隣に配置するため、メニュー項目の展開順序を考慮する必要があります。
  const menuItems = [
    { label: '企画を立てる', icon: <FiPlus />, href: '/projects/create', color: 'bg-pink-500' },
    { label: '企画を探す', icon: <FiSearch />, href: '/projects', color: 'bg-indigo-500' },
    { label: '花屋に相談', icon: <FiMessageCircle />, href: '/florists', color: 'bg-green-500' },
  ];

  return (
    // 💡 修正 1: 全体を横並び (flex items-center) にし、右下 (bottom-6 right-6) に固定
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-end gap-3">
      
      {/* 展開されるメニュー群 (左側にふわっと出るエリア) */}
      {/* 💡 修正 2: メニュー項目と通知ボタンを内包し、横並び (flex-row) で管理 */}
      <div 
        className={`flex flex-row items-center gap-3 transition-all duration-300 origin-right ${
          isOpen 
            ? 'opacity-100 translate-x-0 scale-100' 
            : 'opacity-0 translate-x-10 scale-0 pointer-events-none'
        }`}
      >
        
        {/* 💡 LARUBot の将来的なスペースを確保したい場合は、ここにコンポーネントを配置 */}
        {/* <LARUBotChatButton /> */}

        {/* 💡 修正 3: プッシュ通知ボタンを配置 */}
        {/* PushNotificationManager は、ログイン状態と購読状態に基づいて自動で非表示になります */}
        <PushNotificationManager />

        {/* 企画関連のメニュー項目 */}
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            href={item.href}
            onClick={() => setIsOpen(false)}
            // 💡 スタイルを通知ボタンと合わせるため調整 (アイコンを削除し、ボタンとしての一貫性を持たせる)
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-full text-white shadow-lg hover:scale-105 transition-transform ${item.color}`}
          >
            <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>
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