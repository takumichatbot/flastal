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
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// クラス名を結合する便利関数
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// 🔔 通知ドロップダウン コンポーネント
// ==========================================
function NotificationDropdown({ notifications, fetchNotifications, unreadCount, authenticatedFetch }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    const handleMarkAllAsRead = async () => {
      if (unreadCount === 0) return;
      try {
        const response = await authenticatedFetch(`${API_URL}/api/notifications/readall`, { method: 'PATCH' });
        if (response.ok) { toast.success('全ての通知を既読にしました'); fetchNotifications(); }
      } catch (error) { toast.error('既読処理に失敗しました'); }
    };
  
    const handleRead = async (notificationId, linkUrl) => {
      setIsOpen(false);
      try {
        await authenticatedFetch(`${API_URL}/api/notifications/${notificationId}/read`, { method: 'PATCH' });
        fetchNotifications();
      } catch (error) { console.error(error); }
      if (linkUrl) window.location.href = linkUrl;
    };
  
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'NEW_PLEDGE': return <Heart className="text-pink-500" size={18} />;
        case 'NEW_ANNOUNCEMENT': return <Bell className="text-indigo-500" size={18} />;
        case 'TASK_ASSIGNED': return <CheckCircle2 className="text-sky-500" size={18} />;
        case 'OFFER_ACCEPTED': return <CheckCircle2 className="text-emerald-500" size={18} />;
        case 'OFFER_REJECTED': return <X className="text-rose-500" size={18} />;
        default: return <Bell className="text-slate-400" size={18} />;
      }
    };
  
    return (
      <div className="relative" ref={dropdownRef}>
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }} 
          className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-pink-500 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>
  
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden ring-1 ring-slate-100"
            >
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100/50 bg-slate-50/80">
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2"><Bell size={14} className="text-pink-500"/> 通知</h3>
                <button onClick={handleMarkAllAsRead} disabled={unreadCount === 0} className="text-[10px] font-black uppercase tracking-widest text-sky-500 hover:text-sky-600 disabled:text-slate-300 transition-colors">
                  すべて既読
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} onClick={() => handleRead(notif.id, notif.linkUrl)}
                      className={`px-5 py-4 flex gap-4 cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-sky-50/30' : ''}`}
                    >
                      <div className="mt-0.5 bg-white p-2 rounded-[1rem] shadow-sm border border-slate-100 shrink-0 h-fit">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!notif.isRead ? 'text-slate-800 font-black' : 'text-slate-500 font-bold'} line-clamp-2`}>{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-bold tracking-widest uppercase">{new Date(notif.createdAt).toLocaleDateString('ja-JP')}</p>
                      </div>
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0 shadow-sm shadow-sky-200" />}
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300"><Sparkles size={24} /></div>
                      <p className="text-slate-400 text-xs font-bold">新しい通知はありません</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
}

// ==========================================
// 🚀 ヘッダー メインコンポーネント
// ==========================================
export default function Header() {
  const { user, logout, isLoading, authenticatedFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const userMenuRef = useRef(null);
  
  // Magic Hover用のステート
  const [hoveredNav, setHoveredNav] = useState(null);
  
  // Smart Header用のステート
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    // 20px以上スクロールしたら「フローティング・ピル」化する
    setIsScrolled(latest > 20);
    // 下にスクロールしている最中は隠す、上にスクロールしたら見せる
    if (latest > previous && latest > 150) {
      setIsHidden(true);
      setIsUserMenuOpen(false); 
    } else {
      setIsHidden(false);
    }
  });

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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
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
      { href: '/projects', label: '企画一覧', icon: <Heart size={16}/> },
      { href: '/events', label: 'イベント', icon: <Calendar size={16}/> },
      { href: '/illustrators/recruitment', label: '絵師募集中', icon: <Star size={16}/> }, 
      { href: '/venues', label: '会場', icon: <MapPin size={16}/> },
      { href: '/florists', label: 'お花屋さん', icon: <Store size={16}/> },
    ];
    if (!user) return baseLinks;

    switch (user.role) {
      case 'FLORIST': return [
          { href: '/florists/dashboard', label: '受注管理', icon: <ClipboardList size={16}/> },
          { href: '/florists/dashboard?tab=pending', label: '届いたオファー', icon: <FileText size={16}/> },
          { href: '/venues', label: '配送先会場', icon: <MapPin size={16}/> },
      ];
      case 'VENUE': return [
          { href: `/venues/dashboard/${user.id}`, label: 'ダッシュボード', icon: <LayoutDashboard size={16}/> },
          { href: `/venues/${user.id}/logistics`, label: '搬入設定', icon: <Truck size={16}/> },
          { href: '/projects', label: '実施企画', icon: <Heart size={16}/> },
      ];
      case 'ORGANIZER': return [
          { href: '/organizers/dashboard', label: '主催企画', icon: <LayoutDashboard size={16}/> },
          { href: '/illustrators/recruitment', label: '絵師募集中', icon: <Star size={16}/> },
          { href: '/projects/create', label: '企画を立てる', icon: <Sparkles size={16}/> },
          { href: '/florists', label: '花屋を探す', icon: <Store size={16}/> },
      ];
      case 'ADMIN': return [
          { href: '/admin', label: '管理ホーム', icon: <BarChart3 size={16}/> },
          { href: '/admin/project-approval', label: '企画審査', icon: <UserCheck size={16}/> },
          { href: '/admin/settings', label: 'システム設定', icon: <Settings size={16}/> },
      ];
      default: return [
          ...baseLinks,
          { href: '/projects/create', label: '企画を立てる', icon: <PlusCircle size={16}/>, highlight: true },
      ];
    }
  }, [user]);

  const getPrimaryLink = useMemo(() => {
    if (!user || !user.id) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'FLORIST': return `/florists/${user.id}`; 
      case 'VENUE': return `/venues/dashboard/${user.id}`;
      case 'ORGANIZER': return '/organizers/dashboard';
      default: return '/mypage';
    }
  }, [user]);

  const userMenuItems = useMemo(() => {
    if (!user) return [];
    switch (user.role) {
      case 'ADMIN': return [
          { href: '/admin', label: '管理ホーム', icon: <ShieldCheck size={14} /> },
          { href: '/admin/email-templates', label: 'メール設定', icon: <FileText size={14} /> },
          { href: '/admin/settings', label: 'システム設定', icon: <Settings size={14} /> },
      ];
      case 'FLORIST': return [
          { href: '/florists/dashboard', label: '受注管理画面', icon: <Briefcase size={14} /> },
          { href: `/florists/${user.id}`, label: '店舗プロフィール', icon: <Store size={14} /> },
          { href: '/florists/profile/edit', label: 'プロフィール編集', icon: <Settings size={14} /> }, 
          { href: '/florists/payouts', label: '売上・出金', icon: <BarChart3 size={14} /> },
      ];
      case 'VENUE': return [
          { href: `/venues/dashboard/${user.id}`, label: 'ダッシュボード', icon: <LayoutDashboard size={14} /> },
          { href: `/venues/dashboard/${user.id}/edit`, label: '基本設定・ルール', icon: <Building2 size={14} /> },
          { href: `/venues/${user.id}/logistics`, label: '搬入・物流設定', icon: <Package size={14} /> },
      ];
      case 'ORGANIZER': return [
          { href: '/organizers/dashboard', label: '企画管理ホーム', icon: <LayoutDashboard size={14} /> },
          { href: '/organizers/profile', label: '主催者情報設定', icon: <User size={14} /> },
          { href: '/organizers/messages', label: '参加者メッセージ', icon: <Bell size={14} /> },
      ];
      default: return [
          { href: '/mypage', label: '参加した企画', icon: <Heart size={14} /> },
          { href: '/mypage?tab=created', label: '主催した企画', icon: <ClipboardList size={14} /> },
          { href: '/mypage/edit', label: 'プロフィール設定', icon: <Settings size={14} /> },
      ];
    }
  }, [user]);

  return (
    // ★ 修正ポイント: 全幅(100%)で背景とボーダーを適用し、中身だけを max-w-7xl に制限する
    <motion.header 
      variants={{ visible: { y: 0, opacity: 1 }, hidden: { y: "-120%", opacity: 0 } }}
      animate={isHidden ? "hidden" : "visible"}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} 
      className={cn(
        "fixed top-0 inset-x-0 z-[100] flex justify-center transition-all duration-500",
        isScrolled 
          ? "pt-2 md:pt-4 px-2 md:px-4 bg-transparent border-transparent" // スクロール時: 背景を消してカプセルを下げる
          : "bg-white/95 backdrop-blur-md border-b border-slate-200/60 h-16 md:h-20" // 初期状態: 全幅背景＆下線
      )}
    >
      <div 
        className={cn(
            "flex items-center justify-between w-full max-w-7xl transition-all duration-500 mx-auto",
            isScrolled 
              ? "bg-white/85 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-200/50 h-14 md:h-16 rounded-full px-4 md:px-6" // カプセル状
              : "h-full px-4 sm:px-6 lg:px-8 bg-transparent border-transparent" // 初期状態: 背景や線は外枠に任せる
        )}
      >
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative w-8 h-8 overflow-hidden rounded-[10px] shadow-sm group-hover:scale-105 transition-transform duration-300">
                <Image src="/icon-512x512.png" alt="FLASTAL" fill className="object-cover" priority />
              </div>
              <span className={`font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tighter group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300 ${isScrolled ? 'hidden sm:block text-xl' : 'text-xl md:text-2xl'}`}>
                FLASTAL
              </span>
            </Link>

            <nav className="hidden lg:flex items-center relative" onMouseLeave={() => setHoveredNav(null)}>
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onMouseEnter={() => setHoveredNav(link.href)}
                  className="relative px-4 py-2 text-sm font-bold flex items-center gap-2 group z-10"
                >
                  {hoveredNav === link.href && (
                    <motion.div
                      layoutId="magic-nav-pill"
                      className="absolute inset-0 bg-slate-100/80 rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className={cn("transition-colors flex items-center gap-2", link.highlight ? 'text-rose-500' : 'text-slate-600 group-hover:text-slate-900')}>
                    <span className={cn("transition-colors inline-block group-hover:scale-110 duration-300", link.highlight ? 'text-rose-400' : 'text-slate-400 group-hover:text-pink-500')}>
                      {link.highlight ? <Star size={16} className="fill-rose-400" /> : link.icon}
                    </span>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-3">
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
                    className={cn(
                        "flex items-center gap-2 py-1 rounded-full bg-white hover:bg-slate-50 transition-all group",
                        isScrolled ? 'pr-1 pl-1 border-transparent' : 'pr-1 pl-1 md:pr-3 border border-slate-200 hover:shadow-sm'
                    )}
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100 shrink-0 transition-transform group-hover:scale-105">
                        {user.iconUrl ? (
                            <Image src={user.iconUrl} alt="User Icon" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-indigo-400"><User size={16}/></div>
                        )}
                    </div>
                    {!isScrolled && (
                        <>
                           <span className="text-sm font-bold hidden sm:block text-slate-700 max-w-[100px] truncate">{displayName}</span>
                           <ChevronDown size={14} className={`text-slate-400 transition-transform hidden md:block duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </>
                    )}
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden ring-1 ring-slate-100 origin-top-right"
                        >
                        <Link href={getPrimaryLink} onClick={() => setIsUserMenuOpen(false)} className="block px-6 py-5 border-b border-slate-50 bg-gradient-to-br from-slate-50 to-white hover:from-pink-50 hover:to-white transition-colors">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Signed in as</p>
                            <p className="text-sm font-black text-slate-800 truncate">{displayName}</p>
                            <div className="mt-2">
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-pink-100 text-pink-600 border border-pink-200 inline-block uppercase tracking-widest">
                                    {user.role}
                                </span>
                            </div>
                        </Link>
                        <div className="p-3 space-y-1">
                            {userMenuItems.map((item) => (
                                <Link key={item.href} href={item.href} onClick={() => setIsUserMenuOpen(false)} 
                                    className="flex items-center px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-pink-600 rounded-2xl transition-colors group"
                                >
                                    <span className="mr-3 text-slate-400 group-hover:text-pink-400 transition-colors group-hover:scale-110">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                            <div className="h-px bg-slate-100 my-2 mx-3"></div>
                            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors group">
                                <LogOut className="mr-3 group-hover:scale-110 transition-transform" size={14} /> ログアウト
                            </button>
                        </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 md:gap-3">
                <Link href="/login" className="hidden md:flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-full transition-all">
                  ログイン
                </Link>
                <Link href="/register">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-full shadow-lg hover:shadow-xl transition-all">
                        <Sparkles size={14} className="text-pink-400"/> 登録
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="lg:hidden fixed inset-0 top-0 left-0 w-full h-[100dvh] bg-white/95 backdrop-blur-2xl z-[200] overflow-y-auto"
            >
                <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-white sticky top-0 z-10">
                    <span className="text-xl font-black text-slate-900 tracking-tighter">FLASTAL</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-6 space-y-8 pb-32">
                    {user && (
                        <div className="flex items-center justify-between bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm">
                                    {user.iconUrl ? <Image src={user.iconUrl} alt="User Avatar" fill className="object-cover" /> : <User size={24} className="m-3 text-slate-300" />}
                                </div>
                                <div>
                                    <p className="font-black text-lg text-slate-800">{displayName}</p>
                                    <Link href={getPrimaryLink} onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-1 block">マイページへ &rarr;</Link>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/projects/create" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center justify-center gap-2 py-6 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-[2rem] font-black shadow-lg shadow-pink-200 transition-transform active:scale-95">
                            <PlusCircle size={28} /> 企画を立てる
                        </Link>
                        <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center justify-center gap-2 py-6 bg-white border-2 border-pink-50 text-pink-500 hover:bg-pink-50 rounded-[2rem] font-black transition-transform active:scale-95 shadow-sm">
                            <Search size={28} /> 企画を探す
                        </Link>
                    </div>

                    <div className="space-y-1">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center justify-between px-4 py-4 font-black rounded-2xl transition-colors ${link.highlight ? 'text-rose-600 bg-rose-50' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`${link.highlight ? 'text-rose-500' : 'text-slate-400'}`}>
                                        {link.highlight ? <Star size={20} className="fill-rose-500" /> : link.icon}
                                    </span>
                                    {link.label}
                                </div>
                                <ChevronDown size={18} className="-rotate-90 text-slate-300" />
                            </Link>
                        ))}
                    </div>

                    {user && (
                        <div className="space-y-1 pt-6 border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 pl-4">Account Menu</p>
                            {userMenuItems.map((item) => (
                                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-4 py-3.5 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-colors">
                                    <span className="text-slate-400">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {!user && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-center py-4 bg-slate-100 rounded-2xl font-black text-slate-600">ログイン</Link>
                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-center py-4 bg-slate-900 text-white rounded-2xl font-black">新規登録</Link>
                        </div>
                    )}

                    {user && (
                        <button onClick={handleLogout} className="w-full mt-4 py-5 text-rose-500 font-black border-2 border-rose-50 rounded-[2rem] hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 active:scale-95">
                            <LogOut size={18} /> ログアウト
                        </button>
                    )}
                </nav>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}