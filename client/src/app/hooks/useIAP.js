'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

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

// cordova-plugin-purchase v13 対応。
// v11/v12 の store.refresh() / store.when(productId).cancelled()... は v13 で廃止・変更されており、
// 旧APIを呼ぶと例外が発生して「購入時にエラー」になる（Apple審査 2.1(a) リジェクトの原因）。
export function useIAP() {
  const [ready, setReady] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const storeRef = useRef(null);
  // 進行中の注文を productId ごとに保持。
  // v13 の store.when() はグローバル（商品ごとの絞り込み不可）なので、
  // コールバックは初期化時に1度だけ登録し、承認されたトランザクションをこのMapで対応する注文へ振り分ける。
  const pendingRef = useRef(new Map());

  useEffect(() => {
    if (!isNative) return;
    let mounted = true;

    const init = async () => {
      try {
        const mod = await import('cordova-plugin-purchase');
        const store = mod.store || (typeof window !== 'undefined' && window.CdvPurchase?.store);
        if (!store) return;
        storeRef.current = store;

        store.verbosity = store.QUIET;

        store.register(IAP_TIERS.map(t => ({
          id: t.productId,
          type: store.CONSUMABLE,
          platform: store.APPLE_APPSTORE,
        })));

        // 決済成功時: サーバー検証 → finish → 対応する注文を resolve。
        store.when().approved(async (transaction) => {
          const productId =
            transaction.products?.[0]?.id ||
            pendingRef.current.keys().next().value;
          const pending = productId ? pendingRef.current.get(productId) : null;

          // 対応する進行中注文がない孤立トランザクション（前回の起動中に検証が失敗して
          // 未 finish のまま再提示された購入など）。ここで finish して捨てると、
          // 支払い済みなのにポイント未付与のまま失われる。
          // ログイン済みなら復旧付与を試み、成功/処理済みのときだけ finish する。
          if (!pending) {
            try {
              const token = typeof window !== 'undefined' ? window.__flastalToken : null;
              const tier = productId && IAP_TIERS.find(t => t.productId === productId);
              const receiptData =
                transaction.parentReceipt?.nativeData?.appStoreReceipt ||
                transaction.parentReceipt?.appStoreReceipt;
              if (token && tier && receiptData) {
                const res = await fetch(`${BACKEND_URL}/api/payment/iap/points`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ points: tier.points, receipt: receiptData, productId }),
                });
                // 付与成功、または「既に処理済み」(サーバーは冪等に success を返す)なら finish
                if (res.ok) {
                  await transaction.finish();
                }
                // 失敗時は finish せず、次回起動時に再度復旧を試みる
              }
              // トークン/レシートが無い場合も finish しない（次回に持ち越す）
            } catch (_) {
              // ネットワークエラー等：finish せず持ち越す
            }
            return;
          }

          try {
            const receiptData =
              transaction.parentReceipt?.nativeData?.appStoreReceipt ||
              transaction.parentReceipt?.appStoreReceipt;
            if (!receiptData) throw new Error('レシートの取得に失敗しました');

            const { authenticatedFetch, apiUrl, apiEndpoint, body } = pending.ctx;
            const res = await authenticatedFetch(`${apiUrl}${apiEndpoint}`, {
              method: 'POST',
              body: JSON.stringify({ ...body, receipt: receiptData, productId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'IAP 検証に失敗しました');

            // サーバーでのポイント付与が成功してから finish する（順序厳守）。
            await transaction.finish();
            pendingRef.current.delete(productId);
            pending.resolve(data);
          } catch (err) {
            pendingRef.current.delete(productId);
            pending.reject(err instanceof Error ? err : new Error('IAP 検証に失敗しました'));
          }
        });

        // 決済エラー（ユーザーキャンセル含む）を対応する注文へ反映する。
        store.error((err) => {
          const targetId = err?.productId && pendingRef.current.has(err.productId)
            ? [err.productId]
            : Array.from(pendingRef.current.keys());
          const cancelled = err?.code === store.PAYMENT_CANCELLED;
          for (const pid of targetId) {
            const pending = pendingRef.current.get(pid);
            if (!pending) continue;
            pendingRef.current.delete(pid);
            pending.reject(new Error(
              cancelled ? '購入がキャンセルされました' : (err?.message || 'IAP エラーが発生しました')
            ));
          }
        });

        store.ready(() => { if (mounted) setReady(true); });

        // v13 は initialize() で各プラットフォームのアダプタを初期化し商品を読み込む（旧 refresh() の代替）。
        await store.initialize([store.APPLE_APPSTORE]);
        if (mounted && store.isReady) setReady(true);
      } catch (_) {
        // 初期化失敗時は ready=false のまま。UI 側で購入ボタンを無効化する。
      }
    };

    init();
    return () => { mounted = false; };
  }, [isNative]);

  // 汎用購入関数: apiEndpoint と body を外から指定する（ポイント購入・企画支援で共用）。
  const purchase = useCallback(async ({ productId, apiEndpoint, body, authenticatedFetch, apiUrl }) => {
    if (!isNative) throw new Error('Not native');
    const store = storeRef.current;
    if (!store) throw new Error('IAP が利用できません');

    const offer = store.get(productId)?.getOffer();
    if (!offer) throw new Error('商品情報を読み込めませんでした。通信環境を確認してもう一度お試しください。');

    setPurchasing(true);
    try {
      return await new Promise((resolve, reject) => {
        pendingRef.current.set(productId, {
          resolve, reject,
          ctx: { authenticatedFetch, apiUrl, apiEndpoint, body },
        });

        // v13 の order() は Offer を受け取り、失敗時は IError を「resolve」で返す（reject ではない）。
        // 成功時は undefined を返し、実際の完了は approved / error コールバックが決着させる。
        Promise.resolve(store.order(offer)).then((err) => {
          if (!err) return;
          if (!pendingRef.current.has(productId)) return; // 既に approved/error で決着済み
          pendingRef.current.delete(productId);
          if (err.code === store.PAYMENT_CANCELLED) {
            reject(new Error('購入がキャンセルされました'));
          } else {
            reject(new Error(err.message || 'IAP エラーが発生しました'));
          }
        }).catch((e) => {
          if (!pendingRef.current.has(productId)) return;
          pendingRef.current.delete(productId);
          reject(e instanceof Error ? e : new Error('IAP エラーが発生しました'));
        });
      });
    } finally {
      setPurchasing(false);
    }
  }, [isNative]);

  return { ready, purchasing, purchase, isNative };
}
