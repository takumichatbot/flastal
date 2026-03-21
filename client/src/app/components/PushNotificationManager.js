'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiBell, FiLoader, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

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
    // ブラウザがPush通知とService Workerをサポートしているか確認
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      // readyではなくgetRegistrationを使い、無限待機を回避する
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
    if (!user) {
      return toast.error('ログインが必要です');
    }
    if (!PUBLIC_KEY) {
      console.error('VAPID Public Keyが設定されていません');
      return toast.error('システムエラー：通知の公開鍵が設定されていません');
    }

    setLoading(true);
    let toastId;

    try {
      toastId = toast.loading('通知を設定中...');

      // 1. 通知の許可をリクエスト（ユーザーが拒否している場合はエラーを投げる）
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('ブラウザの通知がブロックされています。設定から許可してください。');
      }

      // 2. Service Workerの明示的な取得と登録
      // （navigator.serviceWorker.ready は未登録時に無限待機するため使用しない）
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        // next-pwa のデフォルトである /sw.js を登録する
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      if (!registration || !registration.pushManager) {
        throw new Error('プッシュ通知がサポートされていない環境です。');
      }

      // 3. Push Managerへのサブスクライブ
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
      });

      // 4. サーバーへ登録情報を送信
      const res = await authenticatedFetch(`${API_URL}/api/tools/subscribe-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      if (!res.ok) throw new Error('サーバーへの登録に失敗しました');

      toast.success('通知をオンにしました！', { id: toastId });
      setSuccess(true);
      setTimeout(() => setIsSubscribed(true), 2000);

    } catch (error) {
      console.error('Push Notification Error:', error);
      if (toastId) {
        toast.error(error.message || '登録に失敗しました', { id: toastId });
      } else {
        toast.error(error.message || '登録に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isSupported || (isSubscribed && !success) || !isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[90] animate-fadeIn">
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden">
        <button onClick={() => setIsVisible(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">
          <FiX size={18} />
        </button>
        <div className="flex gap-4 items-start">
          <div className="bg-pink-500 p-3 rounded-2xl shrink-0">
            {success ? <FiCheck size={24} /> : loading ? <FiLoader size={24} className="animate-spin" /> : <FiBell size={24} />}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">{success ? '設定完了！' : '通知をオンにしますか？'}</h4>
            {!success && (
              <>
                <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                  支援した企画の進捗や新着メッセージをリアルタイムでお知らせします。
                </p>
                <button 
                  onClick={subscribeToPush}
                  disabled={loading}
                  className="mt-4 w-full bg-white text-slate-900 py-2 rounded-xl text-xs font-black hover:bg-slate-100 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {loading && <FiLoader size={14} className="animate-spin" />}
                  {loading ? '設定中...' : '通知を受け取る'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}