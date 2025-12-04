'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
// アイコンを追加
import { FiBell, FiChevronDown, FiUser, FiLogOut, FiHeart, FiCheckCircle, FiMenu, FiX, FiCalendar, FiMapPin, FiLogIn, FiUserPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import OshiColorPicker from './OshiColorPicker'; // 推し色ピッカー

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ... (NotificationDropdown コンポーネントは変更なし。そのまま維持してください) ...
function NotificationDropdown({ user, notifications, fetchNotifications, unreadCount }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    const handleMarkAllAsRead = async () => {
      if (unreadCount === 0) return;
  
      try {
        const token = localStorage.getItem('token'); 
        const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (response.ok) {
          toast.success('全ての通知を既読にしました');
          fetchNotifications();
        } else {
          throw new Error('既読処理に失敗しました。');
        }
      } catch (error) {
        toast.error(error.message);
      }
    };
  
    const handleRead = async (notificationId, linkUrl) => {
      setIsOpen(false);
      
      try {
        const token = localStorage.getItem('token'); 
        await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        fetchNotifications();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
  
      if (linkUrl) {
        window.location.href = linkUrl;
      }
    };
  
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'NEW_PLEDGE':
          return <FiHeart className="text-pink-500 w-5 h-5" />;
        case 'NEW_ANNOUNCEMENT':
          return <FiBell className="text-indigo-500 w-5 h-5" />;
        case 'TASK_ASSIGNED':
          return <FiCheckCircle className="text-sky-500 w-5 h-5" />;
        case 'QUOTATION_APPROVED':
        case 'PROJECT_STATUS_UPDATE':
          return <FiCheckCircle className="text-green-500 w-5 h-5" />;
        default:
          return <FiBell className="text-gray-400 w-5 h-5" />;
      }
    };
  
    return (
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => { 
              setIsOpen(!isOpen); 
              if (!isOpen) fetchNotifications(); 
          }} 
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FiBell className="w-6 h-6 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
  
        {isOpen && (
          <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-800">通知 ({unreadCount}件)</h3>
              <button 
                onClick={handleMarkAllAsRead} 
                disabled={unreadCount === 0}
                className="text-xs font-bold text-sky-500 hover:text-sky-600 disabled:text-gray-400 transition-colors"
              >
                すべて既読
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleRead(notif.id, notif.linkUrl)}
                    className={`p-4 flex items-start space-x-3 cursor-pointer transition-colors ${notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50 border-l-4 border-blue-400'}`}
                  >
                    <div className="mt-0.5 bg-white p-1.5 rounded-full shadow-sm border border-gray-100">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-bold'} line-clamp-2`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                    <p className="text-gray-400 text-sm">新しい通知はありません 🎉</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
}

// ===========================================
// ★★★ メインの Header コンポーネント ★★★
// ===========================================
export default function Header() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // モバイルメニュー用

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token'); 
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    // 1. ユーザー情報があるか
    // 2. トークンがlocalStorageにあるか
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (user && token) {
      fetchNotifications();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    toast.success('ログアウトしました');
  };

  const userMenuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ナビゲーションリンクの定義
  const navLinks = [
    { href: '/projects', label: '企画一覧', icon: <FiHeart /> },
    { href: '/events', label: 'イベント', icon: <FiCalendar /> },
    { href: '/venues', label: '会場', icon: <FiMapPin /> },
    { href: '/florists', label: 'お花屋さん', icon: <FiUser /> },
  ];

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* 1. ロゴエリア */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              {/* ロゴアイコン */}
              <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                F
              </div>
              {/* ★ 文字サイズを大きく text-3xl に変更 */}
              <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 oshi-theme-text group-hover:opacity-80 transition-opacity">
                FLASTAL
              </span>
            </Link>

            {/* 2. デスクトップナビゲーション */}
            <nav className="hidden lg:flex space-x-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  // ★ 文字サイズを text-base に変更
                  className="px-4 py-2 rounded-full text-base font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* 3. ユーザーアクションエリア */}
          <div className="flex items-center space-x-3 md:space-x-4">
            
            {/* 推し色ピッカー */}
            <div className="hidden md:block">
                <OshiColorPicker />
            </div>

            {user ? (
              <>
                {/* 通知 */}
                <NotificationDropdown 
                    user={user} 
                    notifications={notifications} 
                    fetchNotifications={fetchNotifications} 
                    unreadCount={unreadCount}
                />

                {/* ユーザーメニュー */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                    className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-gray-200 hover:shadow-md transition-all bg-white"
                  >
                    {user.iconUrl ? (
                      <img src={user.iconUrl} alt="User" className="h-9 w-9 rounded-full object-cover bg-gray-100" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-500">
                        <FiUser className="w-5 h-5" />
                      </div>
                    )}
                    {/* ★ 名前も少し大きく text-base */}
                    <span className="text-base font-bold hidden sm:block text-gray-700">{user.handleName}</span>
                    <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn origin-top-right">
                      <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-xs text-gray-500 font-bold mb-1">ログイン中</p>
                        <p className="text-base font-bold text-gray-800 truncate">{user.handleName}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link href="/mypage" onClick={() => setIsUserMenuOpen(false)} className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                          <FiUser className="mr-3 text-gray-400 text-lg" /> マイページ
                        </Link>
                        {user.role === 'ADMIN' && (
                            <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                            <FiCheckCircle className="mr-3 text-gray-400 text-lg" /> 管理画面
                            </Link>
                        )}
                        <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <FiLogOut className="mr-3 text-lg" /> ログアウト
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {/* ログインボタン: 文字サイズアップ */}
                <Link href="/login" className="hidden md:flex items-center gap-2 px-5 py-2.5 text-base font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                  <FiLogIn /> ログイン
                </Link>
                
                {/* 新規登録ボタン: 文字サイズアップ */}
                <Link href="/register" className="flex items-center gap-2 px-6 py-2.5 text-base font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <FiHeart className="animate-pulse" /> ファン登録
                </Link>
              </div>
            )}

            {/* モバイルメニューボタン */}
            <button 
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* モバイルメニュー展開 */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 absolute top-16 md:top-20 left-0 w-full shadow-lg animate-slideDown h-screen">
            <nav className="p-6 space-y-4">
                {navLinks.map((link) => (
                    <Link 
                        key={link.href} 
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 px-4 py-4 text-gray-800 font-bold hover:bg-gray-50 rounded-2xl text-lg"
                    >
                        <span className="text-2xl text-gray-400">{link.icon}</span>
                        {link.label}
                    </Link>
                ))}
                {!user && (
                    <Link 
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 px-4 py-4 text-gray-800 font-bold hover:bg-gray-50 rounded-2xl text-lg"
                    >
                        <span className="text-2xl text-gray-400"><FiLogIn /></span>
                        ログイン
                    </Link>
                )}
                <div className="pt-4 mt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-400 font-bold mb-3 px-4">テーマ設定</p>
                    <div className="px-4">
                        <OshiColorPicker />
                    </div>
                </div>
            </nav>
        </div>
      )}
    </header>
  );
}