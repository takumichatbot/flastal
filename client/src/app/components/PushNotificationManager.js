'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Loader2, Check, X } from 'lucide-react'; 
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const { user, authenticatedFetch } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 基本的なサポートチェック
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.pushManager) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) setIsSubscribed(true);
      }
    } catch (e) {
      console.error('Subscription check failed', e);
    }
  };

  const subscribeToPush = async () => {
    if (!user) return toast.error('ログインが必要です');
    if (!PUBLIC_KEY) return toast.error('システムエラー：公開鍵が設定されていません');

    setLoading(true);
    let toastId = toast.loading('通知を設定中...');

    try {
      // 1. サポートチェック
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        throw new Error('お使いのブラウザはプッシュ通知をサポートしていません。iPhoneの場合はSafariの共有ボタンから「ホーム画面に追加」してアプリ化してください。');
      }

      // 2. 許可リクエスト
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await new Promise((resolve) => {
          const result = Notification.requestPermission(resolve);
          if (result && result.then) result.then(resolve);
        });
      }
      
      if (permission !== 'granted') {
        throw new Error('通知がブロックされています。端末の設定から許可してください。');
      }

      toast.loading('通信設定を準備中...', { id: toastId });

      // 3. Service Worker の登録とActive化の待機 (★ここを修正)
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        await navigator.serviceWorker.register('/sw.js');
      }

      // インストールが終わって「完全に起動（Active）」するまで待つ
      registration = await navigator.serviceWorker.ready;

      if (!registration || !registration.pushManager) {
        throw new Error('通知システムの初期化に失敗しました。ページを再読み込みしてください。');
      }

      toast.loading('サーバーへ登録中...', { id: toastId });

      // 4. サブスクライブ
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
      });

      // 5. サーバー送信
      const res = await authenticatedFetch(`${API_URL}/api/tools/subscribe-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      if (!res.ok) {
         const errData = await res.json().catch(()=>({}));
         throw new Error(errData.message || 'サーバーへの登録に失敗しました');
      }

      toast.success('通知をオンにしました！✨', { id: toastId });
      setSuccess(true);
      setTimeout(() => { setIsVisible(false); setIsSubscribed(true); }, 2500);

    } catch (error) {
      console.error('Push Error:', error);
      toast.error(error.message || '登録に失敗しました', { id: toastId, duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isSupported || (isSubscribed && !success) || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.3 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[340px] z-[90]"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl text-white p-5 md:p-6 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-slate-700 relative overflow-hidden">
            <button onClick={() => setIsVisible(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors"><X size={16} /></button>
            <div className="flex gap-4 items-start">
              <div className={cn("p-3.5 rounded-2xl shrink-0 shadow-inner transition-colors duration-500", success ? "bg-emerald-500 text-white" : "bg-pink-500 text-white")}>
                {success ? <Check size={24} /> : loading ? <Loader2 size={24} className="animate-spin" /> : <Bell size={24} />}
              </div>
              <div className="flex-1 pt-1">
                <h4 className="font-black text-base tracking-tight mb-1">{success ? '設定完了！' : '通知をオンにしますか？'}</h4>
                {!success && (
                  <>
                    <p className="text-slate-400 text-xs leading-relaxed font-medium mb-4">支援した企画の進捗や新着メッセージをリアルタイムでお知らせします。</p>
                    <motion.button 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={subscribeToPush} disabled={loading}
                      className="w-full bg-white text-slate-900 py-3 rounded-xl text-sm font-black hover:bg-pink-50 transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />}
                      {loading ? '設定中...' : '通知を受け取る'}
                    </motion.button>
                  </>
                )}
                {success && <p className="text-emerald-400 text-xs font-bold mt-1">これでお知らせを見逃しません✨</p>}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}