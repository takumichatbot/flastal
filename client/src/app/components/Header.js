'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// デザイン統一のため lucide-react を採用 (react-icons から移行)
import { 
  Bell, ChevronDown, User, LogOut, Heart, CheckCircle2, Menu, X, 
  Calendar, MapPin, LogIn, LayoutDashboard, Settings, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import OshiColorPicker from './OshiColorPicker'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken'); 
    return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

// --- ✨ Notification Dropdown (Refined) ---
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
        const token = getAuthToken(); 
        if (!token) return;
        const response = await fetch(`${API_URL}/api/notifications/readall`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          toast.success('全ての通知を既読にしました');
          fetchNotifications();
        }
      } catch (error) {
        toast.error(error.message);
      }
    };
  
    const handleRead = async (notificationId, linkUrl) => {
      setIsOpen(false);
      try {
        const token = getAuthToken(); 
        if (token) {
          await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          fetchNotifications();
        }
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
      if (linkUrl) window.location.href = linkUrl;
    };
  
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'NEW_PLEDGE': return <Heart className="text-pink-500" size={18} />;
        case 'NEW_ANNOUNCEMENT': return <Bell className="text-indigo-500" size={18} />;
        case 'TASK_ASSIGNED': return <CheckCircle2 className="text-sky-500" size={18} />;
        case 'OFFER_ACCEPTED': return <CheckCircle2 className="text-green-500" size={18} />;
        case 'OFFER_REJECTED': return <X className="text-red-500" size={18} />;
        default: return <Bell className="text-gray-400" size={18} />;
      }
    };
  
    return (
      <div className="relative" ref={dropdownRef}>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }} 
          className="relative p-2.5 rounded-full hover:bg-pink-50 text-slate-600 hover:text-pink-500 transition-colors"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>
  
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-4 w-80 bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-purple-100/50 z-50 overflow-hidden ring-1 ring-slate-100"
            >
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100/50">
                <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <Bell size={14} className="text-pink-500"/> 通知
                </h3>
                <button 
                  onClick={handleMarkAllAsRead} 
                  disabled={unreadCount === 0}
                  className="text-xs font-bold text-sky-500 hover:text-sky-600 disabled:text-slate-300 transition-colors"
                >
                  既読にする
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <motion.div 
                      key={notif.id}
                      whileHover={{ backgroundColor: "rgba(241, 245, 249, 0.5)" }}
                      onClick={() => handleRead(notif.id, notif.linkUrl)}
                      className={`px-5 py-4 flex gap-4 cursor-pointer border-b border-slate-50 last:border-0 ${!notif.isRead ? 'bg-sky-50/30' : ''}`}
                    >
                      <div className="mt-1 bg-white p-2 rounded-full shadow-sm border border-slate-100 shrink-0 h-fit">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!notif.isRead ? 'text-slate-800 font-bold' : 'text-slate-500'} line-clamp-2`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                          {new Date(notif.createdAt).toLocaleDateString('ja-JP')} {new Date(notif.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0" />}
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="text-slate-300" />
                      </div>
                      <p className="text-slate-400 text-xs">新しい通知はありません</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
}

// ===========================================
// ★★★ Main Header Component ★★★
// ===========================================
export default function Header() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const userMenuRef = useRef(null);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = getAuthToken(); 
      if (!token) return;
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]); 

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); 
      return () => clearInterval(interval); 
    }
  }, [user, fetchNotifications]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    toast.success('ログアウトしました');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { href: '/projects', label: '企画一覧', icon: <Heart size={18}/> },
    { href: '/events', label: 'イベント', icon: <Calendar size={18}/> },
    { href: '/venues', label: '会場', icon: <MapPin size={18}/> },
    { href: '/florists', label: 'お花屋さん', icon: <StoreIcon size={18}/> },
  ];

  const getDashboardLink = () => {
    if (!user) return { href: '/login', label: 'ログイン' };
    switch (user.role) {
      case 'ORGANIZER': return { href: '/organizers/dashboard', label: 'ダッシュボード' };
      case 'FLORIST': return { href: '/florists/dashboard', label: 'ダッシュボード' };
      case 'VENUE': return { href: `/venues/dashboard/${user.id}`, label: 'ダッシュボード' };
      case 'ADMIN': return { href: '/admin', label: '管理画面' };
      default: return { href: '/mypage', label: 'マイページ' };
    }
  };

  const dashboardInfo = getDashboardLink();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* 1. Logo Area */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group relative">
              <div className="relative">
                <Image
                  src="/icon-512x512.png"
                  alt="FLASTAL"
                  width={36} 
                  height={36} 
                  className="rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 object-cover"
                  priority 
                />
                <div className="absolute inset-0 bg-pink-400 rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10" />
              </div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300">
                FLASTAL
              </span>
            </Link>

            {/* 2. Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="px-4 py-2 rounded-full text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 transition-all flex items-center gap-2 group"
                >
                  <span className="text-slate-400 group-hover:text-pink-400 transition-colors">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* 3. User Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            
            <div className="hidden md:block scale-90">
                <OshiColorPicker />
            </div>

            {user ? (
              <>
                <NotificationDropdown 
                    user={user} 
                    notifications={notifications} 
                    fetchNotifications={fetchNotifications} 
                    unreadCount={unreadCount}
                />

                <div className="relative" ref={userMenuRef}>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                    className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full border border-slate-200 bg-white/50 hover:bg-white hover:shadow-md transition-all group"
                  >
                    {user.iconUrl ? (
                      <img src={user.iconUrl} alt="User" className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-500 ring-2 ring-white shadow-sm">
                        <User size={18} />
                      </div>
                    )}
                    <span className="text-sm font-bold hidden sm:block text-slate-700 max-w-[100px] truncate">{user.handleName}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-indigo-100/50 z-50 overflow-hidden ring-1 ring-slate-100 origin-top-right"
                        >
                        <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Logged in as</p>
                            <p className="text-base font-black text-slate-800 truncate">{user.handleName}</p>
                            <div className="mt-2 flex">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    user.role === 'ADMIN' ? 'bg-red-50 text-red-500 border-red-100' :
                                    user.role === 'FLORIST' ? 'bg-pink-50 text-pink-500 border-pink-100' :
                                    user.role === 'VENUE' ? 'bg-sky-50 text-sky-500 border-sky-100' :
                                    'bg-indigo-50 text-indigo-500 border-indigo-100'
                                }`}>
                                    {user.role === 'ORGANIZER' ? '主催者' : 
                                     user.role === 'FLORIST' ? 'お花屋さん' : 
                                     user.role === 'VENUE' ? '会場' : 
                                     user.role === 'ADMIN' ? 'Admin' : 'ファン'}
                                </span>
                            </div>
                        </div>
                        <div className="p-2 space-y-1">
                            <Link 
                                href={dashboardInfo.href} 
                                onClick={() => setIsUserMenuOpen(false)} 
                                className="flex items-center px-4 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-colors"
                            >
                            <LayoutDashboard className="mr-3" size={18} /> {dashboardInfo.label}
                            </Link>

                            {user.role === 'ADMIN' && dashboardInfo.href !== '/admin' && (
                                <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-colors">
                                <Settings className="mr-3" size={18} /> 管理画面
                                </Link>
                            )}

                            <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-colors">
                            <LogOut className="mr-3" size={18} /> ログアウト
                            </button>
                        </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-full transition-all">
                  ログイン
                </Link>
                <Link href="/register">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all"
                    >
                        <Sparkles size={16} /> ファン登録
                    </motion.button>
                </Link>
              </div>
            )}

            <button 
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "100vh", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 absolute top-20 left-0 w-full overflow-hidden"
            >
                <nav className="p-6 space-y-2">
                    {user && (
                        <div className="mb-6 pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                {user.iconUrl ? (
                                    <img src={user.iconUrl} alt="User" className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-md" />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><User size={24}/></div>
                                )}
                                <div>
                                    <p className="font-black text-lg text-slate-800">{user.handleName}</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase">{user.role}</p>
                                </div>
                            </div>
                            <Link 
                                href={dashboardInfo.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl"
                            >
                                <LayoutDashboard size={18} /> {dashboardInfo.label}へ
                            </Link>
                        </div>
                    )}

                    <p className="text-xs font-bold text-slate-400 px-2 mb-2 uppercase tracking-widest">Menu</p>
                    {navLinks.map((link) => (
                        <Link 
                            key={link.href} 
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 px-4 py-3 text-slate-700 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <span className="text-slate-400">{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}

                    {!user && (
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <Link 
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex justify-center items-center gap-2 py-3 border border-slate-200 rounded-xl font-bold text-slate-600"
                            >
                                ログイン
                            </Link>
                            <Link 
                                href="/register"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex justify-center items-center gap-2 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200"
                            >
                                登録
                            </Link>
                        </div>
                    )}
                    
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-400 px-2 mb-4 uppercase tracking-widest">Settings</p>
                        <div className="px-2">
                            <OshiColorPicker />
                        </div>
                    </div>
                </nav>
            </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// 簡易アイコンコンポーネント (Store icon substitute)
function StoreIcon({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
        </svg>
    )
}