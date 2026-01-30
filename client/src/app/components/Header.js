'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  Bell, ChevronDown, User, LogOut, Heart, CheckCircle2, Menu, X, 
  Calendar, MapPin, LayoutDashboard, Settings, Sparkles, Store, ShieldCheck, Briefcase, FileText,
  UserCheck, ClipboardList, BarChart3, Building2, Package, Truck, Search, PlusCircle, Star
} from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function NotificationDropdown({ notifications, fetchNotifications, unreadCount, authenticatedFetch }) {
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
        const response = await authenticatedFetch(`${API_URL}/api/notifications/readall`, {
          method: 'PATCH'
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
        await authenticatedFetch(`${API_URL}/api/notifications/${notificationId}/read`, {
          method: 'PATCH'
        });
        fetchNotifications();
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

export default function Header() {
  const { user, logout, isLoading, authenticatedFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const userMenuRef = useRef(null);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (isLoading || !user) return;
    try {
      const response = await authenticatedFetch(`${API_URL}/api/notifications`);
      if (response && response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user, isLoading, authenticatedFetch]); 

  useEffect(() => {
    if (!isLoading && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); 
      return () => clearInterval(interval); 
    }
  }, [user, isLoading, fetchNotifications]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    localStorage.removeItem('flastal-venue');
    localStorage.removeItem('flastal-token');
    localStorage.removeItem('authToken');
    window.location.href = '/';
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

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.venueName || user.shopName || user.handleName || user.name || "ログイン中";
  }, [user]);

  const navLinks = useMemo(() => {
    const baseLinks = [
      { href: '/projects', label: '企画一覧', icon: <Heart size={18}/> },
      { href: '/events', label: 'イベント', icon: <Calendar size={18}/> },
      { href: '/illustrators/recruitment', label: '絵師募集中', icon: <Star size={18}/>, highlight: true },
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
          { href: `/venues/dashboard/${user.id}`, label: 'ダッシュボード', icon: <LayoutDashboard size={18}/> },
          { href: `/venues/${user.id}/logistics`, label: '搬入設定', icon: <Truck size={18}/> },
          { href: '/projects', label: '実施企画', icon: <Heart size={18}/> },
        ];
      case 'ORGANIZER':
        return [
          { href: '/organizers/dashboard', label: '主催企画', icon: <LayoutDashboard size={18}/> },
          { href: '/illustrators/recruitment', label: '絵師募集中', icon: <Star size={18}/>, highlight: true },
          { href: '/projects/create', label: '企画を立てる', icon: <Sparkles size={18}/> },
          { href: '/florists', label: '花屋を探す', icon: <Store size={18}/> },
        ];
      case 'ADMIN':
        return [
          { href: '/admin', label: '管理ホーム', icon: <BarChart3 size={18}/> },
          { href: '/admin/project-approval', label: '企画審査', icon: <UserCheck size={18}/> },
          { href: '/admin/settings', label: 'システム設定', icon: <Settings size={18}/> },
        ];
      default:
        return baseLinks;
    }
  }, [user]);

  const getPrimaryLink = useMemo(() => {
    // ★修正: userオブジェクトだけでなく、user.id の存在もチェック
    if (!user || !user.id) return '/login';
  
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'FLORIST': return '/florists/dashboard';
      case 'VENUE': return `/venues/dashboard/${user.id}`;
      case 'ORGANIZER': return '/organizers/dashboard';
      default: return '/mypage';
    }
  }, [user]);

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
          { href: `/venues/dashboard/${user.id}`, label: '会場ダッシュボード', icon: <LayoutDashboard size={16} /> },
          { href: `/venues/dashboard/${user.id}/edit`, label: '基本設定・ルール', icon: <Building2 size={16} /> },
          { href: `/venues/${user.id}/logistics`, label: '搬入・物流設定', icon: <Package size={16} /> },
        ];
      case 'ORGANIZER':
        return [
          { href: '/organizers/dashboard', label: '企画管理ホーム', icon: <LayoutDashboard size={16} /> },
          { href: '/organizers/profile', label: '主催者情報設定', icon: <User size={16} /> },
          { href: '/organizers/messages', label: '参加者メッセージ', icon: <Bell size={16} /> },
        ];
      default:
        return [
          { href: '/mypage', label: '参加した企画', icon: <Heart size={16} /> },
          { href: '/mypage?tab=created', label: '主催した企画', icon: <ClipboardList size={16} /> },
          { href: '/mypage/edit', label: 'プロフィール設定', icon: <Settings size={16} /> },
        ];
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-[100] w-full bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm h-16 md:h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative w-8 h-8 md:w-9 md:h-9 overflow-hidden rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
                <Image src="/icon-512x512.png" alt="FLASTAL" fill className="object-cover" priority />
              </div>
              <span className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tighter group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300">
                FLASTAL
              </span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 group ${
                    link.highlight 
                    ? 'text-rose-500 hover:bg-rose-50' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={`${link.highlight ? 'text-rose-400' : 'text-slate-400 group-hover:text-pink-400'} transition-colors`}>
                    {link.highlight ? <Star size={18} className="fill-rose-400" /> : link.icon}
                  </span>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {user ? (
              <>
                <NotificationDropdown 
                    notifications={notifications} 
                    fetchNotifications={fetchNotifications} 
                    unreadCount={unreadCount}
                    authenticatedFetch={authenticatedFetch}
                />

                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                    className="flex items-center gap-2 pl-1 pr-1 md:pr-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:shadow-sm transition-all group"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100 shrink-0">
                        {user.iconUrl ? (
                            <Image src={user.iconUrl} alt="User Icon" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-indigo-400"><User size={16}/></div>
                        )}
                    </div>
                    <span className="text-sm font-bold hidden sm:block text-slate-700 max-w-[100px] truncate">{displayName}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform hidden md:block duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
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
                            <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                            <div className="mt-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-100 text-pink-600 border border-pink-200 inline-block uppercase tracking-wider">
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
                                    className="flex items-center px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-pink-600 rounded-xl transition-colors"
                                >
                                    <span className="mr-3 text-slate-400 group-hover:text-pink-400 transition-colors">{item.icon}</span>
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
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="lg:hidden fixed inset-0 top-0 left-0 w-full h-screen bg-white z-[200] overflow-y-auto"
            >
                <div className="p-4 flex justify-between items-center border-b border-slate-100">
                    <span className="text-xl font-black text-slate-900 tracking-tighter">FLASTAL</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-6 space-y-8">
                    {user && (
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-200 shadow-sm">
                                    {user.iconUrl ? <Image src={user.iconUrl} alt="User Avatar" fill className="object-cover" /> : <User size={24} className="m-3 text-slate-300" />}
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-slate-800">{displayName}</p>
                                    <Link href={getPrimaryLink} onClick={() => setIsMobileMenuOpen(false)} className="text-xs text-pink-500 font-bold">マイページへ</Link>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Link 
                            href="/projects/create" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center gap-2 py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-100 transition-transform active:scale-95"
                        >
                            <PlusCircle size={24} /> 企画を立てる
                        </Link>
                        <Link 
                            href="/projects" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center gap-2 py-4 bg-white border-2 border-pink-500 text-pink-500 rounded-2xl font-bold transition-transform active:scale-95"
                        >
                            <Search size={24} /> 企画を探す
                        </Link>
                    </div>

                    <div className="space-y-1">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.href} href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center justify-between px-2 py-4 font-bold border-b border-slate-50 ${link.highlight ? 'text-rose-600' : 'text-slate-800'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`${link.highlight ? 'text-rose-500' : 'text-slate-400'}`}>
                                        {link.highlight ? <Star size={18} className="fill-rose-500" /> : link.icon}
                                    </span>
                                    {link.label}
                                </div>
                                <ChevronDown size={18} className="-rotate-90 text-slate-300" />
                            </Link>
                        ))}
                    </div>

                    {user && (
                        <div className="space-y-1 pt-4">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Account</p>
                            {userMenuItems.map((item) => (
                                <Link 
                                    key={item.href} href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-4 px-2 py-3 text-slate-600 font-bold"
                                >
                                    <span className="text-slate-400">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {!user && (
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-center py-3 bg-slate-100 rounded-xl font-bold text-slate-600">ログイン</Link>
                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-center py-3 bg-pink-500 text-white rounded-xl font-bold">新規登録</Link>
                        </div>
                    )}

                    {user && (
                        <button onClick={handleLogout} className="w-full py-4 text-red-500 font-bold border border-red-50 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
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