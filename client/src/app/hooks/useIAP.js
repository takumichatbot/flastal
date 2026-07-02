'use client';

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export const IAP_TIERS = [
  { productId: 'com.flastal.app.coin1000',  points: 1000,  price: 1000 },
  { productId: 'com.flastal.app.coin2000',  points: 2000,  price: 2000 },
  { productId: 'com.flastal.app.coin3000',  points: 3000,  price: 3000 },
  { productId: 'com.flastal.app.coin5000',  points: 5000,  price: 5000 },
  { productId: 'com.flastal.app.coin10000', points: 10000, price: 10000 },
  { productId: 'com.flastal.app.coin20000', points: 20000, price: 20000 },
  { productId: 'com.flastal.app.coin30000', points: 30000, price: 30000 },
  { productId: 'com.flastal.app.coin50000', points: 50000, price: 50000 },
];

export function useIAP() {
  const [ready, setReady] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    let mounted = true;

    const init = async () => {
      try {
        const mod = await import('cordova-plugin-purchase');
        const store = mod.store || window.CdvPurchase?.store;
        if (!store) return;

        store.verbosity = store.QUIET;

        store.register(IAP_TIERS.map(t => ({
          id: t.productId,
          type: store.CONSUMABLE,
          platform: store.APPLE_APPSTORE,
        })));

        store.ready(() => { if (mounted) setReady(true); });
        store.refresh();
      } catch (_) {}
    };

    init();
    return () => { mounted = false; };
  }, [isNative]);

  // 汎用購入関数: apiEndpoint と body を外から指定する
  const purchase = useCallback(async ({ productId, apiEndpoint, body, authenticatedFetch, apiUrl }) => {
    if (!isNative) throw new Error('Not native');
    setPurchasing(true);

    try {
      const mod = await import('cordova-plugin-purchase');
      const store = mod.store || window.CdvPurchase?.store;
      if (!store) throw new Error('IAP が利用できません');

      return await new Promise((resolve, reject) => {
        store.when(productId).approved(async (transaction) => {
          try {
            const receiptData =
              transaction.parentReceipt?.nativeData?.appStoreReceipt ||
              transaction.nativeData?.appStoreReceipt ||
              transaction.appStoreReceipt ||
              transaction.transactionIdentifier ||
              transaction.id;

            if (!receiptData) throw new Error('レシートの取得に失敗しました');

            const res = await authenticatedFetch(`${apiUrl}${apiEndpoint}`, {
              method: 'POST',
              body: JSON.stringify({ ...body, receipt: receiptData, productId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'IAP 検証に失敗しました');

            transaction.finish();
            resolve(data);
          } catch (err) {
            reject(err);
          }
        });

        store.when(productId).cancelled(() => {
          reject(new Error('購入がキャンセルされました'));
        });

        store.when(productId).error((err) => {
          reject(new Error(err?.message || 'IAP エラーが発生しました'));
        });

        store.order(productId);
      });
    } finally {
      setPurchasing(false);
    }
  }, [isNative]);

  return { ready, purchasing, purchase, isNative };
}
