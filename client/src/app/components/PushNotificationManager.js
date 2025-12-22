'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiBell, FiLoader, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Base64文字列をUint8Arrayに変換するヘルパー関数
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // 完了演出用

  useEffect(() => {
    // ブラウザが Service Worker と Push API に対応しているかチェック
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        setIsSubscribed(true);
      }
    } catch (e) {
      console.error('Subscription check failed', e);
    }
  };

  const subscribeToPush = async () => {
    if (!user) return toast.error('ログインが必要です');
    if (!PUBLIC_KEY) return console.error('VAPID Public Keyが設定されていません');

    setLoading(true);
    const toastId = toast.loading('通知を設定中...');

    try {
      const registration = await navigator.serviceWorker.ready;

      // 1. 通知の権限をリクエスト
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        throw new Error('通知がブロックされています。ブラウザの設定から許可してください。');
      }

      // 2. プッシュ通知の購読 (ブラウザ)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
      });

      // 3. サーバーへ購読情報を送信
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });

      if (!res.ok) throw new Error('サーバーへの登録に失敗しました');

      // 4. テスト通知をトリガー (オプション)
      await fetch(`${API_URL}/api/push/test`, {
         method: 'POST', 
         headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success('通知をオンにしました！', { id: toastId });
      
      // 成功演出を入れてから非表示にする
      setSuccess(true);
      setTimeout(() => {
        setIsSubscribed(true);
      }, 2000); // 2秒後にボタンを消す

    } catch (error) {
      console.error(error);
      toast.error(error.message || '通知の登録に失敗しました', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // 表示条件: 
  // 1. ログインしている
  // 2. ブラウザが対応している
  // 3. まだ購読していない (または成功演出中)
  if (!user || !isSupported || (isSubscribed && !success)) return null;

  // 成功時の表示
  if (success) {
    return (
      <div className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white font-bold rounded-full shadow-lg animate-pulse">
        <FiCheck /> 設定完了！
      </div>
    );
  }

  // 通常時のボタン
  return (
    <button
      onClick={subscribeToPush}
      disabled={loading}
      className={`
        group flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold shadow-lg transition-all duration-300
        ${loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'}
      `}
    >
      {loading ? (
        <>
          <FiLoader className="animate-spin" /> 設定中...
        </>
      ) : (
        <>
          <FiBell className="group-hover:rotate-12 transition-transform" /> 
          <span className="whitespace-nowrap">通知を受け取る</span>
        </>
      )}
    </button>
  );
}