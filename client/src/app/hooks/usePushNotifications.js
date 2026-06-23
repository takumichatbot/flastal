'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

let registered = false;

export function usePushNotifications() {
  const { user, authenticatedFetch } = useAuth();
  const listenersAdded = useRef(false);

  useEffect(() => {
    // WebブラウザではCapacitor Pushをスキップ（Web Pushはブラウザネイティブで処理）
    if (!Capacitor.isNativePlatform()) return;
    if (!user || registered) return;

    const register = async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        const perm = await PushNotifications.checkPermissions();
        let status = perm.receive;

        if (status === 'denied') {
          // ユーザーが明示的に拒否している場合は何もしない（OS設定で変更が必要なため）
          console.warn('[Push] 通知パーミッションがユーザーによって拒否されています。');
          return;
        }

        if (status === 'prompt' || status === 'prompt-with-rationale') {
          const req = await PushNotifications.requestPermissions();
          status = req.receive;
        }

        if (status !== 'granted') return;

        await PushNotifications.register();

        if (listenersAdded.current) return;
        listenersAdded.current = true;

        PushNotifications.addListener('registration', async ({ value: token }) => {
          registered = true;
          try {
            await authenticatedFetch(`${API_URL}/api/tools/native-device-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });
          } catch { /* ignore */ }
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          // フォアグラウンドでトースト表示
          const title = notification.title || 'FLASTAL';
          const body = notification.body || '';
          const url = notification.data?.url;

          toast(
            (t) => (
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => {
                  toast.dismiss(t.id);
                  if (url && typeof window !== 'undefined') window.location.href = url;
                }}
              >
                <span className="text-2xl shrink-0">🌸</span>
                <div className="min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{title}</p>
                  {body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{body}</p>}
                  {url && <p className="text-[10px] font-bold text-pink-500 mt-1">タップして確認 →</p>}
                </div>
              </div>
            ),
            { duration: 6000, style: { padding: '12px 14px', maxWidth: 340 } }
          );
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const url = action.notification?.data?.url;
          if (url && typeof window !== 'undefined') {
            window.location.href = url;
          }
        });
      } catch {
        // ネイティブ環境でない場合はスキップ
      }
    };

    register();
  }, [user, authenticatedFetch]);
}
