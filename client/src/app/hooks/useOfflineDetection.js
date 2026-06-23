'use client';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * オフライン検知 hook
 * - ネイティブ (iOS / Android): @capacitor/network を使用
 * - Web: navigator.onLine / online・offline イベントを使用
 *
 * @returns {boolean} オフラインなら true
 */
export function useOfflineDetection() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // Web: navigator.onLine ベース
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Native: @capacitor/network を使用
    let cleanup;

    const setupNetworkListener = async () => {
      try {
        const { Network } = await import('@capacitor/network');

        // 現在の接続状態を取得
        const status = await Network.getStatus();
        setIsOffline(!status.connected);

        // 接続状態の変化を監視
        const listener = await Network.addListener('networkStatusChange', (status) => {
          setIsOffline(!status.connected);
        });

        cleanup = () => listener.remove();
      } catch (e) {
        // @capacitor/network 未インストール等の場合は無視
      }
    };

    setupNetworkListener();

    return () => cleanup?.();
  }, []);

  return isOffline;
}
