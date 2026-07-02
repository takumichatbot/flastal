'use client';

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// App Store Connect に登録するコンシューマブル商品
// 各 ID は App Store Connect の商品 ID と一致させること
export const IAP_TIERS = [
  { productId: 'com.flastal.app.coin1000',  amount: 1000 },
  { productId: 'com.flastal.app.coin2000',  amount: 2000 },
  { productId: 'com.flastal.app.coin3000',  amount: 3000 },
  { productId: 'com.flastal.app.coin5000',  amount: 5000 },
  { productId: 'com.flastal.app.coin10000', amount: 10000 },
  { productId: 'com.flastal.app.coin20000', amount: 20000 },
  { productId: 'com.flastal.app.coin30000', amount: 30000 },
  { productId: 'com.flastal.app.coin50000', amount: 50000 },
];

// 指定金額に最も近い上のティアを返す（複数ティアの組み合わせは不要）
export function findClosestTier(amount) {
  return IAP_TIERS.find(t => t.amount >= amount) || IAP_TIERS[IAP_TIERS.length - 1];
}

export function useIAP() {
  const [ready, setReady] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    let store;
    let mounted = true;

    const init = async () => {
      try {
        const mod = await import('cordova-plugin-purchase');
        store = mod.store || window.CdvPurchase?.store;
        if (!store) return;

        store.verbosity = store.QUIET;

        // 商品登録
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

  const purchase = useCallback(async ({ productId, projectId, amount, comment, userId, authenticatedFetch, apiUrl }) => {
    if (!isNative) throw new Error('Not native');
    setPurchasing(true);

    try {
      const mod = await import('cordova-plugin-purchase');
      const store = mod.store || window.CdvPurchase?.store;
      if (!store) throw new Error('IAP store not available');

      return await new Promise((resolve, reject) => {
        // 購入完了ハンドラー
        store.when(productId).approved(async (transaction) => {
          try {
            // バックエンドでレシート検証 → 支援を記録
            const res = await authenticatedFetch(`${apiUrl}/api/payment/iap/verify`, {
              method: 'POST',
              body: JSON.stringify({
                receipt: transaction.transactionIdentifier || transaction.id,
                productId,
                projectId,
                amount,
                comment,
                userId,
                platform: 'ios',
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'IAP検証に失敗しました');

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
