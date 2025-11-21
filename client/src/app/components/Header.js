'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext'; // 既存のAuthContextを使用
import { FiBell, FiChevronDown, FiUser, FiLogOut, FiHeart, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ===========================================
// ★★★ 通知ドロップダウンコンポーネント (新規) ★★★
// ===========================================
function NotificationDropdown({ user, notifications, fetchNotifications, unreadCount }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ドロップダウン外をクリックしたら閉じる
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
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, { // ※新規APIが必要
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
    
    // 既読APIを呼び出す
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

    // リンク先に遷移
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
            // ドロップダウンを開くときに最新情報を取得（リアルタイム通知未実装のため）
            if (!isOpen) fetchNotifications(); 
        }} 
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <FiBell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold text-lg text-gray-800">通知 ({unreadCount}件)</h3>
            <button 
              onClick={handleMarkAllAsRead} 
              disabled={unreadCount === 0}
              className="text-sm text-sky-500 hover:text-sky-600 disabled:text-gray-400"
            >
              全て既読にする
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => handleRead(notif.id, notif.linkUrl)}
                  className={`p-3 flex items-start space-x-3 cursor-pointer transition-colors ${notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400'}`}
                >
                  <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                  <div className="flex-1">
                    <p className={`text-sm ${notif.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500 text-center">新しい通知はありません。</p>
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
  const { user, logout } = useAuth(); // user情報とlogout関数を取得
  const [notifications, setNotifications] = useState([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // ベルアイコンの未読数
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // ★ 通知リストを取得する関数
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

  // ページロード時とログイン時に通知を一度だけ取得
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // ★ ログアウトハンドラ
  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    toast.success('ログアウトしました');
  };

  // ユーザーメニューのトグル
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };
  
  // ユーザーメニュー外のクリックを検出 (既存のロジックがあればそれを流用)
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


  return (
    <header className="sticky top-0 bg-white shadow-md z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* ロゴ/サイト名 */}
          <Link href="/" className="text-2xl font-extrabold text-pink-600 hover:text-pink-700 transition-colors">
            FLASTAL
          </Link>
          
          {/* ナビゲーション (簡易版) */}
          <nav className="hidden sm:flex space-x-4">
            <Link href="/projects" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">企画一覧</Link>
            <Link href="/florists" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">お花屋さん</Link>
            {user && <Link href="/mypage" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">マイページ</Link>}
          </nav>
          
          {/* ユーザーアクション / 認証ボタン */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* 1. 通知アイコン */}
                <NotificationDropdown 
                    user={user} 
                    notifications={notifications} 
                    fetchNotifications={fetchNotifications} 
                    unreadCount={unreadCount}
                />

                {/* 2. ユーザーメニュー */}
                <div className="relative" ref={userMenuRef}>
                  <button onClick={toggleUserMenu} className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
                    {user.iconUrl ? (
                      <img src={user.iconUrl} alt="User Icon" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <FiUser className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-sm font-medium hidden sm:block">{user.handleName}</span>
                    <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <Link href="/mypage" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b">
                        <FiUser className="inline mr-2" /> マイページ
                      </Link>
                      <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <FiLogOut className="inline mr-2" /> ログアウト
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-x-2">
                <Link href="/login" className="px-3 py-1 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  ログイン
                </Link>
                <Link href="/register" className="px-3 py-1 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors">
                  新規登録
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}