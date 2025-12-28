'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
// アイコン (Lucide React)
import { 
  Bell, ChevronDown, User, LogOut, Heart, CheckCircle2, Menu, X, 
  Calendar, MapPin, LayoutDashboard, Settings, Sparkles, Store, ShieldCheck, Briefcase, FileText,
  UserCheck, ClipboardList, BarChart3, Building2, Package
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

// --- Notification Dropdown ---
function NotificationDropdown({ notifications, fetchNotifications, unreadCount }) {
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
        toast.error('既読処理に失敗しました');
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
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }} 
          className="relative p-2.5 rounded-full hover:bg-pink-50 text-slate-600 hover:text-pink-500 transition-colors"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
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
              className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-purple-100/50 z-50 overflow-hidden ring-1 ring-slate-100"
            >
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100/50 bg-slate-50/50">
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
              
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleRead(notif.id, notif.linkUrl)}
                      className={`px-5 py-4 flex gap-4 cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-sky-50/40' : ''}`}
                    >
                      <div className="mt-1 bg-white p-2 rounded-full shadow-sm border border-slate-100 shrink-0 h-fit">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!notif.isRead ? 'text-slate-800 font-bold' : 'text-slate-500'} line-clamp-2`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                          {new Date(notif.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0 shadow-sm shadow-sky-200" />}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
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
// Main Header Component
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
      const interval = setInterval(fetchNotifications, 60000); 
      return () => clearInterval(interval); 
    }
  }, [user, fetchNotifications]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
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

  /**
   * Roleに基づいたメインナビゲーション
   */
  const navLinks = useMemo(() => {
    const baseLinks = [
      { href: '/projects', label: '企画一覧', icon: <Heart size={18}/> },
      { href: '/events', label: 'イベント', icon: <Calendar size={18}/> },
      { href: '/venues', label: '会場', icon: <MapPin size={18}/> },
      { href: '/florists', label: 'お花屋さん', icon: <Store size={18}/> },
    ];

    if (!user) return baseLinks;

    switch (user.role) {
      case 'FLORIST':
        return [
          { href: '/florists/dashboard', label: '受注管理', icon: <ClipboardList size={18}/> },
          { href: '/florists/offers', label: '届いたオファー', icon: <FileText size={18}/> },
          { href: '/venues', label: '配送先会場', icon: <MapPin size={18}/> },
        ];
      case 'VENUE':
        return [
          { href: `/dashboard/${user.id}`, label: '予約状況', icon: <Calendar size={18}/> },
          { href: `/venues/${user.id}/logistics`, label: '搬入設定', icon: <Truck size={18}/> },
          { href: '/projects', label: '実施企画一覧', icon: <Heart size={18}/> },
        ];
      case 'ORGANIZER':
        return [
          { href: '/organizers/dashboard', label: '主催企画', icon: <LayoutDashboard size={18}/> },
          { href: '/projects/create', label: '企画を立てる', icon: <Sparkles size={18}/> },
          { href: '/florists', label: '花屋を探す', icon: <Store size={18}/> },
        ];
      case 'ADMIN':
        return [
          { href: '/admin', label: 'ダッシュボード', icon: <BarChart3 size={18}/> },
          { href: '/admin/project-approval', label: '企画審査', icon: <UserCheck size={18}/> },
          { href: '/admin/settings', label: 'システム設定', icon: <Settings size={18}/> },
        ];
      default:
        return baseLinks;
    }
  }, [user]);

  /**
   * Roleに基づいたメインリンク（Signed in as の遷移先）
   */
  const getPrimaryLink = useMemo(() => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'FLORIST': return '/florists/dashboard';
      case 'VENUE': return `/dashboard/${user.id}`;
      case 'ORGANIZER': return '/organizers/dashboard';
      default: return '/mypage';
    }
  }, [user]);

  /**
   * Roleに基づいたメニュー項目（Dropdown内）
   */
  const userMenuItems = useMemo(() => {
    if (!user) return [];
    
    switch (user.role) {
      case 'ADMIN':
        return [
          { href: '/admin', label: '管理ホーム', icon: <ShieldCheck size={16} /> },
          { href: '/admin/email-templates', label: 'メール設定', icon: <FileText size={16} /> },
          { href: '/admin/settings', label: 'システム設定', icon: <Settings size={16} /> },
        ];
      case 'FLORIST':
        return [
          { href: '/florists/dashboard', label: '受注管理画面', icon: <Briefcase size={16} /> },
          { href: '/florists/profile', label: '店舗プロフィール', icon: <Store size={16} /> },
          { href: '/florists/payouts', label: '売上・出金', icon: <BarChart3 size={16} /> },
        ];
      case 'VENUE':
        return [
          { href: `/dashboard/${user.id}`, label: '会場ダッシュボード', icon: <LayoutDashboard size={16} /> },
          { href: `/venues/${user.id}/edit`, label: 'レギュレーション設定', icon: <Building2 size={16} /> },
          { href: `/venues/${user.id}/logistics`, label: '搬入・物流設定', icon: <Package size={16} /> },
        ];
      case 'ORGANIZER':
        return [
          { href: '/organizers/dashboard', label: '企画管理ホーム', icon: <LayoutDashboard size={16} /> },
          { href: '/organizers/profile', label: '主催者情報設定', icon: <User size={16} /> },
          { href: '/organizers/messages', label: '参加者メッセージ', icon: <Bell size={16} /> },
        ];
      default: // FAN / USER
        return [
          { href: '/mypage', label: 'マイページ', icon: <LayoutDashboard size={16} /> },
          { href: '/mypage/pledges', label: '支援履歴', icon: <Heart size={16} /> },
          { href: '/mypage/settings', label: 'プロフィール設定', icon: <Settings size={16} /> },
        ];
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm h-16 md:h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 md:w-9 md:h-9 overflow-hidden rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/icon-512x512.png"
                  alt="FLASTAL"
                  fill
                  className="object-cover"
                  priority 
                />
              </div>
              <span className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300">
                FLASTAL
              </span>
            </Link>

            {/* Desktop Nav (Role-based) */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="px-4 py-2 rounded-full text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-2 group"
                >
                  <span className="text-slate-400 group-hover:text-indigo-400 transition-colors">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            
            <div className="hidden md:block scale-90">
                <OshiColorPicker />
            </div>

            {user ? (
              <>
                <NotificationDropdown 
                    notifications={notifications} 
                    fetchNotifications={fetchNotifications} 
                    unreadCount={unreadCount}
                />

                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:shadow-sm transition-all group"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100">
                        {user.iconUrl ? (
                            <Image src={user.iconUrl} alt="User" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-indigo-400"><User size={16}/></div>
                        )}
                    </div>
                    <span className="text-sm font-bold hidden sm:block text-slate-700 max-w-[100px] truncate">{user.handleName}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-200/50 z-50 overflow-hidden ring-1 ring-slate-100 origin-top-right"
                        >
                        <Link href={getPrimaryLink} onClick={() => setIsUserMenuOpen(false)} className="block px-6 py-4 border-b border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Signed in as</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{user.handleName}</p>
                            <div className="mt-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-600 border border-indigo-200 inline-block uppercase">
                                    {user.role}
                                </span>
                            </div>
                        </Link>
                        <div className="p-2 space-y-1">
                            {userMenuItems.map((item) => (
                                <Link 
                                    key={item.href}
                                    href={item.href} 
                                    onClick={() => setIsUserMenuOpen(false)} 
                                    className="flex items-center px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors"
                                >
                                    <span className="mr-3 text-slate-400">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <LogOut className="mr-3" size={16} /> ログアウト
                            </button>
                        </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="hidden md:flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-full transition-all">
                  ログイン
                </Link>
                <Link href="/register">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all"
                    >
                        <Sparkles size={16} /> 登録
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

      {/* Mobile Menu Drawer (Role-based) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="lg:hidden bg-white border-b border-slate-100 absolute top-full left-0 w-full overflow-hidden shadow-xl"
            >
                <nav className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {user && (
                        <div className="bg-slate-50 p-4 rounded-xl mb-4">
                            <Link href={getPrimaryLink} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 mb-4">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-200 shadow-sm">
                                    {user.iconUrl ? (
                                        <Image src={user.iconUrl} alt="User" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={24}/></div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-slate-800">{user.handleName}</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{user.role}</p>
                                </div>
                            </Link>
                            <div className="grid grid-cols-1 gap-2">
                                {userMenuItems.map((item) => (
                                    <Link 
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 text-indigo-600 font-bold rounded-lg shadow-sm active:scale-95 transition-transform"
                                    >
                                        {item.icon} {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
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
                    </div>

                    {!user && (
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <Link 
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex justify-center items-center gap-2 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 active:bg-slate-50"
                            >
                                ログイン
                            </Link>
                            <Link 
                                href="/register"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex justify-center items-center gap-2 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 active:scale-95 transition-transform"
                            >
                                ファン登録
                            </Link>
                        </div>
                    )}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-400 px-2 mb-4 uppercase tracking-widest">Theme</p>
                        <div className="px-2">
                            <OshiColorPicker />
                        </div>
                    </div>
                    {user && (
                        <button onClick={handleLogout} className="w-full py-4 text-red-500 font-bold border border-red-100 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 mt-4">
                            <LogOut size={18} /> ログアウト
                        </button>
                    )}
                </nav>
            </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}