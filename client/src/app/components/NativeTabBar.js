'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Home, Heart, MessageCircle, Bell, Settings, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePushNotifications } from '@/app/hooks/usePushNotifications';
import { triggerHaptic } from '@/app/hooks/useHaptics';

const TABS = [
  { id: 'home',          label: 'ホーム',   icon: Home,          href: '/mypage' },
  { id: 'explore',       label: '探す',     icon: Compass,       href: '/projects' },
  { id: 'chat',          label: 'チャット', icon: MessageCircle, href: '/chat' },
  { id: 'notifications', label: '通知',     icon: Bell,          href: '/mypage?tab=notifications' },
  { id: 'settings',      label: '設定',     icon: Settings,      href: '/mypage?tab=settings' },
];

function getActiveTab(pathname, tab) {
  if (pathname.startsWith('/chat')) return 'chat';
  if (pathname === '/mypage' || pathname.startsWith('/mypage')) {
    if (tab === 'notifications') return 'notifications';
    if (tab === 'settings')      return 'settings';
    return 'home';
  }
  if (pathname.startsWith('/projects') || pathname.startsWith('/matching') || pathname.startsWith('/events') || pathname.startsWith('/venues') || pathname.startsWith('/florists') || pathname.startsWith('/illustrators')) return 'explore';
  return null;
}

export default function NativeTabBar() {
  const [isNative, setIsNative] = useState(false);
  const [unread, setUnread] = useState(0);
  usePushNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authenticatedFetch } = useAuth();

  useEffect(() => {
    const fromSession = sessionStorage.getItem('nativeApp') === '1';
    const fromCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    setIsNative(fromSession || fromCapacitor);
  }, []);

  const fetchUnread = useCallback(async () => {
    if (!user || !authenticatedFetch) return;
    try {
      const res = await authenticatedFetch('/api/notifications');
      if (res?.ok) {
        const data = await res.json();
        setUnread(data.filter(n => !n.isRead).length);
      }
    } catch { /* ignore */ }
  }, [user, authenticatedFetch]);

  useEffect(() => {
    if (!isNative || !user) return;
    fetchUnread();
    const t = setInterval(fetchUnread, 30000);
    return () => clearInterval(t);
  }, [isNative, user, fetchUnread]);

  // Android バックボタンハンドリング
  // NOTE: @capacitor/app が必要です。未インストールの場合は `npm install @capacitor/app` を実行してください。
  useEffect(() => {
    if (!isNative) return;
    let backHandler;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backHandler = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // 最初のページではアプリを最小化（終了はしない）
            App.minimizeApp();
          }
        });
      } catch (e) {
        // Web ブラウザ、または @capacitor/app 未インストール時は無視
      }
    };

    setupBackButton();

    return () => {
      backHandler?.remove();
    };
  }, [isNative]);

  const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify', '/app'];
  if (!isNative || AUTH_PAGES.some(p => pathname?.startsWith(p))) return null;

  const tab = searchParams.get('tab') || '';
  const activeId = getActiveTab(pathname, tab);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-end h-16 max-w-xl mx-auto px-2">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = activeId === t.id;

          return (
            <button
              key={t.id}
              onClick={async () => {
                await triggerHaptic('light');
                router.push(t.href);
              }}
              className="relative flex flex-col items-center justify-center w-full h-full pb-1.5 pt-1 transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="native-tab-pill"
                  className="absolute inset-x-2 -top-2 bottom-1 bg-pink-50 rounded-xl -z-10"
                />
              )}
              <div className="relative mb-1">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-pink-500' : 'text-slate-400'}
                />
                <AnimatePresence>
                  {t.id === 'notifications' && unread > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[8px] font-black min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                    >
                      {unread > 9 ? '9+' : unread}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className={`text-[9px] font-black transition-colors ${isActive ? 'text-pink-500' : 'text-slate-400'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
