'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiBell } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Base64文字列をUint8Arrayに変換する関数
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
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
  };

  const subscribeToPush = async () => {
    if (!user) return toast.error('ログインが必要です');
    if (!PUBLIC_KEY) return console.error('VAPID Public Keyが設定されていません');

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // ブラウザに通知許可を求める
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
      });

      // サーバーに登録
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });

      setIsSubscribed(true);
      toast.success('プッシュ通知をオンにしました！');
      
      // テスト送信
      fetch(`${API_URL}/api/push/test`, {
         method: 'POST', 
         headers: { 'Authorization': `Bearer ${token}` }
      });

    } catch (error) {
      console.error(error);
      toast.error('通知の登録に失敗しました。ブラウザの設定を確認してください。');
    }
  };

  if (!isSupported || isSubscribed) return null; // 対応していないか登録済みなら非表示

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <button
        onClick={subscribeToPush}
        className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      >
        <FiBell /> 通知を受け取る
      </button>
    </div>
  );
}