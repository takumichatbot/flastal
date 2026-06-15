'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

let registered = false;

export function usePushNotifications() {
  const { user, authenticatedFetch } = useAuth();

  useEffect(() => {
    if (!user || registered) return;

    const register = async () => {
      try {
        // Capacitor環境のみ動作
        const { PushNotifications } = await import('@capacitor/push-notifications');

        const perm = await PushNotifications.checkPermissions();
        let status = perm.receive;

        if (status === 'prompt') {
          const req = await PushNotifications.requestPermissions();
          status = req.receive;
        }

        if (status !== 'granted') return;

        await PushNotifications.register();

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
          console.log('[Push] foreground notification:', notification.title);
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
